// src/api/problem.ts
import apiClient from './request'; // 引入配置好的 Axios 实例
import type { Problem } from '@/types/problem';
import type { GetProblemListRequestParams, GetProblemListResponseBody } from '@/types/api';
import type { PaginationInfo } from '@/types/index'; // 确保 PaginationInfo 的导入路径正确

// --- 模拟数据定义 ---
const MOCK_PROBLEMS_DB: Problem[] = [
  { id: 'P1001', title: 'A+B Problem', difficulty: 'Easy', acceptanceRate: 0.65, tags: ['入门', '简单数学'], description: "Calculate a + b.", timeLimit: 1000, memoryLimit: 256, examples: [{input: "1 2", output: "3"}]},
  { id: 'P1002', title: '两数之和', difficulty: 'Easy', acceptanceRate: 0.55, tags: ['数组', '哈希表'], description: "Find two numbers that sum to a target.", timeLimit: 1000, memoryLimit: 256, examples: [{input: "[2,7,11,15], 9", output: "[0,1]"}]},
  { id: 'P1003', title: '最长公共子序列', difficulty: 'Medium', acceptanceRate: 0.40, tags: ['动态规划', '字符串'], description: "Find the longest common subsequence.", timeLimit: 2000, memoryLimit: 512, examples: [{input: "abcde, ace", output: "3"}]},
  // ... 你可以添加更多模拟题目数据
];

// --- 真实 API 调用函数 ---

/**
 * 获取题目列表 (真实 API)
 */
export function getProblemList(params: GetProblemListRequestParams): Promise<GetProblemListResponseBody> {
  return apiClient.get('/problems', { params })
    .then(response => {
      // 假设后端直接返回 GetProblemListResponseBody 结构的数据
      // 如果你的 apiClient 拦截器已经处理了外层包裹，这里可能直接是 response
      // 如果 response.data 是最终数据，就这样写：
      return response.data as GetProblemListResponseBody;
    })
    .catch(error => {
      console.error("Error fetching problem list from real API:", error);
      throw error; // 重新抛出错误，让 store 中的 catch 处理
    });
}

/**
 * 获取单个题目详情 (真实 API)
 */
export function getProblemDetail(id: string | number): Promise<Problem> {
  return apiClient.get(`/problems/${id}`)
    .then(response => {
      // 假设后端直接返回 Problem 结构的数据
      return response.data as Problem;
    })
    .catch(error => {
      console.error(`Error fetching problem detail for ID ${id} from real API:`, error);
      throw error;
    });
}

// --- 模拟 API 调用函数 ---

/**
 * 获取题目列表 (模拟 API)
 */
export async function getProblemListMock(params: GetProblemListRequestParams): Promise<GetProblemListResponseBody> {
    console.log(`[Mock API Service] getProblemList with params:`, params);
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200)); // 模拟网络延迟

    let problemsToReturn = [...MOCK_PROBLEMS_DB];

    // 模拟筛选
    if (params.keyword) {
      const keywordLower = String(params.keyword).toLowerCase();
      problemsToReturn = problemsToReturn.filter(p =>
        p.title.toLowerCase().includes(keywordLower)
      );
    }
    console.log(`[MOCK API] Filtering by difficulty. Received params.difficulty: >>${params.difficulty}<< (Type: ${typeof params.difficulty})`);
    if (params.difficulty) { // 只有当 params.difficulty 是 'Easy', 'Medium', 或 'Hard' 时才筛选
      problemsToReturn = problemsToReturn.filter(p => {
console.log(`[MOCK API] Comparing: Problem ID <span class="math-inline">\{p\.id\}, Problem Difficulty \>\></span>{p.difficulty}<< (Type: <span class="math-inline">\{typeof p\.difficulty\}\) \=\=\= Param Difficulty \>\></span>{params.difficulty}<< (Type: ${typeof params.difficulty})`);
        return p.difficulty === params.difficulty;
      });
    } 
    if (params.tags && params.tags.length > 0) {
      problemsToReturn = problemsToReturn.filter(p =>
        params.tags!.every(tag => p.tags?.includes(tag))
      );
    }

    // 模拟分页
    const page = params.page || 1;
    const limit = params.limit || 10; // 默认每页10条
    const totalItems = problemsToReturn.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const paginatedProblems = problemsToReturn.slice(startIndex, startIndex + limit);

    const paginationResult: PaginationInfo = { // 确保类型匹配
        currentPage: page,
        pageSize: limit,
        totalItems: totalItems,
        totalPages: totalPages,
    };

    return {
        items: paginatedProblems,
        pagination: paginationResult,
    };
}

/**
 * 获取单个题目详情 (模拟 API)
 */
export async function getProblemDetailMock(id: string | number): Promise<Problem> {
    console.log(`[Mock API Service] getProblemDetail with id:`, id);
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100));
    const problem = MOCK_PROBLEMS_DB.find(p => String(p.id) === String(id));

    if (problem) {
        // 返回一个包含所有 Problem 接口中定义的属性的对象
        return {
            ...problem, // 确保 problem 对象本身符合 Problem 接口（例如包含 difficulty）
            description: problem.description || `这是题目 "${problem.title}" 在模拟数据中的详细描述。`,
            timeLimit: problem.timeLimit || 1000,
            memoryLimit: problem.memoryLimit || 256,
            examples: problem.examples || [{ input: "示例输入", output: "示例输出" }],
            constraints: problem.constraints || ["模拟的约束条件1", "模拟的约束条件2"],
            // 如果 Problem 接口还有其他必选属性，确保在这里提供
        };
    }
    return Promise.reject(new Error('Problem not found in mock data'));
}