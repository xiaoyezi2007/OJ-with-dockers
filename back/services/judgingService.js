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
  // ==================== 调试日志 ====================
  console.log(`[Judge Service] Received job for submission ID: ${submissionId}`);
  // ================================================
  
  let submission;
  try {
    // 1. 更新状态为“正在评测”
    submission = await File.findByIdAndUpdate(submissionId, { status: 'Judging' }, { new: true });
    if (!submission) throw new Error(`Submission with ID ${submissionId} not found.`);

    // ==================== 调试日志 ====================
    console.log(`[Judge Service] Status updated to 'Judging' for submission: ${submissionId}`);
    // ================================================

    const problem = await Problem.findById(submission.problemId);
    if (!problem) throw new Error(`Associated problem with ID ${submission.problemId} not found.`);
    
    // ==================== 调试日志 ====================
    console.log(`[Judge Service] Fetched problem "${problem.title}" with ${problem.testCases.length} test case(s).`);
    // ================================================

    if (!problem.testCases || problem.testCases.length === 0) {
      throw new Error('Problem has no test cases.');
    }

    // 2. 依次运行所有测试点
    let testCaseIndex = 0;
    for (const testCase of problem.testCases) {
      // ==================== 调试日志 ====================
      console.log(`[Judge Service] Running test case #${testCaseIndex} for submission: ${submissionId}`);
      // ================================================
      const result = await runSingleTestCase(submission, testCase);

      if (!result.passed) {
        console.log(`[Judge Service] Test case #${testCaseIndex} failed for ${submissionId}. Final Status: Wrong Answer`);
        await File.findByIdAndUpdate(submissionId, { status: 'Wrong Answer' });
        return; 
      }
      testCaseIndex++;
    }

    // 4. 如果所有测试点都通过
    console.log(`[Judge Service] All test cases passed for ${submissionId}. Final Status: Accepted`);
    await File.findByIdAndUpdate(submissionId, { status: 'Accepted' });

  } catch (error) {
    console.error(`[Judge Service] CRITICAL ERROR while judging submission ${submissionId}:`, error);
    // 评测过程中出现任何错误，都更新为系统错误
    if (submissionId) {
      await File.findByIdAndUpdate(submissionId, { status: 'System Error' });
    }
  }
}

async function runSingleTestCase(submission, testCase) {
  let tmpDir = '';
  try {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'judge-'));
    
    const codeSourcePath = submission.filePath;
    const testInputPath = testCase.inputFilePath;
    const expectedOutputPath = testCase.outputFilePath;
    
    const codeDestPath = path.join(tmpDir, 'code.c'); // 假设语言为c
    const inputDestPath = path.join(tmpDir, 'input.txt');
    const actualOutputPath = path.join(tmpDir, 'output.txt');

    await fs.copyFile(codeSourcePath, codeDestPath);
    await fs.copyFile(testInputPath, inputDestPath);
    
    const DOCKER_IMAGE = process.env.DOCKER_IMAGE || 'code-runner-gcc';
    
    // 修正1：优化 Docker 命令，将编译的错误流(stderr)重定向到标准输出流(stdout)
    // 这样如果 gcc 编译失败，我们也能捕获到错误信息
    const dockerCmd = `docker run --rm -v "${tmpDir}:/app" ${DOCKER_IMAGE} /bin/bash -c "gcc code.c -o code.out 2>&1 && ./code.out < input.txt > output.txt"`;
    
    console.log(`[Judge Service] Executing Docker: ${dockerCmd}`);
    
    // 修正2：增加超时时间到 10 秒
    await execAsync(dockerCmd, { timeout: 10000 });

    const actualOutput = await fs.readFile(actualOutputPath, 'utf-8');
    const expectedOutput = await fs.readFile(expectedOutputPath, 'utf-8');
    
    const passed = normalizeOutput(actualOutput) === normalizeOutput(expectedOutput);
    
    return { passed };

  } catch(error) {
    // 修正3：加入更详细的错误捕获和日志
    console.error(`[Judge Service] Docker execution failed for submission ${submission._id}.`, error);

    // 在错误对象中检查是否有 stdout 或 stderr，它们可能包含来自 Docker 容器的有用信息
    if (error.stdout || error.stderr) {
      console.error('[Judge Service] Captured STDOUT from Docker:', error.stdout);
      console.error('[Judge Service] Captured STDERR from Docker:', error.stderr);
    }
    
    // 我们可以根据 stderr 的内容来更精确地判断错误类型（例如 Compile Error）
    // 但现在，我们统一向上抛出错误，让上层捕获并记为 System Error
    throw error;

  } finally {
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  }
}

export { judgeSubmission };