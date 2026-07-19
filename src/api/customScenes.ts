import apiClient from './client';
import type { RewriteStrength } from './convert';

export interface CustomSceneConfig {
  name: string;
  description: string;
  audience: string;
  goal: string;
  structure: string[];
  instructions: string[];
  prohibited: string[];
}

export interface CustomScene {
  id: number;
  name: string;
  description: string;
  config: CustomSceneConfig;
  status: 'active' | 'archived';
  current_version: number;
  created_at: string;
  updated_at: string;
}

export const listCustomScenes = async (): Promise<CustomScene[]> => {
  const { data } = await apiClient.get<{ items: CustomScene[] }>('/api/custom-scenes');
  return data.items;
};

export const generateCustomScene = async (description: string): Promise<CustomSceneConfig> => {
  const { data } = await apiClient.post<{ config: CustomSceneConfig }>('/api/custom-scenes/generate', {
    description,
  }, { timeout: 60000 });
  return data.config;
};

export const createCustomScene = async (config: CustomSceneConfig): Promise<CustomScene> => {
  const { data } = await apiClient.post<CustomScene>('/api/custom-scenes', { config });
  return data;
};

export const updateCustomScene = async (
  sceneId: number,
  config: CustomSceneConfig,
): Promise<CustomScene> => {
  const { data } = await apiClient.patch<CustomScene>(`/api/custom-scenes/${sceneId}`, { config });
  return data;
};

export const deleteCustomScene = async (sceneId: number): Promise<void> => {
  await apiClient.delete(`/api/custom-scenes/${sceneId}`);
};

export const previewCustomScene = async (
  text: string,
  config: CustomSceneConfig,
  rewriteStrength: RewriteStrength,
  personalStyleId?: number | null,
): Promise<string> => {
  const { data } = await apiClient.post<{ result: string }>('/api/custom-scenes/preview', {
    text,
    config,
    rewrite_strength: rewriteStrength,
    ...(personalStyleId ? { personal_style_id: personalStyleId } : {}),
  }, { timeout: 60000 });
  return data.result;
};
