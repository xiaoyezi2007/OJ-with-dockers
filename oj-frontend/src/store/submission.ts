// src/store/submission.ts
import { defineStore } from 'pinia';
import type { SubmissionResult, SubmissionStatus, SubmitCodePayload } from '@/types/submission';
// 确保从你的通用类型文件导入 PaginationInfo
import type { PaginationInfo } from '@/types/index'; // 或者你实际存放 PaginationInfo 的路径

// 假设 API 服务函数定义在 @/api/submission.ts
import {
  submitCodeToApi,
  getSubmissionResultFromApi,
  getSubmissionHistoryFromApiMock, // 用于获取提交历史的模拟 API 函数
  getSubmissionDetailFromApiMock,   // 用于获取提交详情的模拟 API 函数
} from '@/api/submission';

interface SubmissionStoreState {
  isSubmitting: boolean;                      // 是否正在提交代码 (用于按钮 loading)
  isPollingResult: boolean;                   // 是否正在轮询结果 (如果需要轮询)
  currentSubmissionId: string | null;         // 当前提交的ID (主要用于ProblemDetailView的轮询)
  currentSubmissionResult: SubmissionResult | null; // 当前的提交结果 (主要用于ProblemDetailView的轮询结果显示)
  error: string | null;                       // 通用错误信息

  // --- 状态用于 SubmissionListView ---
  submissionHistory: SubmissionResult[];      // 用户的提交历史列表
  isLoadingHistory: boolean;                  // 提交历史列表的加载状态
  pagination: PaginationInfo | null;          // 提交历史列表的分页信息
  currentSubmissionDetail: SubmissionResult | null; // 用于 SubmissionListView 的详情弹窗显示的提交数据
  isLoadingDetail: boolean;                   // 单个提交详情的加载状态
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
    pagination: null, // 初始化为 null，在获取到数据后再填充
    currentSubmissionDetail: null,
    isLoadingDetail: false,
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
        const initialResponse = await submitCodeToApi(payload);
        this.currentSubmissionId = initialResponse.submissionId;
        this.currentSubmissionResult = {
          submissionId: initialResponse.submissionId,
          problemId: payload.problemId,
          // 尝试从 initialResponse 获取 problemTitle，如果API层返回了的话
          problemTitle: (initialResponse as any).problemTitle || `题目 ${payload.problemId}`, // 假设 API 层可能返回
          status: initialResponse.initialStatus || 'Pending',
          code: payload.code,
          language: payload.language,
          createdAt: new Date().toISOString(), // 初始提交时间
        };

