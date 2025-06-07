// src/api/request.ts
import axios from 'axios';
import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
// 根据需要导入 NProgress 或其他加载提示库
// import NProgress from 'nprogress';
// import 'nprogress/nprogress.css';
import { ElMessage } from 'element-plus'; 

const request = axios.create({
  // 修正：将 baseURL 设置为代理关键字 /api
  // 这样所有请求如 request.post('/files/upload') 都会被自动构造成 /api/files/upload
  // 然后被 Vite 代理正确转发到 http://localhost:5000/api/files/upload
  baseURL: '/api', 
  timeout: 5000,
})

const apiClient: AxiosInstance = axios.create({
  baseURL: 'http://localhost:5000/api', // <-- 修改这里
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
    // 检查响应中是否有 data 属性，如果有，直接返回 data
    // 这样所有 API 调用在 .then() 或 await 之后拿到的都是后端返回的纯数据
    if (response && response.data) {
      return response.data;
    }
    // 如果没有 data，返回整个响应以防万一
    return response;
  },
  (error: AxiosError) => {
    // 统一处理错误信息
    const message = (error.response?.data as any)?.message || error.message || '未知网络错误';
    ElMessage.error(message);
    return Promise.reject(error);
  }
);

export default apiClient;