// src/api/request.ts
import axios from 'axios';
import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
// 根据需要导入 NProgress 或其他加载提示库
// import NProgress from 'nprogress';
// import 'nprogress/nprogress.css';

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1', // 确保 API 前缀正确
  timeout: 10000, // 请求超时
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // NProgress?.start();
    // const token = localStorage.getItem('token'); // 或从 auth store 获取
    // if (token && config.headers) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error : AxiosError) => {
    // NProgress?.done();
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // NProgress?.done();
    // 通常后端会在一个固定的字段（如 data 或 result）中返回实际数据
    // 例如，如果后端返回 { code: 0, message: 'success', data: { ... } }
    // if (response.data && response.data.code === 0) {
    //   return response.data.data; // 直接返回核心数据
    // } else {
    //   // 处理业务错误，例如弹窗提示
    //   // ElMessage.error(response.data.message || 'Error');
    //   return Promise.reject(new Error(response.data.message || 'Error'));
    // }
    return response; // 或者直接返回整个 response，在 API 服务函数中处理
  },
  (error) => {
    // NProgress?.done();
    // if (error.response) {
    //   // 根据状态码处理错误，例如 401 跳转登录页
    //   // ElMessage.error(error.response.data.message || `Error: ${error.response.status}`);
    // } else {
    //   // ElMessage.error('Network Error');
    // }
    return Promise.reject(error);
  }
);

export default apiClient;