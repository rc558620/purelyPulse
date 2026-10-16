// memberPoints 页面状态与交互管理 hook。
//
// 页面分两个视图：
// - list：会员积分一览（页码分页，useMemberPointsUsers），点击 item 进入详情；
// - detail：单个会员的变动记录（游标分页，useMemberPointsRecords，按下发 storeId 过滤）。
// 调整积分的提交流程在这里编排，成功后同时刷新积分一览与当前详情的流水。
import { useCallback, useEffect, useMemo, useState } from 'react';
import { showToast } from '@components/ui/feedback/Toast';
import { safeNum } from '@utils/utils';
import { submitMemberPointsAdjustment } from '../memberList/memberList.service';
import {
  MEMBER_POINTS_DEFAULT_FILTER_TAB,
  MEMBER_POINTS_SEARCH_DEBOUNCE_MS,
} from './memberPoints.constants';
import type {
  MemberPointsFilterTab,
  MemberPointsPageUser,
} from './memberPoints.types';
import { useMemberPointsRecords } from './useMemberPointsRecords';
import { useMemberPointsUsers } from './useMemberPointsUsers';

/** 页面视图：list = 会员积分一览，detail = 单会员变动记录。 */
export type MemberPointsViewMode = 'list' | 'detail';

interface UseMemberPointsPageReturn {
  /** 当前视图 */
  viewMode: MemberPointsViewMode;
  /** 详情视图的会员（list 视图为 null） */
  selectedUser: MemberPointsPageUser | null;
  /** 积分一览（分页累积） */
  users: MemberPointsPageUser[];
  /** 积分一览总数（后端口径，与已加载页数无关） */
  usersTotal: number;
  /** 详情流水分页状态（透传 useMemberPointsRecords） */
  records: ReturnType<typeof useMemberPointsRecords>['records'];
  /** 后端统计（详情视图为该会员的口径） */
  stats: ReturnType<typeof useMemberPointsRecords>['stats'];
  /** 详情筛选 Tab（输入态） */
  activeTab: MemberPointsFilterTab;
  /** 积分一览搜索输入值（输入态） */
  searchQuery: string;
  /** 弹层搜索输入值 */
  pickerKeyword: string;
  /** 弹层内按关键词过滤后的会员 */
  pickerUsers: MemberPointsPageUser[];
  /** 当前调整目标 */
  adjustTarget: MemberPointsPageUser | null;
  /** 是否展示选人弹层 */
  showUserPicker: boolean;
  /** 积分一览分页状态 */
  isUsersLoading: boolean;
  isUsersRefreshing: boolean;
  isUsersLoadingMore: boolean;
  usersHasMore: boolean;
  usersErrorMessage: string;
  /** 详情流水分页状态 */
  isRecordsInitialLoading: boolean;
  isRecordsRefreshing: boolean;
  isRecordsLoadingMore: boolean;
  recordsHasMore: boolean;
  recordsErrorMessage: string;
  /** 积分调整提交中 */
  isSubmitting: boolean;
  /** 详情视图回顶信号：值变化即触发容器回到顶部 */
  scrollToTopTrigger: string;
  /** 积分一览回顶信号：换关键词时回到列表顶部 */
  usersScrollToTopTrigger: string;
  setSearchQuery: (value: string) => void;
  setActiveTab: (tab: MemberPointsFilterTab) => void;
  setPickerKeyword: (value: string) => void;
  /** 点击积分一览 item：进入单会员变动记录视图 */
  openMemberDetail: (user: MemberPointsPageUser) => void;
  /** 从详情返回积分一览 */
  backToMemberList: () => void;
  openUserPicker: () => void;
  closeUserPicker: () => void;
  handleOpenAdjust: (user: MemberPointsPageUser) => void;
  handleCloseAdjust: () => void;
  handleConfirmAdjust: (userId: string, delta: number, reason: string) => Promise<void>;
  /** 下拉刷新积分一览（供 PullRefreshLoadMore 等待完成） */
  refreshUsers: () => Promise<void>;
  /** 上拉加载更多积分一览（失败时抛错，由容器呈现失败态） */
  loadMoreUsers: () => Promise<void>;
  /** 重试积分一览 */
  retryLoadUsers: () => void;
  /** 下拉刷新详情流水（供 PullRefreshLoadMore 等待完成） */
  refreshRecords: () => Promise<void>;
  /** 上拉加载更多详情流水（失败时抛错，由容器呈现失败态） */
  loadMoreRecords: () => Promise<void>;
  /** 重试详情流水 */
  retryLoadRecords: () => void;
}

