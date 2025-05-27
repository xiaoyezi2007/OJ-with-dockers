// src/types/problem.ts

/**
 * 题目难度的可能取值
 */
export type ProblemDifficulty =   'Easy' | 'Medium' | 'Hard';

/**
 * 单个题目的数据结构接口
 */
export interface Problem {
  id: string | number; // 题目唯一标识，可以是数字或字符串
  title: string;       // 题目标题
  description?: string;  // 题目描述 (题目详情页会用到)
  difficulty: ProblemDifficulty; // 题目难度
  acceptanceRate?: number; // 通过率 (0.0 到 1.0 之间的小数)
  tags?: string[];         // 题目标签，如 "数组", "动态规划" 等
  timeLimit?: number;      // 时间限制 (ms) (题目详情页会用到)
  memoryLimit?: number;    // 内存限制 (MB) (题目详情页会用到)
  // 根据实际后端 API 可能还有其他字段，如创建时间、出题人等
   examples?: Array<{ input: string; output: string; explanation?: string }>; // 输入输出示例
   constraints?: string[]; // 约束条件
}

/**
 * 获取题目列表 API 的查询参数接口 (用于 fetchProblems action)
 */
export interface FetchProblemsParams {
  page?: number;
  limit?: number;
  keyword?: string;
  difficulty?: ProblemDifficulty; // 允许空字符串表示不筛选难度(直接在字段里添加了)
  tags?: string[]; // 按标签筛选
  // 其他可能的筛选或排序参数
  // sortBy?: string;
  // sortOrder?: 'asc' | 'desc';
}
