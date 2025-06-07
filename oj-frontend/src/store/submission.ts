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
import { ElMessage } from 'element-plus';

interface SubmissionStoreState {
  isSubmitting: boolean;
  isPollingResult: boolean;
  currentSubmissionId: string | null;
  currentSubmissionResult: SubmissionResult | null;
  error: string | null;
  submissionHistory: SubmissionListItem[];
  isLoadingHistory: boolean;
  pagination: PaginationInfo | null;
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
    /**
     * 提交代码
     */
    async submitCode(payload: SubmitCodePayload) {
      this.isSubmitting = true;
      this.error = null;
      try {
        const formData = new FormData();
        formData.append('problemId', payload.problemId);
        formData.append('language', payload.language);
        formData.append('code', new Blob([payload.code], { type: 'text/plain' }), `${payload.problemId}.${payload.language}`);

        const initialResponse = await submitCodeToApi(formData);

        // 设置初始状态，并立即显示在UI上
        this.currentSubmissionId = initialResponse.submissionId;
        this.currentSubmissionResult = {
          id: initialResponse.submissionId,
          problemId: payload.problemId,
          problemTitle: `题目 ${payload.problemId}`,
          status: 'Pending',
          code: payload.code,
          language: payload.language,
          submittedAt: new Date().toISOString(),
          time: 0,
          memory: 0,
        };
        
        // 标记开始轮询，并延迟一小段时间后启动第一次轮询
        this.isPollingResult = true;
        setTimeout(() => {
          this.pollSubmissionResult(initialResponse.submissionId);
        }, 1500); // 延迟1.5秒，给后端一点启动评测的时间

      } catch (err: any) {
        this.error = err.message || '代码提交失败';
        this.isSubmitting = false;
      } finally {
        // isSubmitting 会在轮询结束后或失败时在对应函数中设置为 false
        // 这里 submitCode 函数在触发轮询后即可认为“提交”动作完成
        this.isSubmitting = false; 
      }
    },

    /**
     * 轮询获取评测结果
     */
    async pollSubmissionResult(submissionId: string) {
      // 如果没有在轮询状态，或者要轮询的ID已经不是当前最新的提交ID，则停止
      if (!this.isPollingResult || this.currentSubmissionId !== submissionId) {
        return;
      }

      try {
        console.log(`[Polling] Fetching result for ${submissionId}`);
        const resultData = await getSubmissionResultFromApi(submissionId);
        
        // 再次检查，防止在异步请求期间，用户又提交了新的代码
        if (this.currentSubmissionId === submissionId) {
          this.currentSubmissionResult = resultData;
          
          // 如果状态还是 "Pending" 或 "Judging"，则继续轮询
          if (resultData.status === 'Pending' || resultData.status === 'Judging') {
            setTimeout(() => this.pollSubmissionResult(submissionId), 3000); // 3秒后再次检查
          } else {
            // 如果是最终状态 (Accepted, Wrong Answer 等)，则停止轮询
            this.isPollingResult = false;
            console.log(`[Polling] Final status received: ${resultData.status}. Polling stopped.`);
          }
        }
      } catch (err: any) {
        this.error = err.message || '获取提交结果失败';
        this.isPollingResult = false; // 出错时也停止轮询
      }
    },

    // ==================== 新增/确认的代码开始 ====================
    /**
     * 清除 ProblemDetailView 使用的当前提交结果和ID
     */
    clearCurrentSubmissionResult() {
      this.currentSubmissionResult = null;
      this.currentSubmissionId = null;
      this.isPollingResult = false;
    },
    // ==================== 新增/确认的代码结束 ====================
    
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