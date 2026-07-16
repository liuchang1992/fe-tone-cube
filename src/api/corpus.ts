// src/api/corpus.ts
import apiClient from './client';

export interface CorpusItem {
  id: number;
  file_name: string;
  style_summary: string;
  scene: string;
  created_at: string;
  is_active?: boolean;
}

export interface CorpusUploadResponse {
  message: string;
  style_summary: string;
  scene: string;
  replaced: boolean;
  remaining: number;
}

export interface CorpusQuotaResponse {
  remaining: number;
  daily_limit: number;
  reset_at: string;
}

// 上传文本语料
export const uploadCorpusText = async (content: string, file_name: string, scene: string = 'all') => {
  return apiClient.post<CorpusUploadResponse>('/api/corpus/upload-text', { content, file_name, scene }, {
    timeout: 60000,
  });
};

// 上传文件语料
export const uploadCorpusFile = async (file: File, scene: string = 'all') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('scene', scene);
  return apiClient.post<CorpusUploadResponse>('/api/corpus/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
};

export const getCorpusQuota = async (): Promise<CorpusQuotaResponse> => {
  const response = await apiClient.get<CorpusQuotaResponse>('/api/corpus/quota');
  return response.data;
};

export interface CorpusListResponse {
  total: number;
  page: number;
  page_size: number;
  items: CorpusItem[];
}

// 获取语料列表（支持场景筛选）
export const getCorpusList = async (page: number = 1, pageSize: number = 10, scene?: string) => {
  const params: any = { page, page_size: pageSize };
  if (scene) params.scene = scene;
  const res = await apiClient.get<CorpusListResponse>('/api/corpus/list', { params });
  return res.data;
};

// 删除单条语料
export const deleteCorpusItem = async (id: number) => {
  return apiClient.delete(`/api/corpus/${id}`);
};

// 清空语料（支持场景筛选）
export const clearCorpus = async (scene?: string) => {
  const params = scene ? { scene } : {};
  return apiClient.delete('/api/corpus/clear', { params });
};
