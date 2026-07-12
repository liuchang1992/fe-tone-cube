import apiClient from './client';

export interface DocumentConvertResponse {
  success: boolean;
  result: string;
  file_name: string;
  source_text: string;
  docx_base64?: string | null;
  docx_file_name?: string | null;
  error?: string;
}

export const convertDocumentFile = async (file: File, style: string): Promise<DocumentConvertResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('style', style);

  const { data } = await apiClient.post<DocumentConvertResponse>('/api/document-convert', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });

  if (!data.success) throw new Error(data.error || '文档转换失败');
  return data;
};
