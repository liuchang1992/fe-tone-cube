import apiClient from './client';

export type RewriteStrength = 'light' | 'standard' | 'deep';

export interface ConvertRequest {
  text: string;
  style: string;
  personal_style_id?: number;
  use_personal_style?: boolean;
  comparison_group_id?: string;
  rewrite_strength?: RewriteStrength;
}

export interface ConvertResponse {
  success: boolean;
  result: string;
  usage?: { prompt_tokens: number; completion_tokens: number };
  error?: string; 
  comparison_group_id?: string | null;
}

export interface TextConversionResult {
  result: string;
  comparisonGroupId: string | null;
}

export const convertTextDetailed = async (params: ConvertRequest): Promise<TextConversionResult> => {
  const { data } = await apiClient.post<ConvertResponse>('/api/convert', params, {
    timeout: 60000,
  });
  if (!data.success) throw new Error(data.error || '转换失败');
  return {
    result: data.result,
    comparisonGroupId: data.comparison_group_id || null,
  };
};

export const convertText = async (params: ConvertRequest): Promise<string> => {
  const conversion = await convertTextDetailed(params);
  return conversion.result;
};

export interface QuotaResponse {
  remaining: number;
  document_remaining: number;
}

export const getQuota = async (): Promise<QuotaResponse> => {
  const { data } = await apiClient.get<QuotaResponse>('/api/quota');
  return data;
};
