import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

import File from '../models/File.js'; // 确保 File 模型已导入
import upload from '../middleware/multerConfig.js';
import normalizeOutput from '../utils/normalizeOutput.js';

dotenv.config();
const execAsync = promisify(exec);
const router = express.Router();

// ==================== 新增/修改的代码开始 ====================

// 路由: GET /api/files (获取列表)
router.get('/', async (req, res) => {
  try {
    // 1. 从请求的查询参数中获取 page 和 limit，并设置默认值
    const page = parseInt(String(req.query.page)) || 1;
    const limit = parseInt(String(req.query.limit)) || 10;
    const skip = (page - 1) * limit; // 计算需要跳过的条目数

    // 2. 创建一个查询对象，以便未来可以添加筛选功能
    const query = {}; // 例如可以添加 req.query.keyword 等

    // 3. 分别查询总条目数和当前页的数据
    const totalItems = await File.countDocuments(query);
    const files = await File.find(query)
      .sort({ _id: -1 }) // 按创建时间倒序排列
      .skip(skip)
      .limit(limit);

    // 4. 以标准格式返回数据和分页信息
    res.json({
      items: files,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalItems: totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    });

  } catch (err) {
    console.error("Get all files error:", err);
    res.status(500).json({ error: 'Server error while fetching files.' });
  }
});

// 路由: GET /api/files/:id
// 功能: 获取单个文件的详情（为前端的“题目详情”提供数据）
router.get('/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    res.json(file);
  } catch (err) {
    console.error(`Get file by id error:`, err);
    res.status(500).json({ error: 'Server error while fetching file.' });
  }
});

// ==================== 新增/修改的代码结束 ====================

// --- 路由: POST /api/files/upload (处理代码提交) ---
// 使用 upload.single('code') 来处理名为 'code' 的单个文件上传
router.post('/upload', upload.single('code'), async (req, res) => {
  try {
    // 1. 验证文件是否已上传
    if (!req.file) {
      return res.status(400).json({ message: '代码文件未上传' });
    }

    // 2. 从请求体和文件信息中获取数据
    const { problemId, language } = req.body;
    const { originalname, mimetype, size, path } = req.file;

    // 3. 创建一个新的 File (提交记录) 文档
    const newSubmission = new File({
      filename: originalname,
      contentType: mimetype,
      size: size,
      filePath: path, // 存储文件路径
      type: 'submission', // 类型为提交
      status: 'Pending',  // 初始状态为等待评测
      problemId: problemId,
      language: language
    });

    // 4. 保存到数据库
    const savedSubmission = await newSubmission.save();

    // 5. 按照前端期望的格式返回响应
    res.status(201).json({
      submissionId: savedSubmission._id,
      initialStatus: 'Pending'
    });

  } catch (err) {
    console.error("Submission upload error:", err);
    res.status(500).json({ message: '提交失败，服务器内部错误', error: err.message });
  }
});

// 路由：/verify/:codeId
router.post('/verify/:codeId', async (req, res) => {
  let tmpDir = '';
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
    
    const expectedOutputFile = await File.findById(codeFile.reference);
    if (!expectedOutputFile) {
      console.error(`错误: 未找到预期的输出文件，参考ID: ${codeFile.reference}`);
      throw new Error('预期的输出文件未找到');
    }
    
    const inputFileDoc = codeFile.inputFile 
      ? await File.findById(codeFile.inputFile) 
      : null;
    
    const hasInput = inputFileDoc && 
                     inputFileDoc.type === 'input' && 
                     Buffer.isBuffer(inputFileDoc.data);
    
    console.log(`验证请求: 代码ID=${req.params.codeId}, 是否有输入=${hasInput}`, {
      inputFileIdOnCodeFile: codeFile.inputFile,
      inputFileDocExists: !!inputFileDoc,
      inputFileDocType: inputFileDoc?.type,
      isInputDataBuffer: Buffer.isBuffer(inputFileDoc?.data)
    });

    await fs.writeFile(codePath, codeFile.data);
    
    if (hasInput) {
      await fs.writeFile(inputPath, inputFileDoc.data);
      console.log(`输入文件内容 (前100字节): ${inputFileDoc.data.toString().substring(0, 100)}`);
    } else {
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
    
    const DOCKER_IMAGE = process.env.DOCKER_IMAGE || 'code-runner-gcc';
    const DOCKER_TIMEOUT = parseInt(process.env.DOCKER_TIMEOUT, 10) || 15000;

    const dockerCmd = [
      'docker run --rm',
      '--memory=100m',
      '--cpus=1',
      '--network=none',
      '--user 1001',
      `-v "${tmpDir}":/app:z`,
      DOCKER_IMAGE,
      `/bin/bash -c "${runCmd.replace(/"/g, '\\"')}"`
    ].join(' ');
    
    console.log(`执行命令: ${dockerCmd}`);
    await execAsync(dockerCmd, { timeout: DOCKER_TIMEOUT });
    console.log('Docker命令执行成功');

    const actualOutput = await fs.readFile(outputPath, 'utf-8');
    const expectedOutputData = expectedOutputFile.data.toString('utf-8');
    
    console.log(`实际输出长度: ${actualOutput.length}, 预期输出长度: ${expectedOutputData.length}`);

    await fs.rm(tmpDir, { recursive: true, force: true });
    tmpDir = ''; 

    const isMatch = normalizeOutput(actualOutput) === normalizeOutput(expectedOutputData);

    res.json({
      match: isMatch,
      actual: actualOutput,
      expected: expectedOutputData,
      hasInput: hasInput
    });
  } catch (err) {
    console.error('验证错误:', err);
    let stderrContent = err.stderr || '';
    if (err.stdout) stderrContent += `\nSTDOUT (from error): ${err.stdout}`;
    
    if (tmpDir) {
        const errorOutputPath = path.join(tmpDir, 'output.txt');
        try {
            if (await fs.access(errorOutputPath).then(() => true).catch(() => false)) {
                const partialOutput = await fs.readFile(errorOutputPath, 'utf-8');
                if (partialOutput) stderrContent += `\nPartial output.txt (on error): ${partialOutput}`;
            }
        } catch (readErr) { /* ignore */ }
    }

    res.status(500).json({ 
      error: err.message,
      stderr: stderrContent,
    });
  } finally {
    if (tmpDir) {
        try {
            await fs.rm(tmpDir, { recursive: true, force: true });
        } catch (cleanupErr) {
            console.error('清理临时目录错误:', cleanupErr);
        }
    }
  }
});

export default router;