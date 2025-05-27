// src/store/submission.ts
import { defineStore } from 'pinia';
import type { SubmissionResult, SubmissionStatus, SubmitCodePayload } from '@/types/submission';
// 假设你有一个 apiClient 用于发送请求，并且 API 服务函数定义在 @/api/submission.ts
import { submitCodeToApi, getSubmissionResultFromApi } from '@/api/submission'; // <--- 你需要创建这个文件和这些函数

interface SubmissionStoreState {
  isSubmitting: boolean;                      // 是否正在提交代码 (用于按钮 loading)
  isPollingResult: boolean;                   // 是否正在轮询结果 (如果需要轮询)
  currentSubmissionId: string | null;         // 当前提交的ID
  currentSubmissionResult: SubmissionResult | null; // 当前的提交结果
  submissionHistory: SubmissionResult[];      // (可选) 用户的提交历史
  error: string | null;                       // 提交或获取结果时的错误信息
}

export const useSubmissionStore = defineStore('submission', {
  state: (): SubmissionStoreState => ({
    isSubmitting: false,
    isPollingResult: false,
    currentSubmissionId: null,
    currentSubmissionResult: null,
    submissionHistory: [],
    error: null,
  }),

  actions: {
    /**
     * 提交代码到后端进行评测
     */
    async submitCode(payload: SubmitCodePayload) {
      this.isSubmitting = true;
      this.error = null;
      this.currentSubmissionResult = null; // 清除上一次的结果
      this.currentSubmissionId = null;

      try {
        // const response = await apiClient.post('/submissions', payload); // 直接使用 apiClient 示例
        // 或者调用封装的 API 服务函数
        const initialResponse = await submitCodeToApi(payload); // 假设这个函数返回类似 { submissionId: string, initialStatus: SubmissionStatus } 的结构

        this.currentSubmissionId = initialResponse.submissionId;
        // 初始状态可能是 Pending 或 Judging
        this.currentSubmissionResult = {
          submissionId: initialResponse.submissionId,
          problemId: payload.problemId,
          status: initialResponse.initialStatus || 'Pending', // 使用后端返回的初始状态或默认为 Pending
          code: payload.code,
          language: payload.language,
        };

        // 如果后端不是立即返回最终结果，你可能需要开始轮询结果
        if (this.currentSubmissionResult.status === 'Pending' || this.currentSubmissionResult.status === 'Judging') {
          this.pollSubmissionResult(initialResponse.submissionId);
        } else {
          // 如果后端直接返回了最终结果 (不太常见，但可能用于非常快的判题)
          // 可以在这里直接更新 currentSubmissionResult 的完整信息 (如果 initialResponse 包含的话)
        }

      } catch (err: any) {
        this.error = err.response?.data?.message || err.message || '代码提交失败';
        console.error('Failed to submit code:', err);
      } finally {
        this.isSubmitting = false;
      }
    },

    /**
     * (可选) 轮询获取提交结果
     * @param submissionId 提交ID
     */
    async pollSubmissionResult(submissionId: string) {
      if (!submissionId) return;
      this.isPollingResult = true;
      console.log(`[Store] Polling for submission ID: ${submissionId}`);

      try {
        // 这是一个简化的轮询示例，实际项目中可能需要更复杂的逻辑
        // (例如：最大尝试次数、指数退避、WebSocket 等)
        let attempts = 0;
        const maxAttempts = 20; // 最多轮询20次 (例如，20 * 3秒 = 1分钟)
        const interval = 3000; // 每3秒轮询一次

        const poll = async (): Promise<void> => {
          if (attempts >= maxAttempts) {
            this.error = '获取评测结果超时。';
            this.isPollingResult = false;
            if (this.currentSubmissionResult) { // 如果长时间pending，可以设一个超时状态
                this.currentSubmissionResult.status = 'System Error'; // 或者自定义一个 "Polling Timeout" 状态
                this.currentSubmissionResult.message = this.error;
            }
            console.warn(`Polling timed out for submission ID: ${submissionId}`);
            return;
          }

          attempts++;
          const resultData = await getSubmissionResultFromApi(submissionId); // 假设这个API函数获取结果

          this.currentSubmissionResult = resultData;

          if (resultData.status !== 'Pending' && resultData.status !== 'Judging') {
            // 评测完成
            this.isPollingResult = false;
            console.log(`[Store] Polling complete for submission ID: ${submissionId}`, resultData);
          } else {
            // 继续轮询
            setTimeout(poll, interval);
          }
        };
        setTimeout(poll, interval); // 首次轮询延迟一点启动
      } catch (err: any) {
        this.error = err.response?.data?.message || err.message || '获取提交结果失败';
        this.isPollingResult = false;
        console.error(`Failed to poll submission result for ID ${submissionId}:`, err);
      }
    },

    /**
     * 清除当前的提交结果 (例如，在进入新的题目详情页时调用)
     */
    clearCurrentSubmissionResult() {
      this.currentSubmissionResult = null;
      this.currentSubmissionId = null;
      this.error = null;
      this.isPollingResult = false; // 也停止轮询状态
      // 你可能还想取消正在进行的轮询，但这需要更复杂的 setTimeout/setInterval 管理
    },

    // (可选) 获取用户提交历史的 action
    // async fetchSubmissionHistory(params = {}) { ... }
  },
});