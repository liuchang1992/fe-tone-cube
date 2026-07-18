import apiClient from './client';
import type { RewriteStrength } from './convert';

export interface DocumentConvertResponse {
  success: boolean;
  result: string;
  file_name: string;
  source_text: string;
  docx_base64?: string | null;
  docx_file_name?: string | null;
  error?: string;
}

export interface DocumentTaskCreateResponse {
  success: boolean;
  task_id: string;
  status: 'queued';
  error?: string;
}

export interface DocumentTaskStatusResponse {
  success: boolean;
  task_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  result?: DocumentConvertResponse;
  error?: string;
}

export const createDocumentConvertTask = async (
  file: File,
  style: string,
  personalStyleId?: number | null,
  rewriteStrength: RewriteStrength = 'standard',
): Promise<DocumentTaskCreateResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('style', style);
  formData.append('rewrite_strength', rewriteStrength);
  if (personalStyleId) formData.append('personal_style_id', String(personalStyleId));

  const { data } = await apiClient.post<DocumentTaskCreateResponse>('/api/document-convert', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });

  if (!data.success) throw new Error(data.error || '文档任务创建失败');
  return data;
};

export const getDocumentConvertTask = async (
  taskId: string,
): Promise<DocumentTaskStatusResponse> => {
  const { data } = await apiClient.get<DocumentTaskStatusResponse>(`/api/document-convert/${taskId}`);
  return data;
};
