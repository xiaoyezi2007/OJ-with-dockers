// src/types/index.ts

/**
 * 分页信息接口
 * 用于 API 响应和 Pinia store 中的分页状态
 */
export interface PaginationInfo {
  currentPage: number;    // 当前页码
  pageSize: number;       // 每页条目数
  totalItems: number;     // 总条目数 (对应之前的 total)
  totalPages: number;     // 总页数
}

// 你也可以在这里定义其他项目范围内的通用类型，例如：
// /**
//  * 通用的 API 列表响应结构
//  * T 代表列表中项目的类型，例如 Problem, Submission 等
//  */
// export interface ApiListResponse<T> {
//   items: T[];
//   pagination: PaginationInfo;
// }

// /**
//  * 通用的 API 单个项目响应结构
//  */
// export interface ApiDetailResponse<T> {
//   item: T;
// }