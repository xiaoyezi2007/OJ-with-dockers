import request from './request'
import type { Problem } from '@/types/problem'

/**
 * 上传一个新题目。
 * @param data 包含题目信息和文件的 FormData 对象
 */
// 修正：将函数名从 reqAddProblem 重命名为 uploadNewProblem，以匹配组件的导入。
export const uploadNewProblem = (data: FormData) => {
  // ==================== 重要说明 ====================
  // 你最新的后端 /api/files/upload 接口需要的是文件，
  // 也就是 FormData 格式。
  //
  // 这意味着，在调用 uploadNewProblem 的地方（你的 Vue 组件中），
  // 你需要创建一个 FormData 对象，并将题目信息和文件 append 进去。
  // ===============================================

  return request<Problem>({
    // URL 指向后端文件上传接口
    url: '/files/upload',
    method: 'POST',
    data,
    // 当使用 FormData 上传文件时，需要让浏览器自动设置 Content-Type
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}