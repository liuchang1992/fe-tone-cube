import apiClient from './client';

export type StylePurpose =
  | 'general'
  | 'daily'
  | 'work'
  | 'social_media'
  | 'brand'
  | 'customer_service'
  | 'other';

export type MaterialType =
  | 'daily'
  | 'moments'
  | 'xiaohongshu'
  | 'article'
  | 'email'
  | 'work_report'
  | 'customer_service'
  | 'brand_copy'
  | 'other';

export type StylePreviewScene =
  | 'formal'
  | 'xiaohongshu'
  | 'wechat'
  | 'email'
  | 'academic'
  | 'marketing'
  | 'customer_service'
  | 'concise'
  | 'polite'
  | 'moments'
  | 'short_video'
  | 'government'
  | 'business'
  | 'research'
  | 'paper';

export type StylePreviewStrength = 'light' | 'standard' | 'deep';

export interface StyleDimensions {
  formality: number;
  warmth: number;
  concision: number;
  emotional_intensity: number;
  directness: number;
  professionalism: number;
  humor: number;
  marketing_tone: number;
}

export interface StructureRule {
  element: 'date' | 'heading' | 'greeting' | 'signature' | 'bullet' | 'numbering' | 'separator' | 'emoji' | 'hashtag' | 'custom';
  role: string;
  position: 'document_start' | 'document_end' | 'group_start' | 'group_end' | 'before_item' | 'after_item' | 'inline';
  scope: 'document' | 'group' | 'item' | 'paragraph';
  frequency: 'once' | 'once_per_group' | 'once_per_item' | 'optional' | 'repeated';
  source_policy: 'input_only' | 'fixed' | 'generated';
  pattern: string;
  instruction: string;
}

export interface StyleRules {
  sentence_patterns: string[];
  preferred_phrases: string[];
  avoided_phrases: string[];
  organization: string[];
  custom_instructions: string[];
  protected_terms: string[];
  structure_rules: StructureRule[];
}

export interface PersonalStyleDetails {
  version_number: number;
  summary: string;
  dimensions: Partial<StyleDimensions>;
  rules: Partial<StyleRules>;
  created_at: string;
}

export interface PersonalStyleVersion extends PersonalStyleDetails {
  is_current?: boolean;
}

export interface PersonalStyle {
  id: number;
  name: string;
  purpose: StylePurpose;
  status: 'draft' | 'active' | 'archived';
  current_version: number;
  is_default: boolean;
  material_count: number;
  material_char_count: number;
  created_at: string;
  updated_at: string;
  details?: PersonalStyleDetails | null;
}

export interface StyleMaterial {
  id: number;
  file_name: string;
  material_type: MaterialType;
  is_representative: boolean;
  char_count: number;
  preview?: string;
  content?: string;
  created_at: string;
}

export const DEFAULT_DIMENSIONS: StyleDimensions = {
  formality: 3,
  warmth: 3,
  concision: 3,
  emotional_intensity: 3,
  directness: 3,
  professionalism: 3,
  humor: 1,
  marketing_tone: 1,
};

export const EMPTY_RULES: StyleRules = {
  sentence_patterns: [],
  preferred_phrases: [],
  avoided_phrases: [],
  organization: [],
  custom_instructions: [],
  protected_terms: [],
  structure_rules: [],
};

export const listPersonalStyles = async (): Promise<PersonalStyle[]> => {
  const response = await apiClient.get<{ items: PersonalStyle[] }>('/api/personal-styles');
  return response.data.items;
};

export const getPersonalStyle = async (styleId: number): Promise<PersonalStyle> => {
  const response = await apiClient.get<PersonalStyle>(`/api/personal-styles/${styleId}`);
  return response.data;
};

export const createPersonalStyle = async (name: string, purpose: StylePurpose) => {
  const response = await apiClient.post<{ id: number }>('/api/personal-styles', { name, purpose });
  return response.data;
};

export const updatePersonalStyle = async (
  styleId: number,
  payload: { name?: string; purpose?: StylePurpose },
) => {
  await apiClient.patch(`/api/personal-styles/${styleId}`, payload);
};

