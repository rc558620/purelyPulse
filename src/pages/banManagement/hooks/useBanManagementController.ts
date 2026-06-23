// 封禁管理控制器：管理列表加载、筛选与封禁确认流程。
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { showToast } from '@components/ui/feedback/Toast';
import { safeNum, safeStr } from '@utils/utils';
import { MEMBER_STATUS_SYNC_EVENT } from '../../memberList/memberList.constants';
import type { MemberFilterStatus, MemberListStats } from '../../memberList/memberList.types';
import {
  fetchBanManagementList,
  submitBanManagementBan,
  submitBanManagementUnban,
} from '../banManagement.service';
import type {
  BanManagementConfirmTarget,
  BanManagementCounts,
  BanManagementQuery,
  ConfirmAction,
  UseBanManagementControllerReturn,
} from '../banManagement.types';

const SEARCH_DEBOUNCE_DELAY = 250;

const EMPTY_STATS: MemberListStats = {
  totalCount: 0,
  activeCount: 0,
  partnerCount: 0,
  bannedCount: 0,
};

const buildCounts = (stats: MemberListStats): BanManagementCounts => {
  const totalCount = safeNum(stats.totalCount);
  const activeCount = safeNum(stats.activeCount);
  const bannedCount = safeNum(stats.bannedCount);
  // inactiveCount = total - active - banned，但后端数据可能存在延迟或重叠（如合伙人同时计入 active），
  // 差值可能为负。取 Math.max(0, ...) 保底，同时在 counts 上标记是否为估算值，方便 UI 展示兜底。
  const rawInactive = totalCount - activeCount - bannedCount;
  const inactiveCount = Math.max(0, rawInactive);

  return {
    all: totalCount,
    active: activeCount,
    inactive: inactiveCount,
    banned: bannedCount,
  };
};

export const useBanManagementController = (): UseBanManagementControllerReturn => {
  const [members, setMembers] = useState<UseBanManagementControllerReturn['members']>([]);
  const [stats, setStats] = useState<MemberListStats>(EMPTY_STATS);
  const [statusFilter, setStatusFilter] = useState<MemberFilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<BanManagementConfirmTarget | null>(null);
  const [banReason, setBanReason] = useState('');
  const [submittingMemberId, setSubmittingMemberId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const hasLoadedRef = useRef(false);
  const requestIdRef = useRef(0);
  const queryRef = useRef<BanManagementQuery>({ keyword: '', status: 'all' });
  // Bug #3: 用 ref 做防重提交守卫，避免双击时 state 还未更新就发起第二次请求
  const isSubmittingRef = useRef(false);

  const currentQuery = useMemo<BanManagementQuery>(() => ({
    keyword: debouncedKeyword.trim(),
    status: statusFilter,
  }), [debouncedKeyword, statusFilter]);

  const loadMembers = useCallback(async (query: BanManagementQuery): Promise<void> => {
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    if (hasLoadedRef.current) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await fetchBanManagementList(query);
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

      setErrorMessage(error instanceof Error ? error.message : '获取封禁列表失败');
      if (!hasLoadedRef.current) {
        setMembers([]);
        setStats(EMPTY_STATS);
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  // Bug #12: 用 ref 追踪最新的 searchQuery，保证清空时 debounce 不会残留旧值请求
  const searchQueryRef = useRef(searchQuery);
  searchQueryRef.current = searchQuery;

  useEffect(() => {
    const currentSearchQuery = searchQueryRef.current;
    const timeoutId = window.setTimeout(() => {
      // 只在 timeout 触发时读取最新值，避免 debounce 窗口内清空产生多余请求
      setDebouncedKeyword(searchQueryRef.current);
    }, currentSearchQuery.trim() ? SEARCH_DEBOUNCE_DELAY : 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  useEffect(() => {
    queryRef.current = currentQuery;
    void loadMembers(currentQuery);
  }, [currentQuery, loadMembers]);

  const loadLatestMembers = useCallback((): void => {
    void loadMembers(queryRef.current);
  }, [loadMembers]);

  useEffect(() => {
    const handleStatusSync = (): void => {
      loadLatestMembers();
    };

    window.addEventListener(MEMBER_STATUS_SYNC_EVENT, handleStatusSync);
    return () => {
      window.removeEventListener(MEMBER_STATUS_SYNC_EVENT, handleStatusSync);
    };
  }, [loadLatestMembers]);

  const counts = useMemo<BanManagementCounts>(() => buildCounts(stats), [stats]);
  const isSubmitting = Boolean(submittingMemberId);

  const handleSearchClear = useCallback((): void => {
    setSearchQuery('');
  }, []);

  const retryLoad = useCallback((): void => {
    loadLatestMembers();
  }, [loadLatestMembers]);

  const handleToggleExpand = useCallback((id: string): void => {
    if (isSubmitting) {
      return;
    }

    setExpandedId((previousId) => (previousId === id ? null : id));
  }, [isSubmitting]);

  const handleOpenConfirm = useCallback((member: BanManagementConfirmTarget['member'], action: ConfirmAction): void => {
    if (isSubmitting) {
      return;
    }

    setBanReason('');
    setConfirmTarget({ member, action });
  }, [isSubmitting]);

  const handleCancelConfirm = useCallback((): void => {
    if (isSubmitting) {
      return;
    }

    setConfirmTarget(null);
    setBanReason('');
  }, [isSubmitting]);

  const handleConfirm = useCallback(async (): Promise<void> => {
    // Bug #1 & #3: 用 ref 做防重提交守卫，避免双击和闭包陈旧问题
    if (isSubmittingRef.current) {
      return;
    }

    if (!confirmTarget) {
      return;
    }

    const { member, action } = confirmTarget;
    const normalizedReason = banReason.trim();

    if (action === 'ban' && !normalizedReason) {
      showToast({ type: 'error', message: '请选择封禁原因' });
      return;
    }

    isSubmittingRef.current = true;
    setSubmittingMemberId(member.id);
    try {
      if (action === 'ban') {
        await submitBanManagementBan(member.id, normalizedReason);
        // Bug #5: 封禁成功应用 success 类型，而非 warning
        showToast({ type: 'success', message: `已封禁「${safeStr(member.name, '会员')}」` });
      } else {
        await submitBanManagementUnban(member.id);
        showToast({ type: 'success', message: `已解封「${safeStr(member.name, '会员')}」` });
      }

      setConfirmTarget(null);
      setExpandedId(null);
      setBanReason('');
    } catch (error) {
      // Bug #2: 移除 throw error，错误已通过 showToast 展示，无需再次抛出导致未捕获的 Promise rejection
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : (action === 'ban' ? '封禁会员失败，请稍后重试' : '解封会员失败，请稍后重试'),
      });
    } finally {
      isSubmittingRef.current = false;
      setSubmittingMemberId('');
    }
  }, [banReason, confirmTarget]);

  return {
    members,
    stats,
    counts,
    isLoading,
    isRefreshing,
    isSubmitting,
    errorMessage,
    statusFilter,
    searchQuery,
    expandedId,
    confirmTarget,
    banReason,
    submittingMemberId,
    setStatusFilter,
    setSearchQuery,
    setBanReason,
    handleSearchClear,
    retryLoad,
    handleToggleExpand,
    handleOpenConfirm,
    handleCancelConfirm,
    handleConfirm,
  };
};
