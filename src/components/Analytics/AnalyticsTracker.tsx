import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { trackPageView } from '@/api/analytics';

const trackedNavigationKeys = new Set<string>();

export const AnalyticsTracker = () => {
  const location = useLocation();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (lastTrackedPath.current === location.pathname || trackedNavigationKeys.has(location.key)) return;
    lastTrackedPath.current = location.pathname;
    trackedNavigationKeys.add(location.key);
    trackPageView(location.pathname);
  }, [location.key, location.pathname]);

  return null;
};
