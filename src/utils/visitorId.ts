/**
 * 生成或获取访客ID
 * 存储在 localStorage 中，清除浏览器缓存会重新生成
 */
export function getVisitorId(): string {
  const key = 'tone_cube_visitor_id';
  let visitorId = localStorage.getItem(key);
  if (!visitorId) {
    visitorId = generateVisitorId();
    localStorage.setItem(key, visitorId);
  }
  return visitorId;
}

function generateVisitorId(): string {
  return `visitor_${crypto.randomUUID()}`;
}

export function getAnalyticsSessionId(): string {
  const key = 'tone_cube_analytics_session_id';
  const activityKey = 'tone_cube_analytics_last_activity';
  const now = Date.now();
  const lastActivity = Number(sessionStorage.getItem(activityKey) || 0);
  let sessionId = sessionStorage.getItem(key);
  if (!sessionId || now - lastActivity > 30 * 60 * 1000) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(key, sessionId);
  }
  sessionStorage.setItem(activityKey, String(now));
  return sessionId;
}