        if (this.currentSubmissionResult.status === 'Pending' || this.currentSubmissionResult.status === 'Judging') {
          this.pollSubmissionResult(initialResponse.submissionId);
        }
      } catch (err: any) {
        this.error = err.response?.data?.message || err.message || '代码提交失败';
        console.error('Failed to submit code:', err);
      } finally {
        this.isSubmitting = false;
      }
    },

    /**
     * 轮询获取当前提交的评测结果 (主要用于 ProblemDetailView)
     */
    async pollSubmissionResult(submissionId: string) {
      // 确保只轮询当前正在处理的提交
      if (!submissionId || this.currentSubmissionId !== submissionId || this.isPollingResult) {
        if(this.currentSubmissionId !== submissionId && this.isPollingResult){
            console.log(`[Store] Stopping poll for old submission ${this.currentSubmissionId} as new one ${submissionId} is active or polling is already active.`);
            // 这里可能需要更复杂的逻辑来取消旧的 setTimeout (如果 poll 是在类外部的 setTimeout)
            // 简单起见，依赖 this.currentSubmissionId !== submissionId 来让旧的 poll 实例在下一次检查时停止
        }
        // return; // 如果正在轮询另一个，或者没有ID，或者不是当前ID，则不启动新的（或根据逻辑调整）
      }
      
      // 确保只有在状态是 Pending 或 Judging 时才继续轮询该 submissionId
      if (!this.currentSubmissionResult || (this.currentSubmissionResult.status !== 'Pending' && this.currentSubmissionResult.status !== 'Judging')) {
        this.isPollingResult = false; // 状态已最终化，停止轮询
        return;
      }

      this.isPollingResult = true;
      console.log(`[Store] Polling for submission ID: ${submissionId}`);

      try {
        let attempts = 0;
        const maxAttempts = 20;
        const interval = 3000;

        const poll = async (): Promise<void> => {
          // 再次检查，确保轮询的是当前关注的提交，并且仍在轮询状态
          if (!this.isPollingResult || this.currentSubmissionId !== submissionId) {
            console.log(`[Store] Polling for ${submissionId} aborted or different submission active.`);
            this.isPollingResult = false; // 确保状态重置
            return;
          }

          if (attempts >= maxAttempts) {
            this.error = '获取评测结果超时。';
            if (this.currentSubmissionResult && this.currentSubmissionResult.submissionId === submissionId) {
              this.currentSubmissionResult.status = 'System Error';
              this.currentSubmissionResult.message = this.error;
            }
            this.isPollingResult = false;
            console.warn(`Polling timed out for submission ID: ${submissionId}`);
            return;
          }

          attempts++;
          const resultData = await getSubmissionResultFromApi(submissionId); // 这个 API 获取的是单个提交的最新状态

          // 只更新与当前轮询ID匹配的结果
          if (this.currentSubmissionId === submissionId) {
            this.currentSubmissionResult = resultData;
            if (resultData.status !== 'Pending' && resultData.status !== 'Judging') {
              this.isPollingResult = false;
              console.log(`[Store] Polling complete for submission ID: ${submissionId}`, resultData);
            } else {
              setTimeout(poll, interval); // 继续轮询
            }
          } else {
            // 如果 currentSubmissionId 在轮询期间改变了（例如用户提交了新的代码），停止这个旧的轮询
            this.isPollingResult = false;
             console.log(`[Store] currentSubmissionId changed during poll for ${submissionId}. Stopping this poll.`);
          }
        };
        setTimeout(poll, interval);
      } catch (err: any) {
        this.error = err.response?.data?.message || err.message || '获取提交结果失败';
        this.isPollingResult = false;
        console.error(`Failed to poll submission result for ID ${submissionId}:`, err);
      }
    },

    /**
     * 清除 ProblemDetailView 使用的当前提交结果和ID
     */
    clearCurrentSubmissionResult() {
      this.currentSubmissionResult = null;
      this.currentSubmissionId = null;
      this.isPollingResult = false; // 关键：停止任何正在进行的轮询
      // this.error = null; // 可选：是否清除错误信息
    },

    // --- 新增用于 SubmissionListView 的 Actions ---
    /**
     * 获取提交历史列表
     */
    async fetchSubmissionHistory(params: {
      page?: number;
      limit?: number;
      problemId?: string;
      status?: SubmissionStatus;
      // userId?: string; // 如果需要，从 API 参数中获取
    } = {}) {
      this.isLoadingHistory = true;
      this.error = null; // 清除之前的列表错误
      try {
        // 真实场景中，这里会根据 USE_MOCK (如果全局设置) 或直接调用真实 API 函数
        // const apiFunc = USE_MOCK_SUBMISSION_HISTORY ? getSubmissionHistoryFromApiMock : getSubmissionHistoryFromApi;
        // 为简单起见，我们直接调用模拟函数，因为之前 API 层已经有了模拟数据
        const response = await getSubmissionHistoryFromApiMock(params);

        this.submissionHistory = response.items;
        this.pagination = response.pagination;
      } catch (err: any) {
        this.error = err.message || '获取提交历史失败';
        this.submissionHistory = [];
        this.pagination = null; // 出错时重置分页
        console.error('Failed to fetch submission history:', err);
      } finally {
        this.isLoadingHistory = false;
      }
    },

    /**
     * 获取单个提交的详细信息 (用于 SubmissionListView 的详情弹窗)
     */
    async fetchSubmissionById(submissionId: string) {
      this.isLoadingDetail = true;
      this.error = null; // 清除之前的详情错误
      this.currentSubmissionDetail = null;
      try {
        // const apiFunc = USE_MOCK_SUBMISSION_DETAIL ? getSubmissionDetailFromApiMock : getSubmissionDetailFromApi;
        const responseData = await getSubmissionDetailFromApiMock(submissionId); // 使用模拟函数
        this.currentSubmissionDetail = responseData;
      } catch (err: any) {
        this.error = err.message || `获取提交详情 (ID: ${submissionId}) 失败`;
        console.error(`Failed to fetch submission detail ${submissionId}:`, err);
      } finally {
        this.isLoadingDetail = false;
      }
    },

    /**
     * 清除 SubmissionListView 弹窗中显示的当前提交详情
     */
    clearCurrentSubmissionDetail() {
      this.currentSubmissionDetail = null;
      this.isLoadingDetail = false; // 重置加载状态
      // this.error = null; // 可选
    },

    /**
     * (可选) 清空提交历史列表的状态，例如在组件卸载或重新进入页面时
     */
    clearSubmissionHistory() {
        this.submissionHistory = [];
        this.pagination = null;
        this.isLoadingHistory = false;
        this.error = null; // 通常也清除错误
    }
    // --- 结束新增 Actions ---
  },
});