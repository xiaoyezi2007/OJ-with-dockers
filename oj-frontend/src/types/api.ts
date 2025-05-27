// src/types/api.ts

// 导入题目相关的类型，因为请求参数可能会用到
import type { ProblemDifficulty } from './problem'; // 假设 ProblemDifficulty 在 src/types/problem.ts 中定义
import type { Problem } from './problem';         // 假设 Problem 在 src/types/problem.ts 中定义
import type { PaginationInfo } from './index';    // 从 src/types/index.ts 导入 PaginationInfo

/**
 * 获取题目列表 API 的请求参数类型
 */
export interface GetProblemListRequestParams {
  page?: number;                            // 请求的页码
  limit?: number;                           // 每页数量
  keyword?: string;                         // 搜索关键词
  difficulty?:  ''|ProblemDifficulty;        // 筛选难度 (空字符串表示不限)
  tags?: string[];                          // 按标签筛选 (假设后端接受字符串数组)
  // 可以根据你的 API 设计添加其他筛选或排序参数
  // sortBy?: string;
  // sortOrder?: 'asc' | 'desc';
}

/**
 * (可选) 获取题目列表 API 的响应体结构类型
 * 如果你的 API 响应体有一个固定的包裹结构，可以在这里定义。
 * 例如，如果后端返回 { items: Problem[], pagination: PaginationInfo }
 */
export interface GetProblemListResponseBody {
  items: Problem[];
  pagination: PaginationInfo;
}

/**
 * (可选) 获取单个题目详情 API 的响应体结构类型
 * 通常，这可能就是 Problem 类型本身，或者一个包含 Problem 的对象。
 */
// export type GetProblemDetailResponseBody = Problem;
// 或者
// export interface GetProblemDetailResponseBody {
//   problem: Problem;
// }


// 你可以为其他 API 端点（如提交、用户认证等）继续在这里添加请求和响应类型
// 例如:
// export interface SubmitCodeRequestBody {
//   problemId: string | number;
//   language: string;
//   code: string;
// }
//
// export interface SubmitCodeResponseBody {
//   submissionId: string;
//   status: string; // e.g., 'Pending'
// }