import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

import File from '../models/File.js';
import upload from '../middleware/multerConfig.js';
import normalizeOutput from '../utils/normalizeOutput.js';

dotenv.config();
const execAsync = promisify(exec);
const router = express.Router();

// 路由：上传代码文件及其正确输出
router.post('/upload', upload.fields([
  { name: 'code', maxCount: 1 },
  { name: 'expectedOutput', maxCount: 1 },
  { name: 'inputFile', maxCount: 1 }
]), async (req, res) => {
  try {
    let inputFileDoc = null; // 使用 inputFileDoc 避免与 Schema 字段名混淆
    if (req.files.inputFile && req.files.inputFile[0]) {
      inputFileDoc = new File({
        filename: req.files.inputFile[0].originalname,
        contentType: req.files.inputFile[0].mimetype,
        size: req.files.inputFile[0].size,
        type: 'input',
        data: req.files.inputFile[0].buffer
      });
      await inputFileDoc.save();
      console.log(`输入文件保存成功，ID: ${inputFileDoc._id}`);
    } else {
      console.log('未接收到输入文件');
    }
    
    const outputFile = new File({
      filename: req.files.expectedOutput[0].originalname,
      contentType: req.files.expectedOutput[0].mimetype,
      size: req.files.expectedOutput[0].size,
      type: 'output',
      data: req.files.expectedOutput[0].buffer
    });
    await outputFile.save();

    const codeFile = new File({
      filename: req.files.code[0].originalname,
      contentType: req.files.code[0].mimetype,
      size: req.files.code[0].size,
      type: 'code',
      reference: outputFile._id,
      inputFile: inputFileDoc ? inputFileDoc._id : null,
      data: req.files.code[0].buffer
    });
    await codeFile.save();

    res.json({
      codeId: codeFile._id,
      outputId: outputFile._id,
      inputId: inputFileDoc ? inputFileDoc._id : null
    });
  } catch (err) {
    console.error("Upload route error:", err);
    res.status(500).json({ error: err.message });
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