import apiClient from './client';

export interface ConvertRequest {
  text: string;
  style: string;
}

export interface ConvertResponse {
  success: boolean;
  result: string;
  usage?: { prompt_tokens: number; completion_tokens: number };
  error?: string; 
}

export const convertText = async (params: ConvertRequest): Promise<string> => {
  const { data } = await apiClient.post<ConvertResponse>('/api/convert', params);
  if (!data.success) throw new Error(data.error || '转换失败');
  return data.result;
};

export interface QuotaResponse {
  remaining: number;
  document_remaining: number;
}

export const getQuota = async (): Promise<QuotaResponse> => {
  const { data } = await apiClient.get<QuotaResponse>('/api/quota');
  return data;
};
