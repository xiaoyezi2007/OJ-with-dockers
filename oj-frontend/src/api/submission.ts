// src/api/submission.ts
import apiClient from './request'; // 你的 Axios 实例
import type { SubmissionResult, SubmitCodePayload, SubmissionStatus, TestCaseResult } from '@/types/submission';
import type { PaginationInfo } from '@/types/index'; // 确保从你的通用类型文件导入

interface SubmitCodeApiResponse {
  submissionId: string;
  initialStatus?: SubmissionStatus; // 后端可以返回一个初始状态
}

// 用于存储模拟的、正在评测或已完成评测的提交结果 (主要供 pollSubmissionResult 使用)
const MOCK_SUBMISSION_RESULTS: Record<string, SubmissionResult | undefined> = {};

// 模拟的提交历史数据库
const ALL_MOCK_SUBMISSIONS: SubmissionResult[] = [
  { submissionId: 'sub1001', problemId: 'P1001', problemTitle: 'A+B Problem', userId: 'user1', status: 'Accepted', language: 'cpp', time: 10, memory: 2048, createdAt: new Date(Date.now() - 100000).toISOString(), code: 'int main(){ std::cout << (1+2); return 0; }', testCases: [{id: 1, status: 'Accepted', time:10, memory: 2048}]},
  { submissionId: 'sub1002', problemId: 'P1002', problemTitle: '两数之和', userId: 'user1', status: 'Wrong Answer', language: 'java', time: 100, memory: 8192, createdAt: new Date(Date.now() - 200000).toISOString(), message: '答案与预期不符，在测试点 #2 失败。', code: 'class Solution { public int[] twoSum(int[] nums, int target) { return new int[]{0,1}; } }', testCases: [{id:1, status: 'Accepted'}, {id:2, status: 'Wrong Answer'}]},
  { submissionId: 'sub1003', problemId: 'P1001', problemTitle: 'A+B Problem', userId: 'user2', status: 'Time Limit Exceeded', language: 'python', time: 2000, memory: 4096, createdAt: new Date(Date.now() - 300000).toISOString(), code: 'a,b=map(int,input().split())\nwhile True:\n  pass\nprint(a+b)' },
  { submissionId: 'sub1004', problemId: 'P1003', problemTitle: '最长公共子序列', userId: 'user1', status: 'Compile Error', language: 'cpp', createdAt: new Date(Date.now() - 400000).toISOString(), message: '第5行: 缺少分号', code: '#include <iostream>\nint main() { std::cout << "hello" return 0; }' },
  // 添加更多模拟数据以支持分页和筛选
];
for (let i = 1; i <= 25; i++) {
    const problemNum = (i % 3) + 1;
    const statusOptions: SubmissionStatus[] = ['Accepted', 'Wrong Answer', 'Pending', 'Judging', 'Runtime Error', 'Compile Error'];
    const langOptions = ['cpp', 'java', 'python'] as const;
    ALL_MOCK_SUBMISSIONS.push({
        submissionId: `sub${2000 + i}`,
        problemId: `P100${problemNum}`,
        problemTitle: `模拟题目 ${problemNum}`,
        userId: `user${(i % 2) + 1}`,
        status: statusOptions[i % statusOptions.length],
        language: langOptions[i % langOptions.length],
        time: statusOptions[i % statusOptions.length] === 'Accepted' ? Math.floor(Math.random() * 1000) : undefined,
        memory: statusOptions[i % statusOptions.length] === 'Accepted' ? Math.floor(Math.random() * 16384) : undefined,
        createdAt: new Date(Date.now() - (i + 5) * 100000 * Math.random()).toISOString(),
        code: `// Mock code for submission sub${2000 + i}\n// Language: ${langOptions[i % langOptions.length]}`,
        message: statusOptions[i % statusOptions.length] === 'Runtime Error' ? '空指针异常 at line 10' : undefined,
    });
}


/**
 * 提交代码到后端 API (模拟实现)
 */
export async function submitCodeToApi(payload: SubmitCodePayload): Promise<SubmitCodeApiResponse> {
  console.log('[API Service] Submitting code:', payload);
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 300));
  const mockSubmissionId = `SUB_NEW_${Date.now()}`;

  // 将新的提交存入 MOCK_SUBMISSION_RESULTS 以便轮询，并添加到历史记录的开头
  const newSubmission: SubmissionResult = {
    submissionId: mockSubmissionId,
    problemId: payload.problemId,
    problemTitle: `题目 ${payload.problemId}`, // 真实场景中后端会关联题目标题
    userId: 'currentUser', // 假设的当前用户
    status: 'Pending',
    code: payload.code,
    language: payload.language,
    createdAt: new Date().toISOString(),
  };
  MOCK_SUBMISSION_RESULTS[mockSubmissionId] = newSubmission;
  ALL_MOCK_SUBMISSIONS.unshift(JSON.parse(JSON.stringify(newSubmission))); // 添加到历史记录的开头

  console.log('[Mock API Service] Code submitted. Mock Submission ID:', mockSubmissionId);
  return {
    submissionId: mockSubmissionId,
    initialStatus: 'Pending',
  };
}

