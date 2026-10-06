// 门店选择弹层数据 hook：服务端关键词搜索 + 分页加载，供设置额度前的选店使用。
// 搜索与主列表互不干扰：弹层打开时才发请求，关键词变化防抖后重置回第 1 页。
import { useCallback, useEffect, useRef, useState } from 'react';
import { safeNum } from '@utils/utils';
import { fetchNewCustomerQuotaStores } from './newCustomerQuota.service';
import type {
  NewCustomerQuotaListQuery,
  NewCustomerQuotaStore,
} from './newCustomerQuota.types';

interface UseQuotaStorePickerReturn {
  /** 当前已加载的门店列表（分页累积） */
  stores: NewCustomerQuotaStore[];
  /** 是否还有下一页 */
  hasMore: boolean;
  /** 首屏 / 搜索请求进行中 */
  isLoading: boolean;
  /** 加载更多请求进行中（与主请求分开，避免按钮在追加期间无反馈） */
  isLoadingMore: boolean;
  /** 当前错误文案 */
  errorMessage: string;
  /** 加载下一页并追加（失败时抛错，由弹层按钮重试） */
  loadMoreStores: () => Promise<void>;
  /** 重试当前查询 */
  retryLoad: () => void;
}

/** 门店选择弹层数据 Hook；`enabled` 为 false 时不发任何请求 */
export const useQuotaStorePicker = (
  keyword: string,
  enabled: boolean,
): UseQuotaStorePickerReturn => {
  const [stores, setStores] = useState<NewCustomerQuotaStore[]>([]);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const requestIdRef = useRef<number>(0);
  const pageRef = useRef<number>(1);
  const queryRef = useRef<NewCustomerQuotaListQuery>({ keyword: '', health: null });

  /** 请求指定页：replace 整表替换，append 追加失败落错误态（按钮重试） */
  const requestPage = useCallback(async (
    page: number,
    mode: 'replace' | 'append',
  ): Promise<void> => {
    const normalizedPage = safeNum(page) || 1;
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    if (mode === 'replace') {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const response = await fetchNewCustomerQuotaStores(queryRef.current, normalizedPage);
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setStores((previousStores) => (
        mode === 'append' ? [...previousStores, ...response.stores] : response.stores
      ));
      setHasMore(response.hasMore);
      pageRef.current = normalizedPage;
      setErrorMessage('');
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      if (mode === 'append') {
        throw error instanceof Error ? error : new Error('加载更多门店失败');
      }

      setErrorMessage(error instanceof Error ? error.message : '搜索门店失败');
      setStores([]);
      setHasMore(false);
    } finally {
      // 只有最新请求允许收尾：并发时旧请求不得清掉新请求的 loading 态
      if (currentRequestId === requestIdRef.current) {
        if (mode === 'replace') {
          setIsLoading(false);
        } else {
          setIsLoadingMore(false);
        }
      }
    }
  }, []);

  // 弹层打开 / 关键词变化 → 重置回第 1 页整表替换（搜索词带防抖）
  useEffect(() => {
    if (!enabled) {
      return;
    }

    queryRef.current = { keyword, health: null };
    const timeoutId = window.setTimeout(() => {
      void requestPage(1, 'replace');
    }, keyword ? 250 : 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [enabled, keyword, requestPage]);

  const loadMoreStores = useCallback(async (): Promise<void> => {
    // 搜索请求或上一次追加在途时不重复触发：并发追加会共用同一页码并互相作废
    if (isLoading || isLoadingMore) {
      return;
    }

    try {
      await requestPage(pageRef.current + 1, 'append');
    } catch (error) {
      // 弹层内的加载更多由按钮触发，失败直接落错误态供重试，不向组件抛错
      setErrorMessage(error instanceof Error ? error.message : '加载更多门店失败');
    }
  }, [isLoading, isLoadingMore, requestPage]);

  const retryLoad = useCallback((): void => {
    void requestPage(1, 'replace');
  }, [requestPage]);

  return {
    stores,
    hasMore,
    isLoading,
    isLoadingMore,
    errorMessage,
    loadMoreStores,
    retryLoad,
  };
};
