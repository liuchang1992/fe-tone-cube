// src/api/history.ts
import apiClient from './client';

export interface HistoryItem {
  id: number;
  input_text: string;
  output_text: string;
  style: string;
  conversion_type: 'text' | 'document';
  file_name: string | null;
  personal_style_id: number | null;
  personal_style_name: string | null;
  personal_style_version: number | null;
  custom_scene_id: number | null;
  custom_scene_name: string | null;
  custom_scene_version: number | null;
  comparison_group_id: string | null;
  comparison_role: 'personal' | 'baseline' | null;
  comparison_preference: 'personal' | 'baseline' | null;
  rewrite_strength: 'light' | 'standard' | 'deep';
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

export const getHistoryComparison = async (comparisonGroupId: string): Promise<HistoryItem[]> => {
  const response = await apiClient.get<{ items: HistoryItem[] }>(
    `/api/history/comparisons/${comparisonGroupId}`,
  );
  return response.data.items;
};

export const saveComparisonPreference = async (
  comparisonGroupId: string,
  preference: 'personal' | 'baseline',
): Promise<void> => {
  await apiClient.put(`/api/history/comparisons/${comparisonGroupId}/preference`, { preference });
};
