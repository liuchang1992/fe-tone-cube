import apiClient from './client';


export type AnalyticsFeature =
  | 'text_convert'
  | 'document_convert'
  | 'document_result_open'
  | 'document_result_copy'
  | 'document_result_download'
  | 'history_copy'
  | 'history_download'
  | 'history_delete'
  | 'history_clear'
  | 'corpus_text_analyze'
  | 'corpus_file_analyze'
  | 'corpus_report_view'
  | 'corpus_delete'
  | 'login_success'
  | 'register_success'
  | 'personal_style_onboarding_view'
  | 'personal_style_onboarding_start'
  | 'personal_style_onboarding_skip'
  | 'logout'
  | 'pay_order_create'
  | 'feedback_open'
  | 'feedback_submit'
  | 'landing_start_convert'
  | 'landing_view_capabilities';

const analyticsEnabled = import.meta.env.VITE_ANALYTICS_ENABLED !== 'false';

const sendEvent = (eventType: 'page_view' | 'feature', eventName: string, pagePath: string) => {
  if (!analyticsEnabled) return;
  void apiClient.post('/api/analytics/events', {
    event_type: eventType,
    event_name: eventName,
    page_path: pagePath,
  }).catch(() => {
    // Analytics must never interrupt the user's primary action.
  });
};

export const trackPageView = (pagePath: string) => sendEvent('page_view', 'page_view', pagePath);

export const trackFeature = (feature: AnalyticsFeature) => {
  sendEvent('feature', feature, window.location.pathname);
};
