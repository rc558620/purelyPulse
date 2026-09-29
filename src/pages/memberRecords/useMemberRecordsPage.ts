// 会员记录管理页 Hook：筛选表单态、查询态、游标分页、下拉刷新与竞态保护。
import { useCallback, useEffect, useRef, useState } from 'react';
import { MEMBER_RECORD_PAGE_SIZE } from './memberRecords.constants';
import { fetchMemberRecords } from './memberRecords.service';
import {
  buildMemberRecordsQuery,
  createDefaultMemberRecordsFilters,
  isDateRangeReversed,
} from './memberRecords.utils';
import type {
  MemberRecordDateValue,
  MemberRecordItem,
  MemberRecordsFilterState,
  MemberRecordsQuery,
} from './memberRecords.types';

interface UseMemberRecordsPageReturn {
  /** 筛选表单态（受控）。 */
  filters: MemberRecordsFilterState;
  /** 查询态：列表卡摘要用它，保证「摘要描述的一定是当前这批数据」。 */
  appliedQuery: MemberRecordsQuery;
  /** 当前已加载的记录。 */
  records: MemberRecordItem[];
  /** 首屏加载中。 */
  isInitialLoading: boolean;
  /** 下拉刷新中。 */
  isRefreshing: boolean;
  /** 加载更多中。 */
  isLoadingMore: boolean;
  /** 是否还有下一页。 */
  hasMore: boolean;
  /** 首屏错误文案（空字符串表示无错误）。 */
  errorMessage: string;
  /** 日期范围是否填反了（填反时禁止提交查询）。 */
  isRangeReversed: boolean;
  /** 局部更新筛选表单态。 */
  updateFilters: (patch: Partial<MemberRecordsFilterState>) => void;
  /**
   * 更新单独日期。
   *
   * 三个日期框互斥：选了单独日期就把起止日期清掉，
   * 让「当前生效的是哪一组日期」永远只有一个答案。
   */
  setSingleDate: (value: MemberRecordDateValue) => void;
  /** 更新日期范围起点（同时清空单独日期）。 */
  setRangeStart: (value: MemberRecordDateValue) => void;
  /** 更新日期范围终点（同时清空单独日期）。 */
  setRangeEnd: (value: MemberRecordDateValue) => void;
  /** 提交查询（把表单态转成查询态）。 */
  submitSearch: () => void;
  /** 重置为默认条件（单独日期回到今天）并立即查询。 */
  resetFilters: () => void;
  /** 下拉刷新：重拉第一页。 */
  refreshRecords: () => Promise<void>;
  /** 上拉加载更多：追加下一页。 */
  loadMoreRecords: () => Promise<void>;
  /** 重试当前查询。 */
  retryLoadRecords: () => void;
}