export const archivePersonalStyle = async (styleId: number) => {
  await apiClient.delete(`/api/personal-styles/${styleId}`);
};

export const setDefaultPersonalStyle = async (styleId: number) => {
  const response = await apiClient.put<{
    id: number;
    unchanged: boolean;
  }>(`/api/personal-styles/${styleId}/default`);
  return response.data;
};

export const clearDefaultPersonalStyle = async (styleId: number) => {
  const response = await apiClient.delete<{
    id: number;
    unchanged: boolean;
  }>(`/api/personal-styles/${styleId}/default`);
  return response.data;
};

export const savePersonalStyleDetails = async (
  styleId: number,
  payload: { summary: string; dimensions: StyleDimensions; rules: StyleRules },
) => {
  const response = await apiClient.put<{ version_number: number }>(
    `/api/personal-styles/${styleId}/details`,
    payload,
  );
  return response.data;
};

export const listPersonalStyleVersions = async (styleId: number) => {
  const response = await apiClient.get<{
    current_version: number;
    items: PersonalStyleVersion[];
  }>(`/api/personal-styles/${styleId}/versions`);
  return response.data;
};

export const getPersonalStyleVersion = async (styleId: number, versionNumber: number) => {
  const response = await apiClient.get<PersonalStyleVersion>(
    `/api/personal-styles/${styleId}/versions/${versionNumber}`,
  );
  return response.data;
};

export const restorePersonalStyleVersion = async (styleId: number, versionNumber: number) => {
  const response = await apiClient.post<{
    version_number: number;
    restored_from_version: number;
    unchanged?: boolean;
  }>(`/api/personal-styles/${styleId}/versions/${versionNumber}/restore`);
  return response.data;
};

export const analyzePersonalStyle = async (styleId: number) => {
  const response = await apiClient.post<{
    version_number: number;
    summary: string;
    dimensions: StyleDimensions;
    rules: StyleRules;
    remaining: number;
  }>(`/api/personal-styles/${styleId}/analyze`, undefined, { timeout: 90000 });
  return response.data;
};

export const previewPersonalStyle = async (
  styleId: number,
  payload: {
    text: string;
    style: StylePreviewScene;
    rewrite_strength: StylePreviewStrength;
    details: { summary: string; dimensions: StyleDimensions; rules: StyleRules };
  },
) => {
  const response = await apiClient.post<{ result: string }>(
    `/api/personal-styles/${styleId}/preview`,
    payload,
    { timeout: 90000 },
  );
  return response.data;
};

export const listStyleMaterials = async (styleId: number): Promise<StyleMaterial[]> => {
  const response = await apiClient.get<{ items: StyleMaterial[] }>(
    `/api/personal-styles/${styleId}/materials`,
    { params: { page: 1, page_size: 100 } },
  );
  return response.data.items;
};

export const getStyleMaterial = async (styleId: number, materialId: number) => {
  const response = await apiClient.get<StyleMaterial>(
    `/api/personal-styles/${styleId}/materials/${materialId}`,
  );
  return response.data;
};

export const addTextStyleMaterial = async (
  styleId: number,
  payload: {
    content: string;
    file_name: string;
    material_type: MaterialType;
    is_representative: boolean;
  },
) => {
  await apiClient.post(`/api/personal-styles/${styleId}/materials/text`, payload);
};

export const addFileStyleMaterial = async (
  styleId: number,
  file: File,
  materialType: MaterialType,
  isRepresentative: boolean,
) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('material_type', materialType);
  formData.append('is_representative', String(isRepresentative));
  await apiClient.post(`/api/personal-styles/${styleId}/materials/file`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
};

export const updateStyleMaterial = async (
  styleId: number,
  materialId: number,
  payload: { file_name?: string; material_type?: MaterialType; is_representative?: boolean },
) => {
  await apiClient.patch(`/api/personal-styles/${styleId}/materials/${materialId}`, payload);
};

export const deleteStyleMaterial = async (styleId: number, materialId: number) => {
  await apiClient.delete(`/api/personal-styles/${styleId}/materials/${materialId}`);
};
