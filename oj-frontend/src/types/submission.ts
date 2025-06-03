// src/types/submission.ts

/**
 * 代码提交的可能状态
 * 你可以根据你的 OJ 系统的实际情况来增删状态
 */
export type SubmissionStatus =
  | 'Pending'          // 等待评测
  | 'Judging'          // 正在评测
  | 'Accepted'         // 答案正确
  | 'Wrong Answer'     // 答案错误
  | 'Time Limit Exceeded' // 超出时间限制
  | 'Memory Limit Exceeded' // 超出内存限制
  | 'Output Limit Exceeded' // 输出超出限制
  | 'Runtime Error'    // 运行时错误
  | 'Compile Error'    // 编译错误
  | 'System Error'     // 系统错误
  | 'Skipped';         // 已跳过 (例如，如果前面的测试点未通过)

/**
 * 单个测试点的结果 (如果你的系统返回每个测试点的详细信息)
 */
export interface TestCaseResult {
  id: number;              // 测试点编号
  status: SubmissionStatus;
  time?: number;             // 耗时 (ms)
  memory?: number;           // 内存 (KB)
  input?: string;            // 测试点输入 (可选，用于调试)
  output?: string;           // 程序实际输出 (可选)
  expectedOutput?: string;   // 预期输出 (可选)
  checkerMessage?: string;   // Checker 的信息 (可选)
}

/**
 * 代码提交结果的数据结构
 */
export interface SubmissionResult {
  submissionId: string;        // 提交的唯一ID
  problemId: string | number;  // 对应的题目ID
  problemTitle?: string;       // 题目名称
  userId?: string;             // 用户ID (可选)
  status: SubmissionStatus;      // 最终的评测状态
  message?: string;            // 总体信息，例如编译错误信息
  code?: string;               // 提交的代码 (可选)
  language?: string;           // 提交的语言 (可选)
  time?: number;               // 最大耗时 (ms) 或总耗时
  memory?: number;             // 最大内存消耗 (KB) 或总内存
  createdAt?: string | Date;   // 提交时间
  judgedAt?: string | Date;    // 评测完成时间 (可选)
  testCases?: TestCaseResult[]; // 各个测试点的结果 (可选，如果后端提供)
}

/**
 * 提交代码时发送给后端的请求体结构
 */
export interface SubmitCodePayload {
  problemId: string | number;
  language: 'cpp' | 'java' | 'python'; // 限制可选的语言
  code: string;
  // 根据需要可以添加其他字段，例如 contestId 等
}