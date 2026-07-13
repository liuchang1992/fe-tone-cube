// src/api/history.ts
import apiClient from './client';

export interface HistoryItem {
  id: number;
  input_text: string;
  output_text: string;
  style: string;
  conversion_type: 'text' | 'document';
  file_name: string | null;
  created_at: string;
}

export interface HistoryListResponse {
  total: number;
  limit: number;
  offset: number;
  items: HistoryItem[];
}

export const getHistoryList = async (limit: number = 10, offset: number = 0): Promise<HistoryListResponse> => {
  const res = await apiClient.get<HistoryListResponse>('/api/history/list', {
    params: { limit, offset }
  });
  return res.data;
};

export const deleteHistoryItem = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/history/${id}`);
};

export const clearAllHistory = async (): Promise<void> => {
  await apiClient.delete('/api/history/clear');
};
