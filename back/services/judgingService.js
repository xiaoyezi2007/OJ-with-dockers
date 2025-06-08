import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import Problem from '../models/Problem.js';
import File from '../models/File.js';
import normalizeOutput from '../utils/normalizeOutput.js';

const execAsync = promisify(exec);

async function judgeSubmission(submissionId) {
  console.log(`[Judge Service] Received job for submission ID: ${submissionId}`);
  
  try {
    let submission = await File.findByIdAndUpdate(submissionId, { status: 'Judging' }, { new: true });
    if (!submission) throw new Error(`Submission with ID ${submissionId} not found.`);
    console.log(`[Judge Service] Status updated to 'Judging' for submission: ${submissionId}`);

    const problem = await Problem.findById(submission.problemId);
    if (!problem) throw new Error(`Associated problem with ID ${submission.problemId} not found.`);
    console.log(`[Judge Service] Fetched problem "${problem.title}" with ${problem.testCases.length} test case(s).`);

    if (!problem.testCases || problem.testCases.length === 0) {
      throw new Error('Problem has no test cases.');
    }

    let maxTime = 0;
    let maxMemory = 0;
    let finalStatus = 'Accepted';

    for (const testCase of problem.testCases) {
      console.log(`[Judge Service] Running test case for submission: ${submissionId}`);
      // 修正：将题目的限制传递给单个测试点运行函数
      const result = await runSingleTestCase(submission, testCase, problem.timeLimit, problem.memoryLimit);

      if (result.time > maxTime) maxTime = result.time;
      if (result.memory > maxMemory) maxMemory = result.memory;

      // 修正：如果状态不是 Accepted，则立即终止
      if (result.status !== 'Accepted') {
        finalStatus = result.status;
        console.log(`[Judge Service] Test case failed for ${submissionId}. Final Status: ${finalStatus}`);
        await File.findByIdAndUpdate(submissionId, { 
          status: finalStatus,
          executionTime: result.time,
          memoryUsage: result.memory
        });
        return; 
      }
    }
    
    console.log(`[Judge Service] All test cases passed for ${submissionId}. Final Status: Accepted`);
    await File.findByIdAndUpdate(submissionId, { 
      status: 'Accepted',
      executionTime: maxTime,
      memoryUsage: maxMemory
    });

  } catch (error) {
    console.error(`[Judge Service] CRITICAL ERROR while judging submission ${submissionId}:`, error);
    if (submissionId) {
      let status = 'System Error';
      const errorMessage = error.stderr || error.message || '';
      if (errorMessage.includes('error:')) {
        status = 'Compile Error';
      } else if (error.signal === 'SIGTERM') {
        // 由 execAsync 的 timeout 触发
        status = 'Time Limit Exceeded';
      }
      await File.findByIdAndUpdate(submissionId, { status: status });
    }
  }
}

// 修正：函数签名增加了时间和内存限制参数
async function runSingleTestCase(submission, testCase, timeLimitMs, memoryLimitMb) {
  let tmpDir = '';
  try {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'judge-'));
    
    const codeSourcePath = submission.filePath;
    const testInputPath = testCase.inputFilePath;
    const expectedOutputPath = testCase.outputFilePath;
    
    const codeDestPath = path.join(tmpDir, 'code.c');
    const inputDestPath = path.join(tmpDir, 'input.txt');
    const actualOutputPath = path.join(tmpDir, 'output.txt');
    const timeLogPath = path.join(tmpDir, 'time.log');

    await fs.copyFile(codeSourcePath, codeDestPath);
    await fs.copyFile(testInputPath, inputDestPath);
    
    const DOCKER_IMAGE = process.env.DOCKER_IMAGE || 'code-runner-gcc';
    
    // 修正：在 Docker 命令中加入 --memory 限制
    const judgeCommand = `/usr/bin/time -f '%U %M' -o time.log ./code.out < input.txt > output.txt`;
    const dockerCmd = `docker run --rm --memory=${memoryLimitMb}m -v "${tmpDir}:/app" ${DOCKER_IMAGE} /bin/bash -c "gcc code.c -o code.out 2>&1 && ${judgeCommand}"`;
    
    console.log(`[Judge Service] Executing Docker: ${dockerCmd}`);
    
    // 修正：execAsync 的超时时间也应该与题目限制相关，并留出一些缓冲
    await execAsync(dockerCmd, { timeout: timeLimitMs + 2000 });

    const actualOutput = await fs.readFile(actualOutputPath, 'utf-8');
    const expectedOutput = await fs.readFile(expectedOutputPath, 'utf-8');
    const passed = normalizeOutput(actualOutput) === normalizeOutput(expectedOutput);

    const timeOutput = await fs.readFile(timeLogPath, 'utf-8');
    const [userCpuTime, maxMemory] = timeOutput.trim().split(' ');
    
    const executionTimeMs = Math.round(parseFloat(userCpuTime) * 1000);
    const memoryUsageKb = parseInt(maxMemory);

    // --- 新增：在这里进行时间和内存的判断 ---
    if (executionTimeMs > timeLimitMs) {
      return { status: 'Time Limit Exceeded', time: executionTimeMs, memory: memoryUsageKb, passed: false };
    }
    if (memoryUsageKb > memoryLimitMb * 1024) {
      return { status: 'Memory Limit Exceeded', time: executionTimeMs, memory: memoryUsageKb, passed: false };
    }

    // --- 修正：返回一个包含状态的对象 ---
    if (passed) {
      return { status: 'Accepted', time: executionTimeMs, memory: memoryUsageKb, passed: true };
    } else {
      return { status: 'Wrong Answer', time: executionTimeMs, memory: memoryUsageKb, passed: false };
    }

  } catch(error) {
    console.error(`[Judge Service] Docker execution failed for submission ${submission._id}.`, error);
    // Docker 命令本身失败（例如超时被终止），也认为是 TLE
    if (error.signal === 'SIGTERM') {
      return { status: 'Time Limit Exceeded', time: timeLimitMs, memory: 0, passed: false };
    }
    throw error; // 其他错误向上抛出，由上层处理为 System Error 或 Compile Error
  } finally {
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  }
}

export { judgeSubmission };