const buildUserSearchText = (user: MemberPointsPageUser): string => `${user.name} ${user.phone}`.toLowerCase();

export const useMemberPointsPage = (): UseMemberPointsPageReturn => {
  const [viewMode, setViewMode] = useState<MemberPointsViewMode>('list');
  const [selectedUser, setSelectedUser] = useState<MemberPointsPageUser | null>(null);
  const [activeTab, setActiveTab] = useState<MemberPointsFilterTab>(MEMBER_POINTS_DEFAULT_FILTER_TAB);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [appliedKeyword, setAppliedKeyword] = useState<string>('');
  const [pickerKeyword, setPickerKeyword] = useState<string>('');
  const [adjustTarget, setAdjustTarget] = useState<MemberPointsPageUser | null>(null);
  const [showUserPicker, setShowUserPicker] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // ─── 积分一览：页码分页 ────────────────────────────────────────────
  const {
    users,
    total: usersTotal,
    hasMore: usersHasMore,
    isInitialLoading: isUsersLoading,
    isRefreshing: isUsersRefreshing,
    isLoadingMore: isUsersLoadingMore,
    errorMessage: usersErrorMessage,
    refreshUsers,
    loadMoreUsers,
    retryLoad: retryLoadUsers,
  } = useMemberPointsUsers(appliedKeyword);

  // 搜索词带防抖：连续输入只打最后一次请求
  useEffect(() => {
    const nextKeyword = searchQuery.trim();
    const timeoutId = window.setTimeout(() => {
      // 条件没变就返回原值：保持引用稳定，避免「同一条件」重复触发一次首屏请求
      setAppliedKeyword((prevKeyword) => (prevKeyword === nextKeyword ? prevKeyword : nextKeyword));
    }, nextKeyword ? MEMBER_POINTS_SEARCH_DEBOUNCE_MS : 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  // ─── 详情流水：游标分页，按下发 storeId 过滤单会员 ──────────────────
  // 积分一览视图（selectedUser 为 null）不取数；快照只传当前会员，够流水行回填余额与头像
  const detailUsers = useMemo(() => (selectedUser ? [selectedUser] : []), [selectedUser]);
  const recordsQuery = useMemo(
    () => (selectedUser ? { tab: activeTab, keyword: '', storeId: selectedUser.id } : null),
    [activeTab, selectedUser],
  );

  const {
    records,
    stats,
    hasMore: recordsHasMore,
    isInitialLoading: isRecordsInitialLoading,
    isRefreshing: isRecordsRefreshing,
    isLoadingMore: isRecordsLoadingMore,
    errorMessage: recordsErrorMessage,
    refreshRecords,
    loadMoreRecords,
    retryLoad: retryLoadRecords,
  } = useMemberPointsRecords(recordsQuery, detailUsers);

  // ─── 视图切换 ────────────────────────────────────────────────────
  const openMemberDetail = useCallback((user: MemberPointsPageUser): void => {
    setSelectedUser(user);
    setActiveTab(MEMBER_POINTS_DEFAULT_FILTER_TAB);
    setViewMode('detail');
  }, []);

  const backToMemberList = useCallback((): void => {
    setSelectedUser(null);
    setViewMode('list');
  }, []);

  // ─── 选人弹层与调整流程 ──────────────────────────────────────────
  // 弹层在已加载的积分一览里过滤：配合一览搜索框（关键词下推后端）即可定位到任意会员
  const pickerUsers = useMemo((): MemberPointsPageUser[] => {
    const normalizedQuery = pickerKeyword.trim().toLowerCase();
    if (!normalizedQuery) {
      return users;
    }

    return users.filter((user) => buildUserSearchText(user).includes(normalizedQuery));
  }, [pickerKeyword, users]);

  const openUserPicker = useCallback((): void => {
    if (isSubmitting) {
      return;
    }
    setPickerKeyword('');
    setShowUserPicker(true);
  }, [isSubmitting]);

  const closeUserPicker = useCallback((): void => {
    if (isSubmitting) {
      return;
    }
    setPickerKeyword('');
    setShowUserPicker(false);
  }, [isSubmitting]);

  const handleOpenAdjust = useCallback((user: MemberPointsPageUser): void => {
    if (isSubmitting) {
      return;
    }
    setAdjustTarget(user);
    setPickerKeyword('');
    setShowUserPicker(false);
  }, [isSubmitting]);

  const handleCloseAdjust = useCallback((): void => {
    if (isSubmitting) {
      return;
    }
    setAdjustTarget(null);
  }, [isSubmitting]);

  const handleConfirmAdjust = useCallback(async (userId: string, delta: number, reason: string): Promise<void> => {
    if (isSubmitting) {
      return;
    }

    const targetUser = adjustTarget?.id === userId
      ? adjustTarget
      : users.find((user) => user.id === userId);
    if (!targetUser) {
      showToast({ type: 'error', message: '未找到要调整的会员' });
      return;
    }

    // 调整量来自弹层输入：提交前归一，脏值（NaN / 空串解析失败）不能进写接口
    const normalizedDelta = safeNum(delta);
    setIsSubmitting(true);

    try {
      await submitMemberPointsAdjustment(userId, normalizedDelta, reason);
      setAdjustTarget(null);
      showToast({ type: 'success', message: normalizedDelta >= 0 ? '积分调整成功' : '积分扣减成功' });

      // 详情视图先同步本地积分：重拉完成前头部与流水行的积分不能停留在旧值。
      // 权威口径仍以刷新后的积分一览为准
      setSelectedUser((prevUser) => (
        prevUser && prevUser.id === userId
          ? { ...prevUser, availablePoints: safeNum(safeNum(prevUser.availablePoints) + normalizedDelta) }
          : prevUser
      ));

      // 调整已生效，两边各自刷新：积分一览重拉第一页，详情流水重拉第一页。
      // 失败不打断成功提示，只转成一句「请下拉重试」
      try {
        await refreshUsers();
      } catch {
        // 积分一览刷新失败：列表保留旧值，用户可下拉重试
      }

      if (selectedUser?.id === userId) {
        try {
          await refreshRecords();
        } catch {
          showToast({ type: 'error', message: '调整已生效，记录刷新失败，请下拉重试' });
        }
      }
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : '积分调整失败，请稍后重试',
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [adjustTarget, isSubmitting, refreshRecords, refreshUsers, selectedUser, users]);

  return {
    viewMode,
    selectedUser,
    users,
    usersTotal,
    records,
    stats,
    activeTab,
    searchQuery,
    pickerKeyword,
    pickerUsers,
    adjustTarget,
    showUserPicker,
    isUsersLoading,
    isUsersRefreshing,
    isUsersLoadingMore,
    usersHasMore,
    usersErrorMessage,
    isRecordsInitialLoading,
    isRecordsRefreshing,
    isRecordsLoadingMore,
    recordsHasMore,
    recordsErrorMessage,
    isSubmitting,
    scrollToTopTrigger: `${activeTab}__${selectedUser?.id ?? ''}`,
    usersScrollToTopTrigger: appliedKeyword,
    setSearchQuery,
    setActiveTab,
    setPickerKeyword,
    openMemberDetail,
    backToMemberList,
    openUserPicker,
    closeUserPicker,
    handleOpenAdjust,
    handleCloseAdjust,
    handleConfirmAdjust,
    refreshUsers,
    loadMoreUsers,
    retryLoadUsers,
    refreshRecords,
    loadMoreRecords,
    retryLoadRecords,
  };
};