export const useMemberRecordsPage = (): UseMemberRecordsPageReturn => {
  const [filters, setFilters] = useState<MemberRecordsFilterState>(createDefaultMemberRecordsFilters);
  const [appliedQuery, setAppliedQuery] = useState<MemberRecordsQuery>(() => (
    buildMemberRecordsQuery(createDefaultMemberRecordsFilters())
  ));
  const [records, setRecords] = useState<MemberRecordItem[]>([]);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 每次「换条件」自增：请求回来时 id 不一致说明条件已变，丢弃过期响应
  const requestIdRef = useRef<number>(0);
  const cursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef<boolean>(false);
  const appliedQueryRef = useRef<MemberRecordsQuery>(appliedQuery);
  const isLoadingMoreRef = useRef<boolean>(false);

  useEffect(() => {
    appliedQueryRef.current = appliedQuery;
  }, [appliedQuery]);

  /** 拉第一页：换条件 / 重试 / 下拉刷新都走这里。 */
  const loadFirstPage = useCallback(async (query: MemberRecordsQuery, isRefresh: boolean): Promise<void> => {
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsInitialLoading(true);
    }

    try {
      const page = await fetchMemberRecords({ query, cursor: null, limit: MEMBER_RECORD_PAGE_SIZE });
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setRecords(page.items);
      cursorRef.current = page.nextCursor;
      hasMoreRef.current = page.hasMore;
      setHasMore(page.hasMore);
      setErrorMessage('');
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : '获取会员记录失败');
      // 刷新失败时保留已展示的记录：清空列表会把「刷新失败」放大成「记录没了」
      if (!isRefresh) {
        setRecords([]);
        cursorRef.current = null;
        hasMoreRef.current = false;
        setHasMore(false);
      }

      // 继续抛给调用方：下拉刷新要据此把刷新条切成「失败 + 重试」
      throw error;
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    // 延后一拍发起：既避免在 effect 体内同步 setState（会触发级联渲染），
    // 也让连续改条件只打最后一次请求
    const timeoutId = window.setTimeout(() => {
      void loadFirstPage(appliedQuery, false).catch(() => undefined);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [appliedQuery, loadFirstPage]);

  const updateFilters = useCallback((patch: Partial<MemberRecordsFilterState>): void => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const setSingleDate = useCallback((value: MemberRecordDateValue): void => {
    setFilters((prev) => ({ ...prev, singleDate: value, rangeStart: null, rangeEnd: null }));
  }, []);

  const setRangeStart = useCallback((value: MemberRecordDateValue): void => {
    setFilters((prev) => ({ ...prev, rangeStart: value, singleDate: null }));
  }, []);

  const setRangeEnd = useCallback((value: MemberRecordDateValue): void => {
    setFilters((prev) => ({ ...prev, rangeEnd: value, singleDate: null }));
  }, []);

  const isRangeReversed = isDateRangeReversed(filters.rangeStart, filters.rangeEnd);

  const submitSearch = useCallback((): void => {
    // 范围填反了直接拦下：后端拿到反向区间只会返回空列表，运营会误读成「真没记录」
    if (isRangeReversed) {
      return;
    }

    setAppliedQuery(buildMemberRecordsQuery(filters));
  }, [filters, isRangeReversed]);

  const resetFilters = useCallback((): void => {
    const defaultFilters = createDefaultMemberRecordsFilters();
    setFilters(defaultFilters);
    setAppliedQuery(buildMemberRecordsQuery(defaultFilters));
  }, []);

  const refreshRecords = useCallback(async (): Promise<void> => {
    await loadFirstPage(appliedQueryRef.current, true);
  }, [loadFirstPage]);

  const loadMoreRecords = useCallback(async (): Promise<void> => {
    if (isLoadingMoreRef.current || !hasMoreRef.current || !cursorRef.current) {
      return;
    }

    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    const currentRequestId = requestIdRef.current;

    try {
      const page = await fetchMemberRecords({
        query: appliedQueryRef.current,
        cursor: cursorRef.current,
        limit: MEMBER_RECORD_PAGE_SIZE,
      });
      // 加载期间用户改了条件：这一页已经不属于当前列表，直接丢弃
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setRecords((prev) => [...prev, ...page.items]);
      cursorRef.current = page.nextCursor;
      hasMoreRef.current = page.hasMore;
      setHasMore(page.hasMore);
    } catch (error) {
      // 抛给 PullRefreshLoadMore，由底部「加载失败」态提供重试入口；
      // 这里不清列表也不写首屏错误，避免整页被一个「下一页失败」打断
      throw error instanceof Error ? error : new Error('加载更多失败');
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, []);

  const retryLoadRecords = useCallback((): void => {
    void loadFirstPage(appliedQueryRef.current, false).catch(() => undefined);
  }, [loadFirstPage]);

  return {
    filters,
    appliedQuery,
    records,
    isInitialLoading,
    isRefreshing,
    isLoadingMore,
    hasMore,
    errorMessage,
    isRangeReversed,
    updateFilters,
    setSingleDate,
    setRangeStart,
    setRangeEnd,
    submitSearch,
    resetFilters,
    refreshRecords,
    loadMoreRecords,
    retryLoadRecords,
  };
};
