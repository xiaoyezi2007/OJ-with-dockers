// src/api/submission.ts
import apiClient from './request';
import type { SubmissionResult, SubmitCodePayload, SubmissionStatus, TestCaseResult } from '@/types/submission'; //
import type { PaginationInfo } from '@/types/index'; //

// 后端提交代码后返回的结构 (应与后端 API 定义一致)
interface SubmitCodeApiResponse {
  submissionId: string;
  initialStatus?: SubmissionStatus; // 例如 'Pending'
  message?: string;
}

// 获取提交历史列表的请求参数类型 (应该在 types/api.ts 中定义)
interface GetSubmissionHistoryParams {
  page?: number;
  limit?: number;
  problemId?: string;
  status?: SubmissionStatus;
  // userId?: string; // 如果后端支持按用户ID筛选
}

// 获取提交历史列表的响应体类型 (应该在 types/api.ts 中定义)
interface GetSubmissionHistoryResponseBody {
  items: SubmissionResult[];
  pagination: PaginationInfo;
}


/**
 * 提交代码到后端 API
 */
export async function submitCodeToApi(payload: SubmitCodePayload): Promise<SubmitCodeApiResponse> {
  console.log('[API submission.ts] Submitting code:', payload);
  const response = await apiClient.post<SubmitCodeApiResponse>('/submissions', payload);
  return response.data;
}

/**
 * 根据提交 ID 从后端 API 获取评测结果 (用于轮询)
 */
export async function getSubmissionResultFromApi(submissionId: string): Promise<SubmissionResult> {
  console.log(`[API submission.ts] Fetching result for submission ID: ${submissionId}`);
  const response = await apiClient.get<SubmissionResult>(`/submissions/${submissionId}`);
  return response.data;
}

/**
 * 获取提交历史列表 (真实 API)
 */
export async function getSubmissionHistoryFromApi(params: GetSubmissionHistoryParams): Promise<GetSubmissionHistoryResponseBody> {
  console.log('[API submission.ts] Fetching submission history with params:', params);
  const response = await apiClient.get<GetSubmissionHistoryResponseBody>('/submissions/history', { params }); // 假设后端历史记录接口是 /submissions/history
  return response.data;
}

/**
 * 获取单个提交详情 (真实 API, 用于 SubmissionListView 的弹窗)
 * 注意：这个函数可能与 getSubmissionResultFromApi 功能相似，取决于后端 API 设计
 * 如果后端 /submissions/:id 返回的就是包含所有详情（代码、测试点）的数据，那么可以复用或合并。
 */
export async function getSubmissionDetailFromApi(submissionId: string): Promise<SubmissionResult> {
  console.log(`[API submission.ts] Fetching submission detail for ID: ${submissionId}`);
  // 假设获取单个提交详情的接口与轮询结果的接口相同
  const response = await apiClient.get<SubmissionResult>(`/submissions/${submissionId}`);
  return response.data;
}


// --- Mock 函数可以保留或移除 ---
 const ALL_MOCK_SUBMISSIONS: SubmissionResult[] = [ ] ;
 const MOCK_SUBMISSION_RESULTS: Record<string, SubmissionResult | undefined> = {};
 export async function getSubmissionHistoryFromApiMock(params: GetSubmissionHistoryParams) { }
 export async function getSubmissionDetailFromApiMock(submissionId: string) {  }