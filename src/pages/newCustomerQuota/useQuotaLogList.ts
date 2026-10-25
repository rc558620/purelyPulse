// 门店额度变动记录分页 hook：page / pageSize 真分页 + 首屏 / 下拉刷新 / 加载更多 / 竞态取消
//
// 只负责「按当前门店与 Tab 取数」，Tab 与视图状态归页面 hook。
// query 为 null（门店一览视图）时不发请求并回到空态，等进入单门店变动记录再取数。
import { useCallback, useEffect, useRef, useState } from 'react';
import { safeNum } from '@utils/utils';
import { NEW_CUSTOMER_QUOTA_EMPTY_LOG_STATS } from './newCustomerQuota.constants';
import { fetchNewCustomerQuotaLogs } from './newCustomerQuota.service';
import type {
  NewCustomerQuotaLog,
  NewCustomerQuotaLogPageResult,
  NewCustomerQuotaLogQuery,
  NewCustomerQuotaLogStats,
} from './newCustomerQuota.types';

interface UseQuotaLogListReturn {
  /** 当前已加载的变动记录（分页累积） */
  logs: NewCustomerQuotaLog[];
  /** 后端统计概览（门店全量口径，不随 Tab 变化） */
  stats: NewCustomerQuotaLogStats;
  /** 当前 Tab 下的记录总数（后端口径，与已加载页数无关） */
  total: number;
  /** 是否还有下一页 */
  hasMore: boolean;
  /** 首屏加载中 */
  isInitialLoading: boolean;
  /** 下拉刷新中 */
  isRefreshing: boolean;
  /** 加载更多中 */
  isLoadingMore: boolean;
  /** 请求错误文案 */
  errorMessage: string;
  /** 重拉第一页：下拉刷新与额度调整成功后都走这里（失败时抛错，供刷新条切失败态） */
  refreshLogs: () => Promise<void>;
  /** 上拉加载更多：追加下一页（失败时抛错，由容器呈现失败态） */
  loadMoreLogs: () => Promise<void>;
  /** 重试当前查询 */
  retryLoad: () => void;
}

/** 主动取消不算失败：换条件 / 卸载不能弹成错误态 */
const isAbortError = (error: unknown): boolean =>
  error instanceof Error && (error.name === 'AbortError' || error.name === 'CanceledError');

/** 作废在途请求并新建控制器：与 requestId 是两层保险 */
const createRequestController = (controllerRef: React.MutableRefObject<AbortController | null>): AbortController => {
  controllerRef.current?.abort();
  const nextController = new AbortController();
  controllerRef.current = nextController;
  return nextController;
};

