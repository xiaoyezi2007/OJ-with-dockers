// src/api/problem.ts
import apiClient from './request'; 
import type { Problem } from '@/types/problem';
import type { GetProblemListRequestParams, GetProblemListResponseBody } from '@/types/api';
import type { PaginationInfo } from '@/types/index';

// --- 真实 API 调用函数 ---

/**
 * 获取题目列表 (真实 API)
 */
export function getProblemList(params: GetProblemListRequestParams): Promise<GetProblemListResponseBody> {
  // 修正：后端现在直接返回我们需要的数据结构，所以只需直接返回 Promise 即可
  return apiClient.get('/files', { params });
}

/**
 * 获取单个题目详情 (真实 API)
 */
export function getProblemDetail(id: string | number): Promise<Problem> {
  // 修正 URL: 指向我们之前在后端添加的 GET /api/files/:id 接口
  return apiClient.get(`/files/${id}`)
    .then(response => {
      return response.data as Problem;
    })
    .catch(error => {
      console.error(`Error fetching problem detail for ID ${id} from real API:`, error);
      throw error;
    });
}


// --- 模拟 API 调用函数 ---
// 下面的模拟数据和函数保持不变，它们在你无法连接后端时用于前端开发。

const MOCK_PROBLEMS_DB: Problem[] = [
  { id: 'P1001', title: 'A+B Problem', difficulty: 'Easy', acceptanceRate: 0.65, tags: ['入门', '简单数学'], description: "Calculate a + b.", timeLimit: 1000, memoryLimit: 256, examples: [{input: "1 2", output: "3"}]},
  { id: 'P1002', title: '两数之和', difficulty: 'Easy', acceptanceRate: 0.55, tags: ['数组', '哈希表'], description: "Find two numbers that sum to a target.", timeLimit: 1000, memoryLimit: 256, examples: [{input: "[2,7,11,15], 9", output: "[0,1]"}]},
  { id: 'P1003', title: '最长公共子序列', difficulty: 'Medium', acceptanceRate: 0.40, tags: ['动态规划', '字符串'], description: "Find the longest common subsequence.", timeLimit: 2000, memoryLimit: 512, examples: [{input: "abcde, ace", output: "3"}]},
];

export async function getProblemListMock(params: GetProblemListRequestParams): Promise<GetProblemListResponseBody> {
    console.log(`[Mock API Service] getProblemList with params:`, params);
    await new Promise(resolve => setTimeout(resolve, 300));
    let problemsToReturn = [...MOCK_PROBLEMS_DB];
    const page = params.page || 1;
    const limit = params.limit || 10;
    const totalItems = problemsToReturn.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const paginatedProblems = problemsToReturn.slice(startIndex, startIndex + limit);
    const paginationResult: PaginationInfo = {
        currentPage: page,
        pageSize: limit,
        totalItems: totalItems,
        totalPages: totalPages,
    };
    return { items: paginatedProblems, pagination: paginationResult };
}

export async function getProblemDetailMock(id: string | number): Promise<Problem> {
    console.log(`[Mock API Service] getProblemDetail with id:`, id);
    await new Promise(resolve => setTimeout(resolve, 100));
    const problem = MOCK_PROBLEMS_DB.find(p => String(p.id) === String(id));
    if (problem) {
        return { ...problem };
    }
    return Promise.reject(new Error('Problem not found in mock data'));
}