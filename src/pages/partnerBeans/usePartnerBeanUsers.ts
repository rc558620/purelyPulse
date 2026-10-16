// 合伙人余额一览页码分页 hook：首屏 / 下拉刷新 / 加载更多、竞态与请求取消。
//
// 与 usePartnerBeanRecords 同构，但分页口径不同：余额一览走会员列表接口的
// page/pageSize 页码分页（后端权威 total），流水走 cursor 游标分页。
// 筛选条件（关键词）的产生归页面 hook，这里只负责「按当前关键词取数」。
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchPartnerBeanUserPage } from '../memberList/memberList.service';
import type {
  PartnerBeansPageUser,
  PartnerBeansUserPage,
} from './partnerBeans.types';

interface UsePartnerBeanUsersReturn {
  /** 当前已加载的合伙人（分页累积） */
  users: PartnerBeansPageUser[];
  /** 当前关键词下的合伙人总数（后端口径） */
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
  /**
   * 重拉第一页：下拉刷新直接等它完成，写操作成功后同样走它。
   *
   * 失败时抛错：下拉刷新据此切「失败 + 重试」，写成功后由页面转成一句提示。
   */
  refreshUsers: () => Promise<void>;
  /** 上拉加载更多：追加下一页（失败时抛错，由容器呈现失败态） */
  loadMoreUsers: () => Promise<void>;
  /** 重试当前关键词 */
  retryLoad: () => void;
}

/** 主动取消不算失败：不能把「换关键词 / 卸载」弹成错误态。 */
const isAbortError = (error: unknown): boolean => (
  error instanceof Error && (error.name === 'AbortError' || error.name === 'CanceledError')
);

/** 作废在途请求并新建一个控制器：与 requestId 是两层保险。 */
const createRequestController = (
  controllerRef: React.MutableRefObject<AbortController | null>,
): AbortController => {
  controllerRef.current?.abort();
  const nextController = new AbortController();
  controllerRef.current = nextController;
  return nextController;
};

export const usePartnerBeanUsers = (keyword: string): UsePartnerBeanUsersReturn => {
  const [users, setUsers] = useState<PartnerBeansPageUser[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const requestIdRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  // 卸载标记：StrictMode 会「挂载 → 卸载 → 再挂载」，setup 里必须置回 true
  const mountedRef = useRef<boolean>(true);
  const pageRef = useRef<number>(1);
  const hasMoreRef = useRef<boolean>(false);
  // 已成功加载过一次：换关键词时只标记「刷新中」，不再回到首屏加载态
  const hasLoadedRef = useRef<boolean>(false);
  const isLoadingMoreRef = useRef<boolean>(false);
  const keywordRef = useRef<string>(keyword);

  useEffect(() => {
    keywordRef.current = keyword;
  }, [keyword]);

  useEffect(() => {
    mountedRef.current = true;
    // 只复制 ref 容器本身（引用恒定），cleanup 里读到的才是卸载那一刻的在途控制器
    const controllerRef = abortControllerRef;

    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, []);

  /** 拉第一页：换关键词 / 重试 / 下拉刷新 / 写操作成功后都走这里。 */
  const loadFirstPage = useCallback(async (targetKeyword: string, isRefresh: boolean): Promise<void> => {
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;
    const { signal } = createRequestController(abortControllerRef);

    if (isRefresh || hasLoadedRef.current) {
      setIsRefreshing(true);
      setErrorMessage('');
    } else {
      setIsInitialLoading(true);
    }

    try {
      const page: PartnerBeansUserPage = await fetchPartnerBeanUserPage({
        keyword: targetKeyword,
        page: 1,
        signal,
      });
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setUsers(page.users);
      setTotal(page.total);
      pageRef.current = 1;
      hasMoreRef.current = page.hasMore;
      setHasMore(page.hasMore);
      setErrorMessage('');
      hasLoadedRef.current = true;
    } catch (error) {
      if (isAbortError(error) || currentRequestId !== requestIdRef.current) {
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : '获取合伙人余额列表失败');
      // 已成功加载过就保留旧列表：清空会把「换关键词失败」放大成「合伙人没了」
      if (!hasLoadedRef.current) {
        setUsers([]);
        setTotal(0);
        pageRef.current = 1;
        hasMoreRef.current = false;
        setHasMore(false);
      }

      throw error instanceof Error ? error : new Error('获取合伙人余额列表失败');
    } finally {
      if (mountedRef.current && currentRequestId === requestIdRef.current) {
        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    // 延后一拍发起：避免在 effect 体内同步 setState，也让连续改关键词只打最后一次请求
    const timeoutId = window.setTimeout(() => {
      void loadFirstPage(keyword, false).catch(() => undefined);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [keyword, loadFirstPage]);

  const loadMoreUsers = useCallback(async (): Promise<void> => {
    if (isLoadingMoreRef.current || !hasMoreRef.current) {
      return;
    }

    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    const currentRequestId = requestIdRef.current;
    const nextPage = pageRef.current + 1;
    const { signal } = createRequestController(abortControllerRef);

    try {
      const page = await fetchPartnerBeanUserPage({
        keyword: keywordRef.current,
        page: nextPage,
        signal,
      });
      // 加载期间用户改了关键词：这一页已经不属于当前列表，直接丢弃
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setUsers((prevUsers) => [...prevUsers, ...page.users]);
      setTotal(page.total);
      pageRef.current = nextPage;
      hasMoreRef.current = page.hasMore;
      setHasMore(page.hasMore);
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }

      // 抛给 PullRefreshLoadMore，由底部「加载失败」态提供重试入口；
      // 这里不清列表也不写首屏错误，避免整页被一个「下一页失败」打断
      throw error instanceof Error ? error : new Error('加载更多合伙人失败');
    } finally {
      isLoadingMoreRef.current = false;
      if (mountedRef.current) {
        setIsLoadingMore(false);
      }
    }
  }, []);

  const refreshUsers = useCallback(async (): Promise<void> => {
    await loadFirstPage(keywordRef.current, true);
  }, [loadFirstPage]);

  const retryLoad = useCallback((): void => {
    void loadFirstPage(keywordRef.current, false).catch(() => undefined);
  }, [loadFirstPage]);

  return {
    users,
    total,
    hasMore,
    isInitialLoading,
    isRefreshing,
    isLoadingMore,
    errorMessage,
    refreshUsers,
    loadMoreUsers,
    retryLoad,
  };
};
