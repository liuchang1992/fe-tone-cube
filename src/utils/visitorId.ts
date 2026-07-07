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
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `visitor_${timestamp}_${random}`;
}