export const useQuotaLogList = (query: NewCustomerQuotaLogQuery | null): UseQuotaLogListReturn => {
  const [logs, setLogs] = useState<NewCustomerQuotaLog[]>([]);
  const [stats, setStats] = useState<NewCustomerQuotaLogStats>(NEW_CUSTOMER_QUOTA_EMPTY_LOG_STATS);
  const [total, setTotal] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 每次「换条件 / 重拉第一页」自增：回来时 id 不一致说明条件已变，丢弃过期响应
  const requestIdRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  // 卸载标记：StrictMode 会「挂载 → 卸载 → 再挂载」，setup 里必须置回 true
  const mountedRef = useRef<boolean>(true);
  // 最近一次成功请求的页码：加载更多在其基础上 +1
  const pageRef = useRef<number>(1);
  const hasMoreRef = useRef<boolean>(false);
  // 已成功加载过一次：换 Tab 时只标记「刷新中」，不再回到首屏加载态
  const hasLoadedRef = useRef<boolean>(false);
  const isLoadingMoreRef = useRef<boolean>(false);
  const queryRef = useRef<NewCustomerQuotaLogQuery | null>(query);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  useEffect(() => {
    mountedRef.current = true;
    // 只复制 ref 容器本身（引用恒定），cleanup 读到的才是卸载那一刻的在途控制器
    const controllerRef = abortControllerRef;

    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, []);

  /** 拉第一页：换 Tab / 重试 / 下拉刷新 / 额度调整成功后都走这里 */
  const loadFirstPage = useCallback(
    async (targetQuery: NewCustomerQuotaLogQuery, isRefresh: boolean): Promise<void> => {
      requestIdRef.current += 1;
      const currentRequestId = requestIdRef.current;
      const { signal } = createRequestController(abortControllerRef);

      if (isRefresh || hasLoadedRef.current) {
        setIsRefreshing(true);
        // 换 Tab / 重试时先清掉旧错误：否则新请求在途期间列表仍被旧错误态遮住
        setErrorMessage('');
      } else {
        setIsInitialLoading(true);
      }

      try {
        const page: NewCustomerQuotaLogPageResult = await fetchNewCustomerQuotaLogs({
          query: targetQuery,
          page: 1,
          signal,
        });
        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        setLogs(page.logs);
        setStats(page.stats);
        setTotal(page.total);
        pageRef.current = safeNum(page.page, 1) || 1;
        hasMoreRef.current = page.hasMore;
        setHasMore(page.hasMore);
        setErrorMessage('');
        hasLoadedRef.current = true;
      } catch (error) {
        if (isAbortError(error) || currentRequestId !== requestIdRef.current) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : '获取额度变动记录失败');
        // 已成功加载过就保留旧记录：清空会把「切 Tab 失败」放大成「记录没了」
        if (!hasLoadedRef.current) {
          setLogs([]);
          setStats(NEW_CUSTOMER_QUOTA_EMPTY_LOG_STATS);
          setTotal(0);
          pageRef.current = 1;
          hasMoreRef.current = false;
          setHasMore(false);
        }

        // 继续抛给调用方：下拉刷新据此把刷新条切成「失败 + 重试」
        throw error instanceof Error ? error : new Error('获取额度变动记录失败');
      } finally {
        if (mountedRef.current && currentRequestId === requestIdRef.current) {
          setIsInitialLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    // 延后一拍发起：既避免在 effect 体内同步 setState，也让连续切 Tab 只打最后一次请求
    const timeoutId = window.setTimeout(() => {
      if (!query) {
        requestIdRef.current += 1;
        hasLoadedRef.current = false;
        pageRef.current = 1;
        hasMoreRef.current = false;
        setLogs([]);
        setStats(NEW_CUSTOMER_QUOTA_EMPTY_LOG_STATS);
        setTotal(0);
        setHasMore(false);
        setErrorMessage('');
        setIsInitialLoading(true);
        return;
      }

      void loadFirstPage(query, false).catch(() => undefined);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadFirstPage, query]);

  const loadMoreLogs = useCallback(async (): Promise<void> => {
    if (isLoadingMoreRef.current || !hasMoreRef.current) {
      return;
    }

    const currentQuery = queryRef.current;
    if (!currentQuery) {
      return;
    }

    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    const currentRequestId = requestIdRef.current;
    const nextPage = pageRef.current + 1;
    const { signal } = createRequestController(abortControllerRef);

    try {
      const page = await fetchNewCustomerQuotaLogs({
        query: currentQuery,
        page: nextPage,
        signal,
      });
      // 加载期间用户切了 Tab：这一页已不属于当前列表，直接丢弃
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setLogs((previousLogs) => [...previousLogs, ...page.logs]);
      setStats(page.stats);
      setTotal(page.total);
      pageRef.current = nextPage;
      hasMoreRef.current = page.hasMore;
      setHasMore(page.hasMore);
    } catch (error) {
      // 被切 Tab / 卸载取消：静默结束，不占用「加载失败」态
      if (isAbortError(error)) {
        return;
      }

      // 抛给 PullRefreshLoadMore，由底部失败态提供重试入口
      throw error instanceof Error ? error : new Error('加载更多额度变动记录失败');
    } finally {
      isLoadingMoreRef.current = false;
      if (mountedRef.current) {
        setIsLoadingMore(false);
      }
    }
  }, []);

  const refreshLogs = useCallback(async (): Promise<void> => {
    const currentQuery = queryRef.current;
    if (!currentQuery) {
      return;
    }

    await loadFirstPage(currentQuery, true);
  }, [loadFirstPage]);

  const retryLoad = useCallback((): void => {
    const currentQuery = queryRef.current;
    if (!currentQuery) {
      return;
    }

    void loadFirstPage(currentQuery, false).catch(() => undefined);
  }, [loadFirstPage]);

  return {
    logs,
    stats,
    total,
    hasMore,
    isInitialLoading,
    isRefreshing,
    isLoadingMore,
    errorMessage,
    refreshLogs,
    loadMoreLogs,
    retryLoad,
  };
};
