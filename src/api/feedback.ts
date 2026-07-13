import apiClient from './client';


export type FeedbackCategory = 'suggestion' | 'bad_result' | 'problem' | 'other';

export interface FeedbackPayload {
  category: FeedbackCategory;
  content: string;
  contact?: string;
  page_path: string;
  task_id?: string;
}

export interface FeedbackResponse {
  success: boolean;
  feedback_id: string;
  status: 'pending';
}

export const submitFeedback = async (payload: FeedbackPayload): Promise<FeedbackResponse> => {
  const response = await apiClient.post<FeedbackResponse>('/api/feedback', payload);
  return response.data;
};
