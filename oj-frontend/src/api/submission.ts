// src/api/submission.ts
import apiClient from './request'; // 你的 Axios 实例
import type { SubmissionResult, SubmitCodePayload, SubmissionStatus } from '@/types/submission';

interface SubmitCodeApiResponse {
  submissionId: string;
  initialStatus?: SubmissionStatus; // 后端可以返回一个初始状态
}

/**
 * 提交代码到后端 API
 */
export async function submitCodeToApi(payload: SubmitCodePayload): Promise<SubmitCodeApiResponse> {
  console.log('[API Service] Submitting code:', payload);
  // 真实 API 调用:
  // const response = await apiClient.post<SubmitCodeApiResponse>('/submissions', payload);
  // return response.data;

  // --- 模拟 API ---
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
  const mockSubmissionId = `SUB_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  console.log('[Mock API Service] Code submitted. Mock Submission ID:', mockSubmissionId);
  return {
    submissionId: mockSubmissionId,
    initialStatus: 'Pending', // 模拟初始状态为 Pending
  };
  // --- 模拟结束 ---
}

/**
 * 根据提交 ID 从后端 API 获取评测结果
 */
export async function getSubmissionResultFromApi(submissionId: string): Promise<SubmissionResult> {
  console.log(`[API Service] Fetching result for submission ID: ${submissionId}`);
  // 真实 API 调用:
  // const response = await apiClient.get<SubmissionResult>(`/submissions/${submissionId}`);
  // return response.data;

  // --- 模拟 API ---
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000)); // 模拟评测耗时

  // 模拟不同的评测结果，可以根据 submissionId 或随机数来决定
  const statuses: SubmissionStatus[] = ['Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Compile Error', 'Runtime Error'];
  let randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

  // 模拟一个更现实的场景：如果还是 Pending/Judging，过一会儿再变成最终结果
  // 这个逻辑更适合放在 store 的 poll 函数中，这里简单处理
  const stillProcessing = Math.random() < 0.3; // 30% 概率还在处理中
  if (stillProcessing && (MOCK_SUBMISSION_RESULTS[submissionId]?.status === 'Pending' || MOCK_SUBMISSION_RESULTS[submissionId]?.status === 'Judging')) {
      randomStatus = MOCK_SUBMISSION_RESULTS[submissionId]?.status === 'Pending' ? 'Judging' : randomStatus;
  }


  const mockResult: SubmissionResult = {
    submissionId: submissionId,
    problemId: MOCK_SUBMISSION_RESULTS[submissionId]?.problemId || 'P-Mock', // 尝试从模拟存储中获取或使用默认值
    status: randomStatus,
    message: randomStatus === 'Compile Error' ? '编译错误：第10行，分号丢失。' : (randomStatus === 'Accepted' ? '通过！' : '请检查你的逻辑。'),
    time: randomStatus === 'Accepted' ? Math.floor(Math.random() * 500) + 50 : (randomStatus === 'Time Limit Exceeded' ? 2000 : undefined),
    memory: randomStatus === 'Accepted' ? Math.floor(Math.random() * 10000) + 2000 : (randomStatus === 'Memory Limit Exceeded' ? 65536 : undefined),
    createdAt: MOCK_SUBMISSION_RESULTS[submissionId]?.createdAt || new Date().toISOString(),
    judgedAt: new Date().toISOString(),
    testCases: randomStatus === 'Wrong Answer' ? [ // 仅在答案错误时提供一些模拟的测试点信息
        { id: 1, status: 'Accepted', time: 10, memory: 1024},
        { id: 2, status: 'Wrong Answer', time: 12, memory: 1030, input: "2 3", output: "6", expectedOutput: "5"},
        { id: 3, status: 'Skipped'},
    ] : (randomStatus === 'Accepted' ? [
        { id: 1, status: 'Accepted', time: 10, memory: 1024},
        { id: 2, status: 'Accepted', time: 12, memory: 1030},
        { id: 3, status: 'Accepted', time: 9, memory: 1000},
    ] : undefined),
  };
  // 简单模拟存储，以便轮询时能"更新"状态
  if (!MOCK_SUBMISSION_RESULTS[submissionId] || MOCK_SUBMISSION_RESULTS[submissionId]?.status === 'Pending' || MOCK_SUBMISSION_RESULTS[submissionId]?.status === 'Judging') {
      MOCK_SUBMISSION_RESULTS[submissionId] = mockResult;
  } else { // 如果已经有最终结果，就返回存储的那个
      return MOCK_SUBMISSION_RESULTS[submissionId]!;
  }


  console.log(`[Mock API Service] Returning result for ${submissionId}:`, mockResult);
  return mockResult;
  // --- 模拟结束 ---
}

// 用于模拟轮询时状态变化的简单内存存储
const MOCK_SUBMISSION_RESULTS: Record<string, SubmissionResult | undefined> = {};