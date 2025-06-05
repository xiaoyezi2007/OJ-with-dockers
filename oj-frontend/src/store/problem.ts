// src/store/problem.ts
import { defineStore } from 'pinia';
// 从你的类型文件中导入
import type { Problem } from '@/types/problem';
import type { PaginationInfo } from '@/types'; // 或 '@/types/index'
import type { GetProblemListRequestParams } from '@/types/api';

// 从你的 API 服务文件中导入
import { getProblemList, getProblemDetail, getProblemListMock, getProblemDetailMock } from '@/api/problem'; // 导入真实和模拟的API

// 控制是否使用模拟 API
const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'false';

interface ProblemStoreState {
  problems: Problem[];
  currentProblem: Problem | null;
  isLoading: boolean;
  error: string | null;
  pagination: PaginationInfo;
}

export const useProblemStore = defineStore('problem', {
  state: (): ProblemStoreState => ({
    problems: [],
    currentProblem: null,
    isLoading: false,
    error: null,
    pagination: {
      currentPage: 1,
      pageSize: 10,
      totalItems: 0,
      totalPages: 0,
    },
  }),

  getters: {
    totalProblems: (state) => state.pagination.totalItems,
  },

  actions: {
    async fetchProblems(params: GetProblemListRequestParams = {}) {
      this.isLoading = true;
      this.error = null;
      try {
        const apiFunc = USE_MOCK ? getProblemListMock : getProblemList;
        const response = await apiFunc(params); // 调用封装的 API 函数

        this.problems = response.items;
        this.pagination = response.pagination;

      } catch (err: any) {
        this.error = err.message || '获取题目列表失败';
        this.problems = [];
        this.pagination.totalItems = 0;
        this.pagination.totalPages = 0;
        console.error('Failed to fetch problems:', err);
      } finally {
        this.isLoading = false;
      }
    },

    async fetchProblemById(id: string | number) {
      this.isLoading = true;
      this.error = null;
      this.currentProblem = null;
      try {
        const apiFunc = USE_MOCK ? getProblemDetailMock : getProblemDetail;
        const problemData = await apiFunc(id); // 调用封装的 API 函数
        this.currentProblem = problemData;
      } catch (err: any) {
        this.error = err.message || `获取题目详情 (ID: ${id}) 失败`;
        console.error(`Failed to fetch problem ${id}:`, err);
      } finally {
        this.isLoading = false;
      }
    },

    clearCurrentProblem() {
      this.currentProblem = null;
    }
  },
});