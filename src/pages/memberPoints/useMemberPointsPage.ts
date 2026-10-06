// memberPoints 页面状态与交互管理 hook：筛选条件编排 + 调整提交流程，分页数据交给 useMemberPointsRecords。
import { useCallback, useEffect, useMemo, useState } from 'react';
import { showToast } from '@components/ui/feedback/Toast';
import { safeNum } from '@utils/utils';
import {
  submitMemberPointsAdjustment,
} from '../memberList/memberList.service';
import {
  MEMBER_POINTS_DEFAULT_FILTER_TAB,
  MEMBER_POINTS_SEARCH_DEBOUNCE_MS,
} from './memberPoints.constants';
import type {
  MemberPointsFilterTab,
  MemberPointsPageUser,
  MemberPointsRecordQuery,
} from './memberPoints.types';
import { useMemberPointsRecords } from './useMemberPointsRecords';

interface UseMemberPointsPageReturn {
  /** 当前已加载的流水（分页累积） */
  records: ReturnType<typeof useMemberPointsRecords>['records'];
  /** 会员快照 */
  users: MemberPointsPageUser[];
  /** 弹层内按关键词过滤后的会员 */
  filteredUsers: MemberPointsPageUser[];
  /** 当前筛选 Tab（输入态） */
  activeTab: MemberPointsFilterTab;
  /** 搜索输入值（输入态） */
  recordSearchQuery: string;
  /** 弹层搜索输入值 */
  pickerKeyword: string;
  /** 当前调整目标 */
  adjustTarget: MemberPointsPageUser | null;
  /** 是否展示选人弹层 */
  showUserPicker: boolean;
  /** 首屏加载中 */
  isInitialLoading: boolean;
  /** 会员快照是否可用：不可用时流水行不展示余额 */
  isUsersLoaded: boolean;
  /** 下拉刷新中 */
  isRefreshing: boolean;
  /** 加载更多中 */
  isLoadingMore: boolean;
  /** 是否还有下一页 */
  hasMore: boolean;
  /** 提交调整中 */
  isSubmitting: boolean;
  /** 流水请求错误文案 */
  errorMessage: string;
  /** 后端统计（按当前筛选的完整结果集计算） */
  stats: ReturnType<typeof useMemberPointsRecords>['stats'];
  /** 换筛选条件时回顶的信号：值变化即触发容器回到顶部 */
  scrollToTopTrigger: string;
  setActiveTab: (tab: MemberPointsFilterTab) => void;
  setRecordSearchQuery: (value: string) => void;
  setPickerKeyword: (value: string) => void;
  openUserPicker: () => void;
  closeUserPicker: () => void;
  handleOpenAdjust: (user: MemberPointsPageUser) => void;
  handleCloseAdjust: () => void;
  handleConfirmAdjust: (userId: string, delta: number, reason: string) => Promise<void>;
  /** 下拉刷新：重拉第一页（供 PullRefreshLoadMore 等待完成） */
  refreshRecords: () => Promise<void>;
  /** 上拉加载更多：追加下一页（失败时抛错，由容器呈现失败态） */
  loadMoreRecords: () => Promise<void>;
  /** 重试当前筛选 */
  retryLoad: () => void;
}

/** 默认查询条件：全部 Tab + 空关键词。 */
const createDefaultRecordQuery = (): MemberPointsRecordQuery => ({
  tab: MEMBER_POINTS_DEFAULT_FILTER_TAB,
  keyword: '',
});

const buildUserSearchText = (user: MemberPointsPageUser): string => `${user.name} ${user.phone}`.toLowerCase();

export const useMemberPointsPage = (): UseMemberPointsPageReturn => {
  const [activeTab, setActiveTab] = useState<MemberPointsFilterTab>(MEMBER_POINTS_DEFAULT_FILTER_TAB);
  const [recordSearchQuery, setRecordSearchQuery] = useState<string>('');
  const [appliedQuery, setAppliedQuery] = useState<MemberPointsRecordQuery>(createDefaultRecordQuery);
  const [pickerKeyword, setPickerKeyword] = useState<string>('');
  const [adjustTarget, setAdjustTarget] = useState<MemberPointsPageUser | null>(null);
  const [showUserPicker, setShowUserPicker] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const {
    records,
    users,
    stats,
    hasMore,
    isInitialLoading,
    isUsersLoaded,
    isRefreshing,
    isLoadingMore,
    errorMessage,
    refreshRecords,
    loadMoreRecords,
    retryLoad,
  } = useMemberPointsRecords(appliedQuery);

  // 搜索词带防抖：连续输入只打最后一次请求；Tab 切换立即生效
  useEffect(() => {
    const nextKeyword = recordSearchQuery.trim();
    const timeoutId = window.setTimeout(() => {
      // 条件没变就返回原对象：保持引用稳定，避免「同一条件」重复触发一次首屏请求
      setAppliedQuery((prevQuery) => (
        prevQuery.tab === activeTab && prevQuery.keyword === nextKeyword
          ? prevQuery
          : { tab: activeTab, keyword: nextKeyword }
      ));
    }, nextKeyword ? MEMBER_POINTS_SEARCH_DEBOUNCE_MS : 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeTab, recordSearchQuery]);

  const filteredUsers = useMemo((): MemberPointsPageUser[] => {
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

    const targetUser = users.find((user) => user.id === userId);
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

      // 提交成功后重拉第一页：余额与统计的权威口径都在后端，前端不再乐观拼接记录
      try {
        await refreshRecords();
      } catch {
        showToast({ type: 'error', message: '调整已生效，列表刷新失败，请下拉重试' });
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
  }, [isSubmitting, refreshRecords, users]);

  return {
    records,
    users,
    filteredUsers,
    activeTab,
    recordSearchQuery,
    pickerKeyword,
    adjustTarget,
    showUserPicker,
    isInitialLoading,
    isUsersLoaded,
    isRefreshing,
    isLoadingMore,
    hasMore,
    isSubmitting,
    errorMessage,
    stats,
    scrollToTopTrigger: `${appliedQuery.tab}__${appliedQuery.keyword}`,
    setActiveTab,
    setRecordSearchQuery,
    setPickerKeyword,
    openUserPicker,
    closeUserPicker,
    handleOpenAdjust,
    handleCloseAdjust,
    handleConfirmAdjust,
    refreshRecords,
    loadMoreRecords,
    retryLoad,
  };
};
