// 积分流水游标分页 hook：首屏 / 下拉刷新 / 加载更多、竞态与请求取消。
//
// 只负责「按当前筛选条件取数」，筛选条件的产生与调整提交流程归页面 hook。
// 与 partnerBeans 的 usePartnerBeanRecords 同构：查询为 null（积分一览视图）时不发请求、
// 保持空态，等页面进入单会员视图再取数；会员快照由页面传入（积分一览分页加载的那份），
// 流水行的头像与可用积分统一用它回填。
import { useCallback, useEffect, useRef, useState } from 'react';
import { safeNum } from '@utils/utils';
import { fetchMemberPointsRecords } from '../memberList/memberList.service';
import { MEMBER_POINTS_EMPTY_STATS } from './memberPoints.constants';
import type {
  MemberPointsPageUser,
  MemberPointsRecord,
  MemberPointsRecordPage,
  MemberPointsRecordQuery,
  MemberPointsStats,
} from './memberPoints.types';

interface UseMemberPointsRecordsReturn {
  /** 当前已加载的流水（分页累积） */
  records: MemberPointsRecord[];
  /** 后端统计（按当前筛选的完整结果集计算） */
  stats: MemberPointsStats;
  /** 是否还有下一页 */
  hasMore: boolean;
  /** 首屏加载中 */
  isInitialLoading: boolean;
  /** 下拉刷新中 */
  isRefreshing: boolean;
  /** 加载更多中 */
  isLoadingMore: boolean;
  /** 流水请求错误文案 */
  errorMessage: string;
  /**
   * 重拉第一页：下拉刷新直接等它完成，写操作成功后同样走它。
   *
   * 失败时抛错：下拉刷新据此切「失败 + 重试」，写成功后由页面转成一句提示。
   */
  refreshRecords: () => Promise<void>;
  /** 上拉加载更多：追加下一页（失败时抛错，由容器呈现失败态） */
  loadMoreRecords: () => Promise<void>;
  /** 重试当前筛选 */
  retryLoad: () => void;
}

/** 主动取消不算失败：不能把「换条件 / 卸载」弹成错误态，也不该抛给容器的失败重试。 */
const isAbortError = (error: unknown): boolean => (
  error instanceof Error && (error.name === 'AbortError' || error.name === 'CanceledError')
);

/**
 * 作废在途请求并新建一个控制器。
 *
 * 与 requestId 是两层保险：requestId 拦「旧响应回写」，abort 拦「旧请求继续跑」。
 */
const createRequestController = (
  controllerRef: React.MutableRefObject<AbortController | null>,
): AbortController => {
  controllerRef.current?.abort();
  const nextController = new AbortController();
  controllerRef.current = nextController;
  return nextController;
};

