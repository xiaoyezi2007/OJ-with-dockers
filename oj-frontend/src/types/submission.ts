import type { PaginationInfo } from './index';

/**
 * 用于发起一次新提交的载荷数据结构
 */
export interface SubmitCodePayload {
  problemId: string;
  language: string;
  code: string;
}

/**
 * 提交状态的可能取值
 */
export type SubmissionStatus =
  | 'Pending'
  | 'Judging'
  | 'Accepted'
  | 'Wrong Answer'
  | 'Time Limit Exceeded'
  | 'Memory Limit Exceeded'
  | 'Runtime Error'
  | 'Compile Error'
  | 'System Error';

/**
 * 单个提交记录的（用于列表）数据结构
 */
export interface SubmissionListItem {
  id: string | number;
  problemId: string | number;
  problemTitle: string;
  status: SubmissionStatus;
  language: string;
  executionTime: number;
  memoryUsage: number;
  submittedAt: string;
}

/**
 * 提交详情的数据结构
 */
export interface SubmissionDetail extends SubmissionListItem {
  code: string;
  output?: {
    stdout?: string;
    stderr?: string;
    error?: string;
  };
  message?: string;
}

/**
 * 提交结果的数据结构（详情的别名）
 */
export type SubmissionResult = SubmissionDetail;

/**
 * 提交代码后，后端返回的初始响应体
 */
export interface SubmitCodeResponse {
  submissionId: string;
  initialStatus: SubmissionStatus;
  problemTitle?: string;
}

/**
 * 获取提交历史列表时，后端返回的完整响应体
 */
export interface SubmissionHistoryResponse {
  items: SubmissionListItem[];
  pagination: PaginationInfo;
}