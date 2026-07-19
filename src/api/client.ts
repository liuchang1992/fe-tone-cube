import axios from 'axios';
import { getStoredToken } from './auth';
import {
  MaintenanceError,
  publishMaintenanceNotice,
  type MaintenanceNotice,
} from './maintenance';
import { getVisitorId } from '@/utils/visitorId';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// 请求拦截器：自动携带 token 和 visitorId
apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  config.headers['X-Visitor-Id'] = getVisitorId();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const responseData = error.response?.data as {
      code?: string;
      message?: string;
      retry_after?: number;
    } | undefined;
    if (error.response?.status === 503 && responseData?.code === 'maintenance') {
      const notice: MaintenanceNotice = {
        message: responseData.message || '系统正在升级，请稍后再试',
        retryAfter: Number.isFinite(responseData.retry_after)
          ? Math.max(0, Number(responseData.retry_after))
          : 0,
      };
      publishMaintenanceNotice(notice);
      return Promise.reject(new MaintenanceError(notice));
    }
    // 如果是401且不是登录/注册接口，清除本地token
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      if (!url.includes('/auth/')) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
      }
    }
    const isTimeout = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
    const msg = isTimeout
      ? '请求处理超时，请稍后重试'
      : error.response?.data?.error || error.response?.data?.detail || error.message || '网络错误';
    return Promise.reject(new Error(msg));
  }
);

export default apiClient;
