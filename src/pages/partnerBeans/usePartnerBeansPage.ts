// partnerBeans 页面状态与交互管理 hook。
//
// 页面分两个视图：
// - list：合伙人余额一览（页码分页，usePartnerBeanUsers），点击 item 进入详情；
// - detail：单个合伙人的变动记录（游标分页，usePartnerBeanRecords，按下发 storeId 过滤）。
// 调整纯利豆的提交流程在这里编排，成功后同时刷新余额一览与当前详情的流水。
import { useCallback, useEffect, useMemo, useState } from 'react';
import { showToast } from '@components/ui/feedback/Toast';
import { safeNum } from '@utils/utils';
import { submitMemberBeansAdjustment } from '../memberList/memberList.service';
import {
  PARTNER_BEANS_DEFAULT_FILTER_TAB,
  PARTNER_BEANS_SEARCH_DEBOUNCE_MS,
} from './partnerBeans.constants';
import type {
  PartnerBeansFilterTab,
  PartnerBeansPageUser,
} from './partnerBeans.types';
import { usePartnerBeanRecords } from './usePartnerBeanRecords';
import { usePartnerBeanUsers } from './usePartnerBeanUsers';

/** 页面视图：list = 合伙人余额一览，detail = 单合伙人变动记录。 */
export type PartnerBeansViewMode = 'list' | 'detail';

interface UsePartnerBeansPageReturn {
  /** 当前视图 */
  viewMode: PartnerBeansViewMode;
  /** 详情视图的合伙人（list 视图为 null） */
  selectedUser: PartnerBeansPageUser | null;
  /** 余额一览（分页累积） */
  users: PartnerBeansPageUser[];
  /** 余额一览总数（后端口径，与已加载页数无关） */
  usersTotal: number;
  /** 详情流水分页状态（透传 usePartnerBeanRecords） */
  records: ReturnType<typeof usePartnerBeanRecords>['records'];
  /** 后端统计（详情视图为该合伙人的口径） */
  stats: ReturnType<typeof usePartnerBeanRecords>['stats'];
  /** 详情筛选 Tab（输入态） */
  activeTab: PartnerBeansFilterTab;
  /** 余额一览搜索输入值（输入态） */
  searchQuery: string;
  /** 弹层搜索输入值 */
  pickerSearchQuery: string;
  /** 弹层内按关键词过滤后的合伙人 */
  pickerUsers: PartnerBeansPageUser[];
  /** 当前调整目标 */
  adjustTarget: PartnerBeansPageUser | null;
  /** 是否展示选人弹层 */
  showUserPicker: boolean;
  /** 调整提交中：提交期间禁用各入口，避免重复提交 */
  isSubmitting: boolean;
  /** 余额一览分页状态 */
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
  /** 详情视图回顶信号：值变化即触发容器回到顶部 */
  scrollToTopTrigger: string;
  /** 余额一览回顶信号：换关键词时回到列表顶部 */
  usersScrollToTopTrigger: string;
  setSearchQuery: (value: string) => void;
  setActiveTab: (tab: PartnerBeansFilterTab) => void;
  setPickerSearchQuery: (value: string) => void;
  /** 点击余额一览 item：进入单合伙人变动记录视图 */
  openPartnerDetail: (user: PartnerBeansPageUser) => void;
  /** 从详情返回余额一览 */
  backToPartnerList: () => void;
  openUserPicker: () => void;
  closeUserPicker: () => void;
  handleOpenAdjust: (user: PartnerBeansPageUser) => void;
  handleCloseAdjust: () => void;
  handleConfirmAdjust: (userId: string, delta: number, reason: string) => Promise<void>;
  /** 下拉刷新余额一览（供 PullRefreshLoadMore 等待完成） */
  refreshUsers: () => Promise<void>;
  /** 上拉加载更多余额一览（失败时抛错，由容器呈现失败态） */
  loadMoreUsers: () => Promise<void>;
  /** 重试余额一览 */
  retryLoadUsers: () => void;
  /** 下拉刷新详情流水（供 PullRefreshLoadMore 等待完成） */
  refreshRecords: () => Promise<void>;
  /** 上拉加载更多详情流水（失败时抛错，由容器呈现失败态） */
  loadMoreRecords: () => Promise<void>;
  /** 重试详情流水 */
  retryLoadRecords: () => void;
}

const buildUserSearchText = (user: PartnerBeansPageUser): string => `${user.name} ${user.phone}`.toLowerCase();

