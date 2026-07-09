// src/api/corpus.ts
import apiClient from './client';

export interface CorpusItem {
  id: number;
  file_name: string;
  style_summary: string;
  scene: string;
  created_at: string;
}

// 上传文本语料
export const uploadCorpusText = async (content: string, file_name: string, scene: string = 'all') => {
  return apiClient.post('/api/corpus/upload-text', { content, file_name, scene });
};

// 上传文件语料
export const uploadCorpusFile = async (file: File, scene: string = 'all') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('scene', scene);
  return apiClient.post('/api/corpus/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// 获取语料列表（支持场景筛选）
export const getCorpusList = async (scene?: string) => {
  const params = scene ? { scene } : {};
  return apiClient.get<CorpusItem[]>('/api/corpus/list', { params });
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