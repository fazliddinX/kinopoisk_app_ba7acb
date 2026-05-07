import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { hit } from '@/utils/metrica';

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    hit(location.pathname + location.search + location.hash, {
      title: document.title,
    });
  }, [location.pathname, location.search, location.hash]);
}
