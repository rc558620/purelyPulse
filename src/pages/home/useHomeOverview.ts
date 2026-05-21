import { useCallback, useEffect, useRef, useState } from 'react';
import { createEmptyHomeOverview, fetchHomeOverview } from './home.service';
import type { HomeOverviewData } from './home.types';

interface UseHomeOverviewReturn {
  overview: HomeOverviewData;
  isLoading: boolean;
  hasLoaded: boolean;
  errorMessage: string;
  retryLoad: () => void;
}

export const useHomeOverview = (): UseHomeOverviewReturn => {
  const [overview, setOverview] = useState<HomeOverviewData>(createEmptyHomeOverview());
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const requestIdRef = useRef(0);

  const loadOverview = useCallback(async (): Promise<void> => {
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;
    setIsLoading(true);

    try {
      const response = await fetchHomeOverview();
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
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const retryLoad = useCallback((): void => {
    void loadOverview();
  }, [loadOverview]);

  return {
    overview,
    isLoading,
    hasLoaded,
    errorMessage,
    retryLoad,
  };
};
