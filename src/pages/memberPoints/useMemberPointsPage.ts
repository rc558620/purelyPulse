// memberPoints 页面状态与交互管理 hook。
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { showToast } from '@components/ui/feedback/Toast';
import { fallbackKey, safeNum } from '@utils/utils';
import {
  fetchMemberPointsPageData,
  submitMemberPointsAdjustment,
} from '../memberList/memberList.service';
import type {
  MemberPointsFilterTab,
  MemberPointsPageUser,
  MemberPointsRecord,
  MemberPointsStats,
} from './memberPoints.types';

interface UseMemberPointsPageReturn {
  records: MemberPointsRecord[];
  users: MemberPointsPageUser[];
  filteredRecords: MemberPointsRecord[];
  filteredUsers: MemberPointsPageUser[];
  activeTab: MemberPointsFilterTab;
  recordSearchQuery: string;
  pickerKeyword: string;
  adjustTarget: MemberPointsPageUser | null;
  showUserPicker: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  errorMessage: string;
  stats: MemberPointsStats;
  setActiveTab: (tab: MemberPointsFilterTab) => void;
  setRecordSearchQuery: (value: string) => void;
  setPickerKeyword: (value: string) => void;
  openUserPicker: () => void;
  closeUserPicker: () => void;
  handleOpenAdjust: (user: MemberPointsPageUser) => void;
  handleCloseAdjust: () => void;
  handleConfirmAdjust: (userId: string, delta: number, reason: string) => Promise<void>;
  retryLoad: () => void;
}

const EMPTY_STATS: MemberPointsStats = {
  totalRecords: 0,
  adminAdjustCount: 0,
  todayChangeCount: 0,
};

const normalizeQuery = (value: string): string => value.trim().toLowerCase();

const buildStats = (records: MemberPointsRecord[]): MemberPointsStats => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let adminAdjustCount = 0;
  let todayChangeCount = 0;

  for (const record of records) {
    if (record.source === 'admin_adjust') {
      adminAdjustCount += 1;
    }

    if (record.createdAt >= today.getTime()) {
      todayChangeCount += 1;
    }
  }

  return {
    totalRecords: records.length,
    adminAdjustCount,
    todayChangeCount,
  };
};

export const useMemberPointsPage = (): UseMemberPointsPageReturn => {
  const [records, setRecords] = useState<MemberPointsRecord[]>([]);
  const [users, setUsers] = useState<MemberPointsPageUser[]>([]);
  const [activeTab, setActiveTab] = useState<MemberPointsFilterTab>('all');
  const [recordSearchQuery, setRecordSearchQuery] = useState('');
  const [pickerKeyword, setPickerKeyword] = useState('');
  const [adjustTarget, setAdjustTarget] = useState<MemberPointsPageUser | null>(null);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [stats, setStats] = useState<MemberPointsStats>(EMPTY_STATS);

  const requestIdRef = useRef(0);
  const deferredRecordSearchQuery = useDeferredValue(recordSearchQuery);
  const deferredPickerKeyword = useDeferredValue(pickerKeyword);

  const loadPageData = useCallback(async (): Promise<void> => {
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;
    setIsLoading(true);

    try {
      const response = await fetchMemberPointsPageData();
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setRecords(response.records);
      setUsers(response.users);
      setStats(response.stats);
      setErrorMessage('');
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setRecords([]);
      setUsers([]);
      setStats(EMPTY_STATS);
      setErrorMessage(error instanceof Error ? error.message : '获取积分数据失败');
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 页面初始化加载异步数据，setState 在 await 后执行，非同步级联渲染
    void loadPageData();
  }, [loadPageData]);

  const filteredRecords = useMemo(() => {
    let nextRecords = records;

    if (activeTab === 'admin') {
      nextRecords = nextRecords.filter((record) => record.source === 'admin_adjust');
    } else if (activeTab === 'earn') {
      // "获得"tab：只显示非管理员调整的获得记录（购买奖励等）
      nextRecords = nextRecords.filter((record) => record.source !== 'admin_adjust' && record.type === 'earn');
    } else if (activeTab === 'spend') {
      // "消耗"tab：只显示非管理员调整的消耗/过期记录（抵扣消费、积分过期等）
      nextRecords = nextRecords.filter((record) => record.source !== 'admin_adjust' && record.type !== 'earn');
    }

    const normalizedQuery = normalizeQuery(deferredRecordSearchQuery);
    if (!normalizedQuery) {
      return nextRecords;
    }

    return nextRecords.filter((record) => (
      record.userName.toLowerCase().includes(normalizedQuery)
      || record.userPhone.toLowerCase().includes(normalizedQuery)
      || record.description.toLowerCase().includes(normalizedQuery)
    ));
  }, [activeTab, deferredRecordSearchQuery, records]);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = normalizeQuery(deferredPickerKeyword);
    if (!showUserPicker || !normalizedQuery) {
      return users;
    }

    return users.filter((user) => (
      user.name.toLowerCase().includes(normalizedQuery)
      || user.phone.toLowerCase().includes(normalizedQuery)
    ));
  }, [deferredPickerKeyword, showUserPicker, users]);

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

    setIsSubmitting(true);
    try {
      await submitMemberPointsAdjustment(userId, delta, reason);

      // 提交成功后重新从后端拉取最新数据，确保数据一致性
      try {
        const response = await fetchMemberPointsPageData();
        setRecords(response.records);
        setUsers(response.users);
        setStats(response.stats);
      } catch {
        // 后端刷新失败时退回乐观更新
        const newRecord: MemberPointsRecord = {
          id: fallbackKey('member-points-record'),
          userId,
          userName: targetUser.name,
          userPhone: targetUser.phone,
          avatarUrl: targetUser.avatarUrl,
          availablePoints: targetUser.availablePoints,
          amount: delta,
          type: delta > 0 ? 'earn' : 'spend',
          source: 'admin_adjust',
          description: reason,
          createdAt: Date.now(),
        };

        setRecords((prev) => {
          const nextRecords = [newRecord, ...prev];
          setStats(buildStats(nextRecords));
          return nextRecords;
        });
        setUsers((prev) => prev.map((user) => (
          user.id === userId
            ? { ...user, availablePoints: safeNum(user.availablePoints + delta) }
            : user
        )));
      }

      setAdjustTarget(null);
      showToast({ type: 'success', message: delta >= 0 ? '积分调整成功' : '积分扣减成功' });
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : '积分调整失败，请稍后重试',
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, users]);

  const retryLoad = useCallback((): void => {
    void loadPageData();
  }, [loadPageData]);

  return {
    records,
    users,
    filteredRecords,
    filteredUsers,
    activeTab,
    recordSearchQuery,
    pickerKeyword,
    adjustTarget,
    showUserPicker,
    isLoading,
    isSubmitting,
    errorMessage,
    stats,
    setActiveTab,
    setRecordSearchQuery,
    setPickerKeyword,
    openUserPicker,
    closeUserPicker,
    handleOpenAdjust,
    handleCloseAdjust,
    handleConfirmAdjust,
    retryLoad,
  };
};
