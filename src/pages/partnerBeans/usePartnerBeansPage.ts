// partnerBeans 页面状态与交互管理 hook
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { showToast } from '@components/ui/feedback/Toast';
import { fallbackKey, safeNum } from '@utils/utils';
import {
  fetchPartnerBeansPageData,
  submitMemberBeansAdjustment,
} from '../memberList/memberList.service';
import { PARTNER_BEANS_DEFAULT_FILTER_TAB, PARTNER_BEANS_EMPTY_STATS } from './partnerBeans.constants';
import type {
  PartnerBeansFilterTab,
  PartnerBeansPageRecord,
  PartnerBeansPageStats,
  PartnerBeansPageUser,
} from './partnerBeans.types';

interface UsePartnerBeansPageReturn {
  records: PartnerBeansPageRecord[];
  users: PartnerBeansPageUser[];
  filteredRecords: PartnerBeansPageRecord[];
  pickerUsers: PartnerBeansPageUser[];
  activeTab: PartnerBeansFilterTab;
  searchQuery: string;
  pickerSearchQuery: string;
  adjustTarget: PartnerBeansPageUser | null;
  showUserPicker: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  errorMessage: string;
  stats: PartnerBeansPageStats;
  setActiveTab: (tab: PartnerBeansFilterTab) => void;
  setSearchQuery: (value: string) => void;
  setPickerSearchQuery: (value: string) => void;
  openUserPicker: () => void;
  closeUserPicker: () => void;
  handleOpenAdjust: (user: PartnerBeansPageUser) => void;
  handleCloseAdjust: () => void;
  handleConfirmAdjust: (userId: string, delta: number, reason: string) => Promise<void>;
  retryLoad: () => void;
}

interface IndexedPartnerBeansRecord {
  record: PartnerBeansPageRecord;
  searchText: string;
}

interface IndexedPartnerBeansUser {
  user: PartnerBeansPageUser;
  searchText: string;
}

const buildPartnerBeansStats = (records: PartnerBeansPageRecord[]): PartnerBeansPageStats => ({
  totalRecords: records.length,
  adminAdjustCount: records.filter((record) => record.source === 'admin_adjust').length,
  withdrawCount: records.filter((record) => record.source === 'withdrawal').length,
  promoRewardCount: records.filter((record) => record.source === 'promo_reward').length,
});

const buildRecordSearchText = (record: PartnerBeansPageRecord): string => `${record.userName} ${record.userPhone} ${record.description}`.toLowerCase();

const buildUserSearchText = (user: PartnerBeansPageUser): string => `${user.name} ${user.phone}`.toLowerCase();

export const usePartnerBeansPage = (): UsePartnerBeansPageReturn => {
  const [records, setRecords] = useState<PartnerBeansPageRecord[]>([]);
  const [users, setUsers] = useState<PartnerBeansPageUser[]>([]);
  const [activeTab, setActiveTab] = useState<PartnerBeansFilterTab>(PARTNER_BEANS_DEFAULT_FILTER_TAB);
  const [searchQuery, setSearchQuery] = useState('');
  const [pickerSearchQuery, setPickerSearchQuery] = useState('');
  const [adjustTarget, setAdjustTarget] = useState<PartnerBeansPageUser | null>(null);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [stats, setStats] = useState<PartnerBeansPageStats>(PARTNER_BEANS_EMPTY_STATS);

  const requestIdRef = useRef(0);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const deferredPickerSearchQuery = useDeferredValue(pickerSearchQuery);

  const indexedRecords = useMemo<IndexedPartnerBeansRecord[]>(() => records.map((record) => ({
    record,
    searchText: buildRecordSearchText(record),
  })), [records]);

  const indexedUsers = useMemo<IndexedPartnerBeansUser[]>(() => users.map((user) => ({
    user,
    searchText: buildUserSearchText(user),
  })), [users]);

  const loadPageData = useCallback(async (): Promise<void> => {
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;
    setIsLoading(true);

    try {
      const response = await fetchPartnerBeansPageData();
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
      setStats(PARTNER_BEANS_EMPTY_STATS);
      setErrorMessage(error instanceof Error ? error.message : '获取纯利豆数据失败');
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadPageData();
  }, [loadPageData]);

  const filteredRecords = useMemo(() => {
    let nextRecords = indexedRecords;

    if (activeTab === 'admin') {
      nextRecords = nextRecords.filter(({ record }) => record.source === 'admin_adjust');
    } else if (activeTab === 'earn') {
      nextRecords = nextRecords.filter(({ record }) => record.type === 'earn');
    } else if (activeTab === 'spend') {
      nextRecords = nextRecords.filter(({ record }) => record.type !== 'earn');
    }

    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
    if (normalizedQuery) {
      nextRecords = nextRecords.filter(({ searchText }) => searchText.includes(normalizedQuery));
    }

    return nextRecords.map(({ record }) => record);
  }, [activeTab, deferredSearchQuery, indexedRecords]);

  const pickerUsers = useMemo(() => {
    const normalizedQuery = deferredPickerSearchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return users;
    }

    return indexedUsers
      .filter(({ searchText }) => searchText.includes(normalizedQuery))
      .map(({ user }) => user);
  }, [deferredPickerSearchQuery, indexedUsers, users]);

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

    const targetUser = users.find((user) => user.id === userId);
    if (!targetUser) {
      showToast({ type: 'error', message: '未找到要调整的合伙人' });
      return;
    }

    setIsSubmitting(true);

    try {
      await submitMemberBeansAdjustment(userId, delta, reason);

      const newRecord: PartnerBeansPageRecord = {
        id: fallbackKey('partner-bean-record'),
        userId,
        userName: targetUser.name,
        userPhone: targetUser.phone,
        amount: delta,
        type: delta > 0 ? 'earn' : 'spend',
        source: 'admin_adjust',
        description: reason,
        createdAt: Date.now(),
      };

      setRecords((prevRecords) => {
        const nextRecords = [newRecord, ...prevRecords];
        setStats(buildPartnerBeansStats(nextRecords));
        return nextRecords;
      });

      setUsers((prevUsers) => prevUsers.map((user) => (
        user.id === userId
          ? { ...user, beanBalance: safeNum(user.beanBalance + delta) }
          : user
      )));
      setAdjustTarget(null);
      showToast({ type: 'success', message: delta >= 0 ? '纯利豆调整成功' : '纯利豆扣减成功' });
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : '纯利豆调整失败，请稍后重试',
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
    pickerUsers,
    activeTab,
    searchQuery,
    pickerSearchQuery,
    adjustTarget,
    showUserPicker,
    isLoading,
    isSubmitting,
    errorMessage,
    stats,
    setActiveTab,
    setSearchQuery,
    setPickerSearchQuery,
    openUserPicker,
    closeUserPicker,
    handleOpenAdjust,
    handleCloseAdjust,
    handleConfirmAdjust,
    retryLoad,
  };
};
