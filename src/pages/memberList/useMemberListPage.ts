// 会员列表页 Hook：管理筛选、搜索、分页请求（首屏 / 下拉刷新 / 加载更多）、竞态保护与错误状态。
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { safeNum } from '@utils/utils';
import { MEMBER_STATUS_SYNC_EVENT } from './memberList.constants';
import { fetchMemberList } from './memberList.service';
import type { MemberFilterExpiry, MemberFilterLevel, MemberFilterStatus, MemberListItem, MemberListQuery, MemberListStats } from './memberList.types';

interface UseMemberListPageReturn {
  /** 当前已加载的会员列表（分页累积）。 */
  members: MemberListItem[];
  /** 概览统计（后端按当前筛选条件的完整列表计算）。 */
  stats: MemberListStats;
  /** 是否还有下一页。 */
  hasMore: boolean;
  /** 首屏加载中。 */
  isLoading: boolean;
  /** 非首屏刷新中。 */
  isRefreshing: boolean;
  /** 当前错误文案。 */
  errorMessage: string;
  /** 当前状态筛选值。 */
  statusFilter: MemberFilterStatus;
  /** 当前等级筛选值。 */
  levelFilter: MemberFilterLevel;
  /** 当前到期时间筛选值。 */
  expiryFilter: MemberFilterExpiry;
  /** 是否只看「有子账号能力但未补录子账号加价」的门店。 */
  pendingBackfillFilter: boolean;
  /** 是否只看「续费价被单独调整过」的门店。 */
  renewalPriceFilter: boolean;
  /** 当前搜索词。 */
  searchQuery: string;
  /** 更新状态筛选。 */
  setStatusFilter: (value: MemberFilterStatus) => void;
  /** 更新等级筛选。 */
  setLevelFilter: (value: MemberFilterLevel) => void;
  /** 更新到期时间筛选。 */
  setExpiryFilter: (value: MemberFilterExpiry) => void;
  /** 切换「待补录子账号加价」筛选。 */
  setPendingBackfillFilter: (value: boolean) => void;
  /** 切换「已调续费价」筛选。 */
  setRenewalPriceFilter: (value: boolean) => void;
  /** 更新搜索词。 */
  setSearchQuery: (value: string) => void;
  /** 清空搜索词。 */
  handleSearchClear: () => void;
  /** 用当前查询条件显式刷新列表第 1 页（供下拉刷新等待完成）。 */
  refreshMembers: () => Promise<void>;
  /** 加载下一页并追加到列表（供上拉加载更多等待完成，失败时抛错交由容器呈现失败态）。 */
  loadMoreMembers: () => Promise<void>;
  /** 重试当前查询。 */
  retryLoadMembers: () => void;
}

const EMPTY_MEMBER_LIST_STATS: MemberListStats = {
  totalCount: 0,
  activeCount: 0,
  inactiveCount: 0,
  partnerCount: 0,
  bannedCount: 0,
};

/** 会员列表页数据 Hook。 */
export const useMemberListPage = (): UseMemberListPageReturn => {
  const [members, setMembers] = useState<MemberListItem[]>([]);
  const [stats, setStats] = useState<MemberListStats>(EMPTY_MEMBER_LIST_STATS);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<MemberFilterStatus>('all');
  const [levelFilter, setLevelFilter] = useState<MemberFilterLevel>('all');
  const [expiryFilter, setExpiryFilter] = useState<MemberFilterExpiry>('all');
  const [pendingBackfillFilter, setPendingBackfillFilter] = useState<boolean>(false);
  const [renewalPriceFilter, setRenewalPriceFilter] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const hasLoadedRef = useRef<boolean>(false);
  const requestIdRef = useRef<number>(0);
  // 最新一次成功请求的页码：加载更多时在其基础上 +1
  const pageRef = useRef<number>(1);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const currentQuery = useMemo<MemberListQuery>(() => ({
    keyword: deferredSearchQuery.trim(),
    status: statusFilter,
    level: levelFilter,
    expiry: expiryFilter,
    pendingSubAccountBackfill: pendingBackfillFilter,
    renewalPriceAdjusted: renewalPriceFilter,
  }), [
    deferredSearchQuery,
    expiryFilter,
    levelFilter,
    pendingBackfillFilter,
    renewalPriceFilter,
    statusFilter,
  ]);
  const latestQueryRef = useRef<MemberListQuery>(currentQuery);

  /**
   * 请求指定页数据。
   *
   * - replace：首屏 / 下拉刷新 / 筛选切换，结果整表替换；
   * - append：加载更多，结果追加，失败时抛错（由 PullRefreshLoadMore 呈现失败态与重试）。
   *
   * 每次请求都递增 requestId，只有最新请求允许回写状态，杜绝旧响应覆盖新状态。
   */
  const requestPage = useCallback(async (
    query: MemberListQuery,
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
      const response = await fetchMemberList(query, normalizedPage);
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setMembers((previousMembers) => (
        mode === 'append' ? [...previousMembers, ...response.members] : response.members
      ));
      setStats(response.stats);
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
        throw error instanceof Error ? error : new Error('加载更多会员失败');
      }

      setErrorMessage(error instanceof Error ? error.message : '获取会员列表失败');
      if (!hasLoadedRef.current) {
        setMembers([]);
        setStats(EMPTY_MEMBER_LIST_STATS);
        setHasMore(false);
      }
    } finally {
      if (mode === 'replace' && currentRequestId === requestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    latestQueryRef.current = currentQuery;
  }, [currentQuery]);

  // 查询条件变化 → 重置回第 1 页整表替换（搜索词带防抖）
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void requestPage(currentQuery, 1, 'replace');
    }, currentQuery.keyword ? 250 : 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [currentQuery, requestPage]);

  useEffect(() => {
    const handleStatusSync = (): void => {
      void requestPage(latestQueryRef.current, 1, 'replace');
    };

    window.addEventListener(MEMBER_STATUS_SYNC_EVENT, handleStatusSync);
    return () => {
      window.removeEventListener(MEMBER_STATUS_SYNC_EVENT, handleStatusSync);
    };
  }, [requestPage]);

  const handleSearchClear = useCallback((): void => {
    setSearchQuery('');
  }, []);

  const refreshMembers = useCallback(async (): Promise<void> => {
    await requestPage(latestQueryRef.current, 1, 'replace');
  }, [requestPage]);

  const loadMoreMembers = useCallback(async (): Promise<void> => {
    // 首屏 / 刷新请求在途时不追加：两者都递增 requestId，会让并发请求互相作废
    if (isLoading || isRefreshing) {
      return;
    }

    await requestPage(latestQueryRef.current, pageRef.current + 1, 'append');
  }, [isLoading, isRefreshing, requestPage]);

  const retryLoadMembers = useCallback((): void => {
    void requestPage(latestQueryRef.current, 1, 'replace');
  }, [requestPage]);

  return {
    members,
    stats,
    hasMore,
    isLoading,
    isRefreshing,
    errorMessage,
    statusFilter,
    levelFilter,
    expiryFilter,
    pendingBackfillFilter,
    renewalPriceFilter,
    searchQuery,
    setStatusFilter,
    setLevelFilter,
    setExpiryFilter,
    setPendingBackfillFilter,
    setRenewalPriceFilter,
    setSearchQuery,
    handleSearchClear,
    refreshMembers,
    loadMoreMembers,
    retryLoadMembers,
  };
};