/**
 * 根据提交 ID 从后端 API 获取评测结果 (用于轮询 ProblemDetailView 的当前提交)
 */
export async function getSubmissionResultFromApi(submissionId: string): Promise<SubmissionResult> {
  console.log(`[API Service] Polling result for submission ID: ${submissionId}`);
  await new Promise(resolve => setTimeout(resolve, 700 + Math.random() * 800)); // 模拟评测耗时

  const currentMockData = MOCK_SUBMISSION_RESULTS[submissionId];
  if (!currentMockData) {
    // 如果 MOCK_SUBMISSION_RESULTS 中没有，可能是历史记录，直接从 ALL_MOCK_SUBMISSIONS 找
    const historicSubmission = ALL_MOCK_SUBMISSIONS.find(s => s.submissionId === submissionId);
    if (historicSubmission) {
        console.log(`[Mock API Service] Returning historic result for ${submissionId} (for polling):`, historicSubmission);
        return JSON.parse(JSON.stringify(historicSubmission));
    }
    return Promise.reject(new Error(`Submission ${submissionId} not found for polling`));
  }

  // 模拟状态进展
  if (currentMockData.status === 'Pending') {
    currentMockData.status = 'Judging';
  } else if (currentMockData.status === 'Judging') {
    const statuses: SubmissionStatus[] = ['Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Compile Error', 'Runtime Error', 'Memory Limit Exceeded', 'Output Limit Exceeded'];
    currentMockData.status = statuses[Math.floor(Math.random() * statuses.length)];
    currentMockData.judgedAt = new Date().toISOString();
    currentMockData.message = currentMockData.status === 'Compile Error' ? '编译错误：Some syntax error at line X.' : (currentMockData.status === 'Accepted' ? '所有测试点通过！' : '未能通过所有测试点。');
    currentMockData.time = currentMockData.status === 'Accepted' ? Math.floor(Math.random() * 500) + 50 : (currentMockData.status === 'Time Limit Exceeded' ? 2001 : Math.floor(Math.random() * 1000));
    currentMockData.memory = currentMockData.status === 'Accepted' ? Math.floor(Math.random() * 10000) + 2000 : (currentMockData.status === 'Memory Limit Exceeded' ? 65537 : Math.floor(Math.random() * 30000));
    currentMockData.testCases = generateMockTestCases(currentMockData.status); // 生成测试点信息
    // 更新 ALL_MOCK_SUBMISSIONS 中的对应记录
    const indexInHistory = ALL_MOCK_SUBMISSIONS.findIndex(s => s.submissionId === submissionId);
    if (indexInHistory !== -1) {
        ALL_MOCK_SUBMISSIONS[indexInHistory] = JSON.parse(JSON.stringify(currentMockData));
    }
  }
  console.log(`[Mock API Service] Polled result for ${submissionId}:`, JSON.parse(JSON.stringify(currentMockData)));
  return JSON.parse(JSON.stringify(currentMockData)); // 返回深拷贝
}


// --- 新增的模拟函数 ---

/**
 * 生成模拟的测试点结果
 */
