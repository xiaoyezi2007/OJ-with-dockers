// src/api/adminProblem.ts
import apiClient from './request'; // 你配置好的 Axios 实例
import type { Problem } from '@/types/problem'; // 假设 Problem 类型用于成功响应

interface UploadProblemSuccessResponse {
  message: string;
  problem: Problem; // 或者后端返回的其他成功信息结构
}

/**
 * 上传新题目到后端
 * @param formData 包含题目数据 (JSON字符串) 和测试点文件的 FormData 对象
 */
export async function uploadNewProblem(formData: FormData): Promise<UploadProblemSuccessResponse> {
  console.log('[API adminProblem.ts] Uploading new problem...');
  try {
    // apiClient.post 返回的是 AxiosResponse，其 .data 属性包含后端返回的实际数据
    const response = await apiClient.post<UploadProblemSuccessResponse>(
      '/admin/problems/upload', // <--- 这是你需要与后端约定的API端点路径
      formData,
      {
        headers: {
          // Content-Type 会被 FormData 自动设置为 'multipart/form-data'
          // 如果有认证，Axios 拦截器应该会处理 Token
        },
        // 如果上传文件较大，可能需要监听上传进度
        // onUploadProgress: progressEvent => {
        //   const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        //   console.log(`Upload progress: ${percentCompleted}%`);
        // }
      }
    );
    // 假设后端在成功时直接返回 UploadProblemSuccessResponse 结构
    // 如果你的 apiClient 的响应拦截器已经处理了外层包裹，这里可能直接是 response
    return response.data;
  } catch (error) {
    console.error('[API adminProblem.ts] Error uploading new problem:', error);
    // 错误会在 apiClient 的响应拦截器中被 ElMessage 提示，这里重新抛出给上层 catch
    throw error;
  }
}