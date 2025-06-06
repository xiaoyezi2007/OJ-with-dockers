import { defineStore } from 'pinia';
import type { 
  SubmissionResult, 
  SubmissionStatus, 
  SubmitCodePayload, 
  SubmissionListItem,
  SubmissionHistoryResponse,
  SubmitCodeResponse,
  SubmissionDetail
} from '@/types/submission';
import type { PaginationInfo } from '@/types/index';
import {
  submitCodeToApi,
  getSubmissionResultFromApi,
  getSubmissionHistoryFromApi,
  getSubmissionDetailFromApi,
} from '@/api/submission';

interface SubmissionStoreState {
  isSubmitting: boolean;
  isPollingResult: boolean;
  currentSubmissionId: string | null;
  currentSubmissionResult: SubmissionResult | null;
  error: string | null;
  submissionHistory: SubmissionListItem[];
  isLoadingHistory: boolean;
  pagination: PaginationInfo;
  currentSubmissionDetail: SubmissionResult | null;
  isLoadingDetail: boolean;
}

export const useSubmissionStore = defineStore('submission', {
  state: (): SubmissionStoreState => ({
    isSubmitting: false,
    isPollingResult: false,
    currentSubmissionId: null,
    currentSubmissionResult: null,
    error: null,
    submissionHistory: [],
    isLoadingHistory: false,
    pagination: {
      currentPage: 1,
      pageSize: 15,
      totalItems: 0,
      totalPages: 0,
    },
    currentSubmissionDetail: null,
    isLoadingDetail: false,
  }),

  actions: {
    async submitCode(payload: SubmitCodePayload) {
      this.isSubmitting = true;
      this.error = null;
      this.currentSubmissionId = null;
      try {
        const formData = new FormData();
        formData.append('problemId', payload.problemId);
        formData.append('language', payload.language);
        formData.append('code', new Blob([payload.code], { type: 'text/plain' }), `${payload.problemId}.c`);

        // 修正：现在 initialResponse 的类型是 SubmitCodeResponse，可以直接使用
        const initialResponse: SubmitCodeResponse = await submitCodeToApi(formData);

        this.currentSubmissionId = initialResponse.submissionId;
        this.currentSubmissionResult = {
          id: initialResponse.submissionId,
          problemId: payload.problemId,
          problemTitle: initialResponse.problemTitle || `题目 ${payload.problemId}`,
          status: initialResponse.initialStatus || 'Pending',
          code: payload.code,
          language: payload.language,
          submittedAt: new Date().toISOString(),
          time: 0,
          memory: 0,
        };
        
        // ... (pollSubmissionResult 逻辑)
      } catch (err: any) {
        this.error = err.response?.data?.message || err.message || '代码提交失败';
      } finally {
        this.isSubmitting = false;
      }
    },
    
    // ... (pollSubmissionResult 逻辑保持不变)

    async fetchSubmissionHistory(params: { problemId?: string; page?: number; limit?: number; } = {}) {
        this.isLoadingHistory = true;
        this.error = null;
        try {
            // 修正：现在 response 的类型是 SubmissionHistoryResponse，可以直接使用
            const response: SubmissionHistoryResponse = await getSubmissionHistoryFromApi(params);
            this.submissionHistory = response.items;
            this.pagination = response.pagination;
        } catch (err: any) {
            this.error = err.message || '获取提交历史失败';
        } finally {
            this.isLoadingHistory = false;
        }
    },

    async fetchSubmissionById(submissionId: string) {
        this.isLoadingDetail = true;
        this.currentSubmissionDetail = null;
        try {
            // 修正：现在 responseData 的类型是 SubmissionDetail，可以直接赋值
            const responseData: SubmissionDetail = await getSubmissionDetailFromApi(submissionId);
            this.currentSubmissionDetail = responseData;
        } catch (err: any) {
            this.error = err.message || `获取提交详情 (ID: ${submissionId}) 失败`;
        } finally {
            this.isLoadingDetail = false;
        }
    },

    // ... (clear 方法等保持不变)
  },
});