function generateMockTestCases(overallStatus: SubmissionStatus): TestCaseResult[] | undefined {
    if (overallStatus === 'Pending' || overallStatus === 'Judging' || overallStatus === 'Compile Error' || overallStatus === 'System Error') {
        return undefined; // 这些状态下通常没有测试点信息
    }
    const cases: TestCaseResult[] = [];
    const numCases = Math.floor(Math.random() * 3) + 3; // 3-5 个测试点
    let finalStatusAchieved = false;

    for (let i = 1; i <= numCases; i++) {
        let currentCaseStatus: SubmissionStatus = 'Accepted';
        if (overallStatus !== 'Accepted' && !finalStatusAchieved && (i === Math.ceil(numCases / Math.random() / 1.5) || i === numCases) ) {
            // 确保至少有一个测试点反映了最终的非AC状态
            currentCaseStatus = overallStatus;
            finalStatusAchieved = true;
        } else if (overallStatus !== 'Accepted' && finalStatusAchieved) {
            currentCaseStatus = 'Skipped'; // 如果最终结果已确定，后续的可以跳过
        }

        cases.push({
            id: i,
            status: currentCaseStatus,
            time: currentCaseStatus === 'Accepted' ? Math.floor(Math.random() * 200) : (currentCaseStatus === 'Time Limit Exceeded' ? 1001 : undefined),
            memory: currentCaseStatus === 'Accepted' ? Math.floor(Math.random() * 5000) : (currentCaseStatus === 'Memory Limit Exceeded' ? 32769 : undefined),
            checkerMessage: currentCaseStatus === 'Wrong Answer' ? `Output differs at line ${i}` : undefined,
            input: `Input for test case ${i}`,
            output: `Actual output for test case ${i}`,
            expectedOutput: `Expected output for test case ${i}`
        });
    }
    // 如果整体是 AC，但随机生成的 case 没有完全 AC，强制最后一个为 AC (或全部AC)
    if (overallStatus === 'Accepted' && !finalStatusAchieved) {
        cases.forEach(c => c.status = 'Accepted');
    }
    return cases;
}

/**
 * 获取提交历史列表 (模拟 API)
 */
export async function getSubmissionHistoryFromApiMock(params: {
  page?: number;
  limit?: number;
  problemId?: string;
  status?: SubmissionStatus;
  // userId?: string; // 根据需要添加用户ID筛选
}): Promise<{ items: SubmissionResult[]; pagination: PaginationInfo }> {
  console.log('[MOCK API SERVICE] getSubmissionHistory CALLED with params:', JSON.stringify(params));
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 200));

  let filteredSubmissions = [...ALL_MOCK_SUBMISSIONS];

  if (params.problemId) {
    filteredSubmissions = filteredSubmissions.filter(s => String(s.problemId) === params.problemId);
  }
  if (params.status) {
    filteredSubmissions = filteredSubmissions.filter(s => s.status === params.status);
  }
  // if (params.userId) {
  //   filteredSubmissions = filteredSubmissions.filter(s => s.userId === params.userId);
  // }

  // 模拟分页
  const page = params.page || 1;
  const limit = params.limit || 10;
  const totalItems = filteredSubmissions.length;
  const totalPages = Math.ceil(totalItems / limit);
  const startIndex = (page - 1) * limit;
  const paginatedItems = filteredSubmissions.slice(startIndex, startIndex + limit).map(s => ({
      ...s, // 返回浅拷贝，如果需要深拷贝则 JSON.parse(JSON.stringify(s))
      problemTitle: s.problemTitle || `题目 ${s.problemId}` // 确保有 problemTitle
  }));

  const paginationResult: PaginationInfo = {
    currentPage: page,
    pageSize: limit,
    totalItems: totalItems,
    totalPages: totalPages,
  };

  console.log('[MOCK API SERVICE] Returning submission history. Items count:', paginatedItems.length);
  return {
    items: paginatedItems,
    pagination: paginationResult,
  };
}

/**
 * 获取单个提交详情 (模拟 API，用于 SubmissionListView 的弹窗)
 */
export async function getSubmissionDetailFromApiMock(submissionId: string): Promise<SubmissionResult> {
  console.log(`[MOCK API SERVICE] getSubmissionDetail CALLED for ID: ${submissionId}`);
  await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 100));

  // 优先从 MOCK_SUBMISSION_RESULTS 获取（因为可能是正在轮询的，状态会更新）
  // 否则从完整的历史记录中查找
  const submission = MOCK_SUBMISSION_RESULTS[submissionId] || ALL_MOCK_SUBMISSIONS.find(s => s.submissionId === submissionId);

  if (submission) {
    // 确保返回的数据包含所有 SubmissionResult 中定义的字段，特别是 code 和 testCases
    const detail: SubmissionResult = {
      ...submission,
      code: submission.code || `// Mock code for submission ${submissionId}\n#include <iostream>\nint main() { std::cout << "Hello from submission ${submissionId}"; return 0; }`,
      message: submission.message || (submission.status === 'Compile Error' ? `详细编译错误信息 for ${submissionId}...` : (submission.status === 'Accepted' ? '所有测试点均通过！' : `评测信息 for ${submissionId}`)),
      testCases: submission.testCases || generateMockTestCases(submission.status) // 生成或使用已有的测试点
    };
    console.log(`[MOCK API SERVICE] Returning submission detail for ${submissionId}:`, JSON.parse(JSON.stringify(detail)));
    return JSON.parse(JSON.stringify(detail)); // 返回深拷贝
  }
  return Promise.reject(new Error(`Submission detail for ID ${submissionId} not found in mock data`));
}