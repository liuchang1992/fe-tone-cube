import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// 请求拦截器（可添加 token）
apiClient.interceptors.request.use((config) => {
  // 从 localStorage 取 token
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 响应拦截器（统一错误处理）
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const msg = error.response?.data?.error || error.message || '网络错误';
    return Promise.reject(new Error(msg));
  }
);

export default apiClient;