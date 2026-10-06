// 新客额度门店列表分页数据 hook：管理首屏 / 下拉刷新 / 加载更多、竞态保护与错误状态。
// 搜索与筛选条件由页面层持有并传入，本 hook 只负责按 query 请求分页数据。
import { useCallback, useEffect, useRef, useState } from 'react';
import { safeNum } from '@utils/utils';
import { fetchNewCustomerQuotaStores } from './newCustomerQuota.service';
import type {
  NewCustomerQuotaListQuery,
  NewCustomerQuotaStats,
  NewCustomerQuotaStore,
} from './newCustomerQuota.types';

interface UseQuotaStoreListReturn {
  /** 当前已加载的门店列表（分页累积） */
  stores: NewCustomerQuotaStore[];
  /** 后端统计概览（只吃 keyword，不随健康度 Tab 变化） */
  stats: NewCustomerQuotaStats;
  /** 当前筛选条件命中的门店总数（含 health），供列表头「N 家」展示 */
  total: number;
  /** 是否还有下一页 */
  hasMore: boolean;
  /** 首屏加载中 */
  isLoading: boolean;
  /** 非首屏刷新中 */
  isRefreshing: boolean;
  /** 当前错误文案 */
  errorMessage: string;
  /** 用当前查询条件显式刷新第 1 页（供下拉刷新等待完成） */
  refreshStores: () => Promise<void>;
  /** 加载下一页并追加（供上拉加载更多等待完成，失败时抛错交由容器呈现失败态） */
  loadMoreStores: () => Promise<void>;
  /** 用后端快照回写单行（调整成功但刷新失败时的兜底） */
  patchStore: (storeId: string, remaining: number, consumed: number) => void;
  /** 重试当前查询 */
  retryLoad: () => void;
}

const EMPTY_STATS: NewCustomerQuotaStats = {
  storeCount: 0,
  totalRemaining: 0,
  warningCount: 0,
  exhaustedCount: 0,
};

/** 新客额度门店列表分页数据 Hook */
export const useQuotaStoreList = (query: NewCustomerQuotaListQuery): UseQuotaStoreListReturn => {
  const [stores, setStores] = useState<NewCustomerQuotaStore[]>([]);
  const [stats, setStats] = useState<NewCustomerQuotaStats>(EMPTY_STATS);
  const [total, setTotal] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const hasLoadedRef = useRef<boolean>(false);
  const requestIdRef = useRef<number>(0);
  // 最新一次成功请求的页码：加载更多时在其基础上 +1
  const pageRef = useRef<number>(1);
  const latestQueryRef = useRef<NewCustomerQuotaListQuery>(query);

  /**
   * 请求指定页数据。
   *
   * - replace：首屏 / 下拉刷新 / 筛选切换，结果整表替换；
   * - append：加载更多，结果追加，失败时抛错（由 PullRefreshLoadMore 呈现失败态与重试）。
   *
   * 每次请求都递增 requestId，只有最新请求允许回写状态，杜绝旧响应覆盖新状态。
   */
  const requestPage = useCallback(async (
    pageQuery: NewCustomerQuotaListQuery,
    page: number,
    mode: 'replace' | 'append',
  ): Promise<void> => {
    // 页码归一化：异常入参（NaN / 0 / 负数兜底为 0）回退第 1 页
    const normalizedPage = safeNum(page) || 1;
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    if (mode === 'replace') {
      if (hasLoadedRef.current) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
    }

    try {
      const response = await fetchNewCustomerQuotaStores(pageQuery, normalizedPage);
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setStores((previousStores) => (
        mode === 'append' ? [...previousStores, ...response.stores] : response.stores
      ));
      setStats(response.stats);
      setTotal(response.total);
      setHasMore(response.hasMore);
      pageRef.current = normalizedPage;
      setErrorMessage('');
      hasLoadedRef.current = true;
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      if (mode === 'append') {
        // 加载更多失败不整表报错：保持已加载内容，把错误抛给加载更多的失败态重试
        throw error instanceof Error ? error : new Error('加载更多门店失败');
      }

      setErrorMessage(error instanceof Error ? error.message : '获取门店新客额度失败');
      if (!hasLoadedRef.current) {
        setStores([]);
        setStats(EMPTY_STATS);
        setTotal(0);
        setHasMore(false);
      }
    } finally {
      if (mode === 'replace' && currentRequestId === requestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  // 查询条件变化 → 重置回第 1 页整表替换（搜索词带防抖）
  useEffect(() => {
    latestQueryRef.current = query;
    const timeoutId = window.setTimeout(() => {
      void requestPage(query, 1, 'replace');
    }, query.keyword ? 250 : 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [query, requestPage]);

  const refreshStores = useCallback(async (): Promise<void> => {
    await requestPage(latestQueryRef.current, 1, 'replace');
  }, [requestPage]);

  const loadMoreStores = useCallback(async (): Promise<void> => {
    // 首屏 / 刷新请求在途时不追加：两者都递增 requestId，会让并发请求互相作废
    if (isLoading || isRefreshing) {
      return;
    }

    await requestPage(latestQueryRef.current, pageRef.current + 1, 'append');
  }, [isLoading, isRefreshing, requestPage]);

  const patchStore = useCallback((storeId: string, remaining: number, consumed: number): void => {
    setStores((previousStores) => previousStores.map((store) => (
      store.id === storeId
        ? {
            ...store,
            remaining: safeNum(remaining),
            consumed: safeNum(consumed),
            updatedAt: Date.now(),
          }
        : store
    )));
  }, []);

  const retryLoad = useCallback((): void => {
    void requestPage(latestQueryRef.current, 1, 'replace');
  }, [requestPage]);

  return {
    stores,
    stats,
    total,
    hasMore,
    isLoading,
    isRefreshing,
    errorMessage,
    refreshStores,
    loadMoreStores,
    patchStore,
    retryLoad,
  };
};
