// 会员列表页 Hook：管理筛选、搜索、列表请求、竞态保护与错误状态。
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { MEMBER_STATUS_SYNC_EVENT } from './memberList.constants';
import { fetchMemberList } from './memberList.service';
import type { MemberFilterLevel, MemberFilterStatus, MemberListItem, MemberListQuery, MemberListStats } from './memberList.types';

interface UseMemberListPageReturn {
  /** 当前会员列表。 */
  members: MemberListItem[];
  /** 概览统计。 */
  stats: MemberListStats;
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
  /** 当前搜索词。 */
  searchQuery: string;
  /** 更新状态筛选。 */
  setStatusFilter: (value: MemberFilterStatus) => void;
  /** 更新等级筛选。 */
  setLevelFilter: (value: MemberFilterLevel) => void;
  /** 更新搜索词。 */
  setSearchQuery: (value: string) => void;
  /** 清空搜索词。 */
  handleSearchClear: () => void;
  /** 重试当前查询。 */
  retryLoadMembers: () => void;
}

const EMPTY_MEMBER_LIST_STATS: MemberListStats = {
  totalCount: 0,
  activeCount: 0,
  partnerCount: 0,
  bannedCount: 0,
};

/** 会员列表页数据 Hook。 */
export const useMemberListPage = (): UseMemberListPageReturn => {
  const [members, setMembers] = useState<MemberListItem[]>([]);
  const [stats, setStats] = useState<MemberListStats>(EMPTY_MEMBER_LIST_STATS);
  const [statusFilter, setStatusFilter] = useState<MemberFilterStatus>('all');
  const [levelFilter, setLevelFilter] = useState<MemberFilterLevel>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const hasLoadedRef = useRef<boolean>(false);
  const requestIdRef = useRef<number>(0);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const currentQuery = useMemo<MemberListQuery>(() => ({
    keyword: deferredSearchQuery.trim(),
    status: statusFilter,
    level: levelFilter,
  }), [deferredSearchQuery, levelFilter, statusFilter]);
  const latestQueryRef = useRef<MemberListQuery>(currentQuery);

  const loadMembers = useCallback(async (query: MemberListQuery): Promise<void> => {
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    if (hasLoadedRef.current) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await fetchMemberList(query);
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setMembers(response.members);
      setStats(response.stats);
      setErrorMessage('');
      hasLoadedRef.current = true;
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : '获取会员列表失败');
      if (!hasLoadedRef.current) {
        setMembers([]);
        setStats(EMPTY_MEMBER_LIST_STATS);
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    latestQueryRef.current = currentQuery;
  }, [currentQuery]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadMembers(currentQuery);
    }, currentQuery.keyword ? 250 : 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [currentQuery, loadMembers]);

  useEffect(() => {
    const handleStatusSync = (): void => {
      void loadMembers(latestQueryRef.current);
    };

    window.addEventListener(MEMBER_STATUS_SYNC_EVENT, handleStatusSync);
    return () => {
      window.removeEventListener(MEMBER_STATUS_SYNC_EVENT, handleStatusSync);
    };
  }, [loadMembers]);

  const handleSearchClear = useCallback((): void => {
    setSearchQuery('');
  }, []);

  const retryLoadMembers = useCallback((): void => {
    void loadMembers(latestQueryRef.current);
  }, [loadMembers]);

  return {
    members,
    stats,
    isLoading,
    isRefreshing,
    errorMessage,
    statusFilter,
    levelFilter,
    searchQuery,
    setStatusFilter,
    setLevelFilter,
    setSearchQuery,
    handleSearchClear,
    retryLoadMembers,
  };
};
