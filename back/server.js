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
  type: { type: String, enum: ['code', 'output'] }, // 文件类型
  reference: { type: mongoose.Schema.Types.ObjectId, ref: 'File' }, // 关联的正确输出
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
  { name: 'expectedOutput', maxCount: 1 }
]), async (req, res) => {
  try {
    // 保存正确输出文件
    const outputFile = new File({
      filename: req.files.expectedOutput[0].originalname,
      contentType: req.files.expectedOutput[0].mimetype,
      size: req.files.expectedOutput[0].size,
      type: 'output',
      data: req.files.expectedOutput[0].buffer
    });
    await outputFile.save();

    // 保存代码文件
    const codeFile = new File({
      filename: req.files.code[0].originalname,
      contentType: req.files.code[0].mimetype,
      size: req.files.code[0].size,
      type: 'code',
      reference: outputFile._id,
      data: req.files.code[0].buffer
    });
    await codeFile.save();

    res.json({
      codeId: codeFile._id,
      outputId: outputFile._id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 路由：执行代码验证
app.post('/verify/:codeId', async (req, res) => {
  try {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'code-'));
    // 设置目录权限（新增）
    await fs.chmod(tmpDir, 0o777);  // 755权限
    const codePath = path.join(tmpDir, 'code.c');
    const outputPath = path.join(tmpDir, 'output.txt');

    // 获取代码文件
    const codeFile = await File.findById(req.params.codeId);
    if (!codeFile || codeFile.type !== 'code') {
      throw new Error('无效的代码文件');
    }

    // 获取正确输出文件
    const expectedFile = await File.findById(codeFile.reference);
    if (!expectedFile || expectedFile.type !== 'output') {
      throw new Error('未找到正确输出文件');
    }

    // 写入临时文件
    await fs.writeFile(codePath, codeFile.data);

    const dockerCmd = [
      'docker run --rm',
      '--memory=100m',
      '--cpus=1',
      '--network=none',
      '--user 1001',  // 指定容器运行时用户UID
      `-v "${tmpDir}":/app:z`,  // :z 标签解决 SELinux 限制
      'code-runner-gcc',
      '/bin/bash -c "gcc /app/code.c -o /app/code && /app/code > /app/output.txt 2>&1"'
    ].join(' ');

    // 执行并等待
    await execAsync(dockerCmd, { timeout: 15000 });

    // 获取实际输出
    const actualOutput = await fs.readFile(outputPath, 'utf-8');
    const expectedOutput = expectedFile.data.toString('utf-8');

    // 清理临时文件
    await fs.rm(tmpDir, { recursive: true, force: true });

    // 比较输出结果
    const isMatch = normalizeOutput(actualOutput) === normalizeOutput(expectedOutput);

    res.json({
      match: isMatch,
      actual: actualOutput,
      expected: expectedOutput
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
      actual: err.stderr || err.stdout
    });
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