const BACKEND_DATETIME_WITHOUT_ZONE = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?$/;

export const parseBackendUtcDate = (value: string): Date => {
  const normalized = BACKEND_DATETIME_WITHOUT_ZONE.test(value)
    ? `${value.replace(' ', 'T')}Z`
    : value;
  return new Date(normalized);
};

export const formatBackendDateTime = (value: string): string => {
  const date = parseBackendUtcDate(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};
