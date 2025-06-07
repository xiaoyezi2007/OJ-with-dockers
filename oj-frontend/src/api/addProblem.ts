import apiClient from './request';
import type { Problem } from '@/types/problem';

/**
 * 上传一个新题目
 * @param data 包含题目信息和文件的 FormData 对象
 */
export const uploadNewProblem = (data: FormData): Promise<{message: string, problem: Problem}> => {
  // 当 apiClient.post 的第二个参数是 FormData 的实例时，
  // axios 会自动将 Content-Type 设置为 multipart/form-data 并附带正确的 boundary。
  // 所以我们【不能】手动设置 Content-Type。  
  return apiClient.post('/problems', data);
}