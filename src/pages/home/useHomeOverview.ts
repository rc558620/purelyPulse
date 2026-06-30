import { useCallback, useEffect, useRef, useState } from 'react';
import { createEmptyHomeOverview, fetchHomeOverview } from './home.service';
import type { HomeOverviewQuery } from './home.service';
import type { HomeOverviewData } from './home.types';

interface UseHomeOverviewReturn {
  overview: HomeOverviewData;
  isLoading: boolean;
  hasLoaded: boolean;
  errorMessage: string;
  retryLoad: () => void;
}

export const useHomeOverview = (query: HomeOverviewQuery): UseHomeOverviewReturn => {
  const [overview, setOverview] = useState<HomeOverviewData>(createEmptyHomeOverview());
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const requestIdRef = useRef(0);
  const loadOverviewRef = useRef<() => Promise<void>>();

  const loadOverview = useCallback(async (): Promise<void> => {
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;
    setIsLoading(true);

    try {
      const response = await fetchHomeOverview(query);
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setOverview(response);
      setHasLoaded(true);
      setErrorMessage('');
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : '获取首页总览失败');
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [query]);

  // 同步最新 loadOverview 到 ref，retryLoad 通过 ref 调用，避免依赖变化导致闭包过期。
  loadOverviewRef.current = loadOverview;

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const retryLoad = useCallback((): void => {
    void loadOverviewRef.current?.();
  }, []);

  return {
    overview,
    isLoading,
    hasLoaded,
    errorMessage,
    retryLoad,
  };
};
