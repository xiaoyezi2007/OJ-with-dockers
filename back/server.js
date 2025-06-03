import express from 'express';
import cors from 'cors'; // 新增
import mongoose from 'mongoose';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

// MongoDB 文件模型
const FileSchema = new mongoose.Schema({
  filename: String,
  contentType: String,
  size: Number,
  type: {
    type: String,
    enum: ['code', 'output', 'input'] // 增加 input 类型
  },
  reference: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
  inputFile: { type: mongoose.Schema.Types.ObjectId, ref: 'File' }, // 新增输入文件引用
  data: Buffer,
  createdAt: { type: Date, default: Date.now }
});

const File = mongoose.model('File', FileSchema);

// Express配置
const app = express();
app.use(cors()); // 新增
app.use(express.json());

// Multer配置
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB限制
});

mongoose.set('strictQuery', false); // 新增此行

// 数据库连接（修正后的配置）
async function connectDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/code_runner', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB 连接成功');
  } catch (err) {
    console.error('❌ MongoDB 连接失败:', err.message);
    process.exit(1);
  }
}
connectDB();

// 路由：上传代码文件及其正确输出
app.post('/upload', upload.fields([
  { name: 'code', maxCount: 1 },
  { name: 'expectedOutput', maxCount: 1 },
  { name: 'inputFile', maxCount: 1 } // 新增输入文件
]), async (req, res) => {
  try {
    let inputFile = null;
    if (req.files.inputFile && req.files.inputFile[0]) {
      inputFile = new File({
        filename: req.files.inputFile[0].originalname,
        contentType: req.files.inputFile[0].mimetype,
        size: req.files.inputFile[0].size,
        type: 'input',
        data: req.files.inputFile[0].buffer
      });
      await inputFile.save();
      console.log(`输入文件保存成功，ID: ${inputFile._id}`);
    } else {
      console.log('未接收到输入文件');
    }
    

    // 保存预期输出文件
    const outputFile = new File({
      filename: req.files.expectedOutput[0].originalname,
      contentType: req.files.expectedOutput[0].mimetype,
      size: req.files.expectedOutput[0].size,
      type: 'output',
      data: req.files.expectedOutput[0].buffer
    });
    await outputFile.save();

    // 保存代码文件（关联输入和输出）
    const codeFile = new File({
      filename: req.files.code[0].originalname,
      contentType: req.files.code[0].mimetype,
      size: req.files.code[0].size,
      type: 'code',
      reference: outputFile._id,
      inputFile: inputFile ? inputFile._id : null, // 关键修复
      data: req.files.code[0].buffer
    });
    await codeFile.save();

    res.json({
      codeId: codeFile._id,
      outputId: outputFile._id,
      inputId: inputFile ? inputFile._id : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 路由：/verify/:codeId
app.post('/verify/:codeId', async (req, res) => {
  let tmpDir = ''; // 在try外部声明，以便catch中也能访问
  try {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'code-'));
    await fs.chmod(tmpDir, 0o777);
    
    const codePath = path.join(tmpDir, 'code.c');
    const inputPath = path.join(tmpDir, 'input.txt');
    const outputPath = path.join(tmpDir, 'output.txt');

    const codeFile = await File.findById(req.params.codeId);
    if (!codeFile || codeFile.type !== 'code') {
      console.error(`错误: 未找到代码文件或类型不正确，ID: ${req.params.codeId}`);
      throw new Error('无效的代码文件');
    }
    
    // 获取关联的预期输出文件
    const expectedOutputFile = await File.findById(codeFile.reference);
    // ***** 新增检查 *****
    if (!expectedOutputFile) {
      console.error(`错误: 未找到预期的输出文件，参考ID: ${codeFile.reference}`);
      throw new Error('预期的输出文件未找到');
    }
    
    const inputFile = codeFile.inputFile 
      ? await File.findById(codeFile.inputFile) 
      : null;
    
    const hasInput = inputFile && 
                     inputFile.type === 'input' && 
                     Buffer.isBuffer(inputFile.data); // inputFile.data 可以是空Buffer
    
    console.log(`验证请求: 代码ID=${req.params.codeId}, 是否有输入=${hasInput}`, {
      inputFileIdOnCodeFile: codeFile.inputFile, // 这是存在codeFile文档上的ID
      inputFileDocExists: !!inputFile,        // 这是通过ID实际查找到的文档是否存在
      inputFileDocType: inputFile?.type,
      isInputDataBuffer: Buffer.isBuffer(inputFile?.data)
    });

    await fs.writeFile(codePath, codeFile.data);
    
    if (hasInput) {
      await fs.writeFile(inputPath, inputFile.data);
      console.log(`输入文件内容 (前100字节): ${inputFile.data.toString().substring(0, 100)}`);
    } else {
      // 即使没有输入，也创建一个空的 input.txt，以防C程序或shell命令因文件不存在而异常
      await fs.writeFile(inputPath, '');
      console.log('无有效输入文件，已创建空的 input.txt');
    }

    let runCmd;
    if (hasInput) {
      runCmd = 'gcc /app/code.c -o /app/code && /app/code < /app/input.txt';
    } else {
      runCmd = 'gcc /app/code.c -o /app/code && /app/code';
    }
    runCmd += ' > /app/output.txt 2>&1';
    
    const dockerCmd = [
      'docker run --rm',
      '--memory=100m',
      '--cpus=1',
      '--network=none',
      '--user 1001',
      `-v "${tmpDir}":/app:z`,
      'code-runner-gcc',
      `/bin/bash -c "${runCmd.replace(/"/g, '\\"')}"` // 转义内部引号以防万一
    ].join(' ');
    
    console.log(`执行命令: ${dockerCmd}`);
    await execAsync(dockerCmd, { timeout: 15000 });
    console.log('Docker命令执行成功');

    const actualOutput = await fs.readFile(outputPath, 'utf-8');
    
    // ***** 关键修复 *****
    // 使用 expectedOutputFile 来获取数据
    const expectedOutput = expectedOutputFile.data.toString('utf-8'); 
    
    console.log(`实际输出长度: ${actualOutput.length}, 预期输出长度: ${expectedOutput.length}`);

    await fs.rm(tmpDir, { recursive: true, force: true });
    tmpDir = ''; // 清理后标记为空

    const isMatch = normalizeOutput(actualOutput) === normalizeOutput(expectedOutput);

    res.json({
      match: isMatch,
      actual: actualOutput,
      expected: expectedOutput,
      hasInput: hasInput
    });
  } catch (err) {
    console.error('验证错误:', err); // 保持这个详细错误日志
    // 尝试从错误对象中获取更多信息
    let stderrContent = err.stderr || '';
    if (err.stdout) stderrContent += `\nSTDOUT (from error): ${err.stdout}`;
    
    // 如果执行失败，也尝试读取outputPath的内容，可能包含部分输出或错误
    if (tmpDir) { // 确保 tmpDir 被赋值过
        const errorOutputPath = path.join(tmpDir, 'output.txt');
        try {
            if (await fs.access(errorOutputPath).then(() => true).catch(() => false)) {
                const partialOutput = await fs.readFile(errorOutputPath, 'utf-8');
                if (partialOutput) stderrContent += `\nPartial output.txt (on error): ${partialOutput}`;
            }
        } catch (readErr) {
            // ignore if can't read partial output
        }
    }

    res.status(500).json({ 
      error: err.message,
      stderr: stderrContent,
    });
  } finally { // 确保 tmpDir 在任何情况下都被尝试删除
    if (tmpDir) { // 只有当 tmpDir 被赋值（即 mkdtemp 成功）后才尝试删除
        try {
            await fs.rm(tmpDir, { recursive: true, force: true });
        } catch (cleanupErr) {
            console.error('清理临时目录错误:', cleanupErr);
        }
    }
  }
});

// 标准化输出比较
function normalizeOutput(str) {
  return str
    .replace(/\r\n/g, '\n')  // 统一换行符
    .replace(/\s+$/g, '')    // 去除尾部空白
    .trim();
}

// 启动服务器
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});