// 推广详情请求状态 hook：负责请求生命周期、竞态保护与重试。
import { useCallback, useRef, useState } from 'react';
import { createEmptyPromotionDetail, fetchPromotionDetail } from '../promotionDetail.service';
import type {
  PromotionDetailData,
  PromotionDetailQuery,
  PromotionDetailQueryMeta,
} from '../promotionDetail.types';

export interface UsePromotionDetailRequestReturn {
  data: PromotionDetailData;
  isLoading: boolean;
  errorMessage: string;
  hasSearched: boolean;
  submittedQuery: PromotionDetailQuery | null;
  submittedQueryMeta: PromotionDetailQueryMeta;
  runSearch: (query: PromotionDetailQuery, meta: PromotionDetailQueryMeta) => Promise<void>;
  retryLoad: () => void;
  resetRequestState: () => void;
}

const DEFAULT_QUERY_META: PromotionDetailQueryMeta = {
  regionLabels: [],
  regionDisplayText: '全部地区',
  dateDisplayText: '',
};

export const usePromotionDetailRequest = (): UsePromotionDetailRequestReturn => {
  const [data, setData] = useState<PromotionDetailData>(createEmptyPromotionDetail());
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [submittedQuery, setSubmittedQuery] = useState<PromotionDetailQuery | null>(null);
  const [submittedQueryMeta, setSubmittedQueryMeta] = useState<PromotionDetailQueryMeta>(DEFAULT_QUERY_META);
  const requestIdRef = useRef(0);

  const runSearch = useCallback(async (
    query: PromotionDetailQuery,
    meta: PromotionDetailQueryMeta,
  ): Promise<void> => {
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;
    setIsLoading(true);
    setErrorMessage('');
    setHasSearched(true);
    setSubmittedQuery(query);
    setSubmittedQueryMeta(meta);

    try {
      const response = await fetchPromotionDetail(query);
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setData(response);
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : '获取推广详情失败');
      setData(createEmptyPromotionDetail());
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const retryLoad = useCallback((): void => {
    if (!submittedQuery) {
      return;
    }

    void runSearch(submittedQuery, submittedQueryMeta);
  }, [runSearch, submittedQuery, submittedQueryMeta]);

  const resetRequestState = useCallback((): void => {
    setData(createEmptyPromotionDetail());
    setIsLoading(false);
    setErrorMessage('');
    setHasSearched(false);
    setSubmittedQuery(null);
    setSubmittedQueryMeta(DEFAULT_QUERY_META);
  }, []);

  return {
    data,
    isLoading,
    errorMessage,
    hasSearched,
    submittedQuery,
    submittedQueryMeta,
    runSearch,
    retryLoad,
    resetRequestState,
  };
};