export const usePartnerBeansPage = (): UsePartnerBeansPageReturn => {
  const [viewMode, setViewMode] = useState<PartnerBeansViewMode>('list');
  const [selectedUser, setSelectedUser] = useState<PartnerBeansPageUser | null>(null);
  const [activeTab, setActiveTab] = useState<PartnerBeansFilterTab>(PARTNER_BEANS_DEFAULT_FILTER_TAB);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [appliedKeyword, setAppliedKeyword] = useState<string>('');
  const [pickerSearchQuery, setPickerSearchQuery] = useState<string>('');
  const [adjustTarget, setAdjustTarget] = useState<PartnerBeansPageUser | null>(null);
  const [showUserPicker, setShowUserPicker] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // ─── 余额一览：页码分页 ────────────────────────────────────────────
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
  } = usePartnerBeanUsers(appliedKeyword);

  // 搜索词带防抖：连续输入只打最后一次请求
  useEffect(() => {
    const nextKeyword = searchQuery.trim();
    const timeoutId = window.setTimeout(() => {
      // 条件没变就返回原值：保持引用稳定，避免「同一条件」重复触发一次首屏请求
      setAppliedKeyword((prevKeyword) => (prevKeyword === nextKeyword ? prevKeyword : nextKeyword));
    }, nextKeyword ? PARTNER_BEANS_SEARCH_DEBOUNCE_MS : 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  // ─── 详情流水：游标分页，按下发 storeId 过滤单合伙人 ────────────────
  // 余额一览视图（selectedUser 为 null）不取数；快照只传当前合伙人，够流水行回填余额与头像
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
  } = usePartnerBeanRecords(recordsQuery, detailUsers);

  // ─── 视图切换 ────────────────────────────────────────────────────
  const openPartnerDetail = useCallback((user: PartnerBeansPageUser): void => {
    setSelectedUser(user);
    setActiveTab(PARTNER_BEANS_DEFAULT_FILTER_TAB);
    setViewMode('detail');
  }, []);

  const backToPartnerList = useCallback((): void => {
    setSelectedUser(null);
    setViewMode('list');
  }, []);

  // ─── 选人弹层与调整流程 ──────────────────────────────────────────
  // 弹层只在已加载的余额一览里过滤：合伙人总量通常很小，翻几页即可覆盖
  const pickerUsers = useMemo((): PartnerBeansPageUser[] => {
    const normalizedQuery = pickerSearchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return users;
    }

    return users.filter((user) => buildUserSearchText(user).includes(normalizedQuery));
  }, [pickerSearchQuery, users]);

  const openUserPicker = useCallback((): void => {
    if (isSubmitting) {
      return;
    }
    setPickerSearchQuery('');
    setShowUserPicker(true);
  }, [isSubmitting]);

  const closeUserPicker = useCallback((): void => {
    if (isSubmitting) {
      return;
    }
    setPickerSearchQuery('');
    setShowUserPicker(false);
  }, [isSubmitting]);

  const handleOpenAdjust = useCallback((user: PartnerBeansPageUser): void => {
    if (isSubmitting) {
      return;
    }
    setAdjustTarget(user);
    setPickerSearchQuery('');
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
      showToast({ type: 'error', message: '未找到要调整的合伙人' });
      return;
    }

    // 调整量来自弹层输入：提交前归一，脏值（NaN / 空串解析失败）不能进写接口
    const normalizedDelta = safeNum(delta);
    setIsSubmitting(true);

    try {
      await submitMemberBeansAdjustment(userId, normalizedDelta, reason);
      setAdjustTarget(null);
      showToast({ type: 'success', message: normalizedDelta >= 0 ? '纯利豆调整成功' : '纯利豆扣减成功' });

      // 详情视图先同步本地余额：重拉完成前头部余额不能停留在旧值。
      // 权威口径仍以刷新后的余额一览为准
      setSelectedUser((prevUser) => (
        prevUser && prevUser.id === userId
          ? { ...prevUser, beanBalance: safeNum(safeNum(prevUser.beanBalance) + normalizedDelta) }
          : prevUser
      ));

      // 调整已生效，两边各自刷新：余额一览重拉第一页，详情流水重拉第一页。
      // 失败不打断成功提示，只转成一句「请下拉重试」
      try {
        await refreshUsers();
      } catch {
        // 余额一览刷新失败：列表保留旧值，用户可下拉重试
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
        message: error instanceof Error ? error.message : '纯利豆调整失败，请稍后重试',
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
    pickerSearchQuery,
    pickerUsers,
    adjustTarget,
    showUserPicker,
    isSubmitting,
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
    scrollToTopTrigger: `${activeTab}__${selectedUser?.id ?? ''}`,
    usersScrollToTopTrigger: appliedKeyword,
    setSearchQuery,
    setActiveTab,
    setPickerSearchQuery,
    openPartnerDetail,
    backToPartnerList,
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
