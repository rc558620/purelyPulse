import { useCallback, useEffect, useRef, useState } from 'react';
import { MEMBERSHIP_REVENUE_SYNC_EVENT } from '../memberList/memberList.constants';
import type { MembershipRevenueSyncPayload } from '../memberList/memberList.service';
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

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    const handleMembershipRevenueSync = (event: Event): void => {
      const customEvent = event as CustomEvent<MembershipRevenueSyncPayload>;
      const payload = customEvent.detail;
      if (!payload) {
        return;
      }

      void loadOverview();
    };

    window.addEventListener(MEMBERSHIP_REVENUE_SYNC_EVENT, handleMembershipRevenueSync);
    return () => {
      window.removeEventListener(MEMBERSHIP_REVENUE_SYNC_EVENT, handleMembershipRevenueSync);
    };
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
