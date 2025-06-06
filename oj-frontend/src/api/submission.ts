import apiClient from './request';
import type { 
  SubmissionDetail, 
  SubmissionListItem, 
  SubmissionHistoryResponse, 
  SubmitCodeResponse 
} from '@/types/submission';

/**
 * 提交代码，返回一个包含 submissionId 的初始响应
 */
export const submitCodeToApi = (data: FormData): Promise<SubmitCodeResponse> => {
  return apiClient.post('/files/upload', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

/**
 * 根据 ID 获取单个提交的详情
 */
export const getSubmissionDetailFromApi = (submissionId: string | number): Promise<SubmissionDetail> => {
  return apiClient.get(`/files/${submissionId}`);
}

/**
 * 根据 ID 获取单个提交的结果 (功能同上)
 */
export const getSubmissionResultFromApi = (submissionId: string | number): Promise<SubmissionDetail> => {
  return getSubmissionDetailFromApi(submissionId);
}

/**
 * 获取提交历史列表
 */
export const getSubmissionHistoryFromApi = (params: { 
  problemId?: string | number; 
  page?: number; 
  limit?: number; 
}): Promise<SubmissionHistoryResponse> => {
  // 修正：让此函数接受一个参数对象
  return apiClient.get('/files', { params });
}