export const useMemberPointsRecords = (
  query: MemberPointsRecordQuery | null,
  users: MemberPointsPageUser[],
): UseMemberPointsRecordsReturn => {
  const [records, setRecords] = useState<MemberPointsRecord[]>([]);
  const [stats, setStats] = useState<MemberPointsStats>(MEMBER_POINTS_EMPTY_STATS);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 每次「换条件 / 重拉第一页」自增：请求回来时 id 不一致说明条件已变，丢弃过期响应
  const requestIdRef = useRef<number>(0);
  // 在途请求的取消信号：新请求发起前作废上一个，卸载时兜底取消
  const abortControllerRef = useRef<AbortController | null>(null);
  // 卸载标记：页面切走后不再回写状态，也不再展示 loading
  // setup 里必须置回 true：StrictMode 会「挂载 → 卸载 → 再挂载」，
  // 只在 cleanup 置 false 会让二次挂载后该标记永久为 false，首屏 loading 再也收不掉
  const mountedRef = useRef<boolean>(true);
  const cursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef<boolean>(false);
  // 是否已经成功加载过一次：切 Tab 时只标记「刷新中」，不再回到首屏加载态，
  // 避免整块列表被「加载中」顶替（与 partnerBeans 同口径）
  const hasLoadedRef = useRef<boolean>(false);
  const isLoadingMoreRef = useRef<boolean>(false);
  // 会员快照：流水行的头像与可用积分来自它，加载更多时直接复用
  const usersRef = useRef<MemberPointsPageUser[]>(users);
  const queryRef = useRef<MemberPointsRecordQuery | null>(query);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  useEffect(() => {
    mountedRef.current = true;
    // 只复制 ref 容器本身（引用恒定），cleanup 里读到的就是「卸载那一刻」的在途控制器。
    // 不能照提示复制 abortControllerRef.current：挂载时它还是 null，那样永远取消不到请求。
    const controllerRef = abortControllerRef;

    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, []);

  /** 拉第一页：换条件 / 重试 / 下拉刷新 / 写操作成功后都走这里。 */
  const loadFirstPage = useCallback(async (
    targetQuery: MemberPointsRecordQuery,
    isRefresh: boolean,
  ): Promise<void> => {
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;
    const { signal } = createRequestController(abortControllerRef);

    // 已加载过就只走「刷新中」：切 Tab 保留旧列表与旧统计，
    // 首屏（或首次失败后重试）才占用整块加载态
    if (isRefresh || hasLoadedRef.current) {
      setIsRefreshing(true);
      // 换条件 / 重试时先清掉上一次的错误：否则新请求在途期间列表仍被旧错误态遮住
      setErrorMessage('');
    } else {
      setIsInitialLoading(true);
    }

    try {
      const page: MemberPointsRecordPage = await fetchMemberPointsRecords({
        query: targetQuery,
        cursor: null,
        users: usersRef.current,
        signal,
      });
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setRecords(page.records);
      // 统计直接用于概览卡：后端脏值（null / NaN）在这里归一，不外泄到 UI
      setStats({
        totalRecords: safeNum(page.stats.totalRecords),
        adminAdjustCount: safeNum(page.stats.adminAdjustCount),
        todayChangeCount: safeNum(page.stats.todayChangeCount),
      });
      cursorRef.current = page.nextCursor;
      hasMoreRef.current = page.hasMore;
      setHasMore(page.hasMore);
      setErrorMessage('');
      hasLoadedRef.current = true;
    } catch (error) {
      if (isAbortError(error) || currentRequestId !== requestIdRef.current) {
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : '获取积分记录失败');
      // 已成功加载过就保留旧记录：清空列表会把「切换筛选失败」放大成「记录没了」
      if (!hasLoadedRef.current) {
        setRecords([]);
        setStats(MEMBER_POINTS_EMPTY_STATS);
        cursorRef.current = null;
        hasMoreRef.current = false;
        setHasMore(false);
      }

      // 继续抛给调用方：下拉刷新要据此把刷新条切成「失败 + 重试」
      throw error instanceof Error ? error : new Error('获取积分记录失败');
    } finally {
      if (mountedRef.current && currentRequestId === requestIdRef.current) {
        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    // 延后一拍发起：既避免在 effect 体内同步 setState（会触发级联渲染），
    // 也让连续改条件只打最后一次请求（与 partnerBeans 同一口径）
    const timeoutId = window.setTimeout(() => {
      // 积分一览视图（query 为 null）不发流水请求：回到空态，等进入单会员视图再取数
      if (!query) {
        requestIdRef.current += 1;
        hasLoadedRef.current = false;
        cursorRef.current = null;
        hasMoreRef.current = false;
        setRecords([]);
        setStats(MEMBER_POINTS_EMPTY_STATS);
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

  const loadMoreRecords = useCallback(async (): Promise<void> => {
    if (isLoadingMoreRef.current || !hasMoreRef.current || !cursorRef.current) {
      return;
    }

    const currentQuery = queryRef.current;
    if (!currentQuery) {
      return;
    }

    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    const currentRequestId = requestIdRef.current;
    const { signal } = createRequestController(abortControllerRef);

    try {
      const page = await fetchMemberPointsRecords({
        query: currentQuery,
        cursor: cursorRef.current,
        users: usersRef.current,
        signal,
      });
      // 加载期间用户改了条件：这一页已经不属于当前列表，直接丢弃
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setRecords((prevRecords) => [...prevRecords, ...page.records]);
      cursorRef.current = page.nextCursor;
      hasMoreRef.current = page.hasMore;
      setHasMore(page.hasMore);
    } catch (error) {
      // 被换条件 / 卸载取消：静默结束，不占用「加载失败」态
      if (isAbortError(error)) {
        return;
      }

      // 抛给 PullRefreshLoadMore，由底部「加载失败」态提供重试入口；
      // 这里不清列表也不写首屏错误，避免整页被一个「下一页失败」打断
      throw error instanceof Error ? error : new Error('加载更多记录失败');
    } finally {
      isLoadingMoreRef.current = false;
      if (mountedRef.current) {
        setIsLoadingMore(false);
      }
    }
  }, []);

  const refreshRecords = useCallback(async (): Promise<void> => {
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
    records,
    stats,
    hasMore,
    isInitialLoading,
    isRefreshing,
    isLoadingMore,
    errorMessage,
    refreshRecords,
    loadMoreRecords,
    retryLoad,
  };
};
