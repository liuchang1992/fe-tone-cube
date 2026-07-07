import axios from 'axios';
import { getStoredToken } from './auth';
import { getVisitorId } from '@/utils/visitorId';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// 请求拦截器：自动携带 token 和 visitorId
apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    // 未登录时，携带访客ID
    const visitorId = getVisitorId();
    config.headers['X-Visitor-Id'] = visitorId;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    // 如果是401且不是登录/注册接口，清除本地token
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      if (!url.includes('/auth/')) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
      }
    }
    const msg = error.response?.data?.error || error.message || '网络错误';
    return Promise.reject(new Error(msg));
  }
);

export default apiClient;