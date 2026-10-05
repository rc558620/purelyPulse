// 新客额度页面状态与交互管理 hook
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { showToast } from '@components/ui/feedback/Toast';
import { safeNum } from '@utils/utils';
import {
  fetchNewCustomerQuotaStores,
  submitNewCustomerQuotaAdjust,
} from './newCustomerQuota.service';
import {
  NEW_CUSTOMER_QUOTA_DEFAULT_FILTER_TAB,
  resolveQuotaHealth,
} from './newCustomerQuota.constants';
import type {
  NewCustomerQuotaFilterTab,
  NewCustomerQuotaStats,
  NewCustomerQuotaStore,
} from './newCustomerQuota.types';

interface UseNewCustomerQuotaPageReturn {
  stores: NewCustomerQuotaStore[];
  filteredStores: NewCustomerQuotaStore[];
  pickerStores: NewCustomerQuotaStore[];
  activeTab: NewCustomerQuotaFilterTab;
  searchQuery: string;
  pickerSearchQuery: string;
  targetStore: NewCustomerQuotaStore | null;
  showStorePicker: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  errorMessage: string;
  stats: NewCustomerQuotaStats;
  setActiveTab: (tab: NewCustomerQuotaFilterTab) => void;
  setSearchQuery: (value: string) => void;
  setPickerSearchQuery: (value: string) => void;
  openStorePicker: () => void;
  closeStorePicker: () => void;
  handleOpenAdjust: (store: NewCustomerQuotaStore) => void;
  handleCloseAdjust: () => void;
  handleConfirmAdjust: (storeId: string, delta: number, reason: string) => Promise<void>;
  retryLoad: () => void;
}

interface IndexedStore {
  store: NewCustomerQuotaStore;
  searchText: string;
}

/** 健康度口径复用列表与 Tab 的同一判定：未发放不计入「已耗尽」 */
const buildStats = (stores: NewCustomerQuotaStore[]): NewCustomerQuotaStats => {
  let totalRemaining = 0;
  let warningCount = 0;
  let exhaustedCount = 0;

  for (const store of stores) {
    totalRemaining += safeNum(store.remaining);

    const health = resolveQuotaHealth(store);
    if (health === 'exhausted') {
      exhaustedCount += 1;
    } else if (health === 'warning') {
      warningCount += 1;
    }
  }

  return {
    storeCount: stores.length,
    totalRemaining,
    warningCount,
    exhaustedCount,
  };
};

/** 搜索文本：主账号昵称 / 手机号 / 门店名 都可命中 */
const buildStoreSearchText = (store: NewCustomerQuotaStore): string => (
  `${store.ownerName} ${store.ownerPhone} ${store.storeName}`.toLowerCase()
);

export const useNewCustomerQuotaPage = (): UseNewCustomerQuotaPageReturn => {
  const [stores, setStores] = useState<NewCustomerQuotaStore[]>([]);
  const [activeTab, setActiveTab] = useState<NewCustomerQuotaFilterTab>(NEW_CUSTOMER_QUOTA_DEFAULT_FILTER_TAB);
  const [searchQuery, setSearchQuery] = useState('');
  const [pickerSearchQuery, setPickerSearchQuery] = useState('');
  const [targetStore, setTargetStore] = useState<NewCustomerQuotaStore | null>(null);
  const [showStorePicker, setShowStorePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const requestIdRef = useRef(0);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const deferredPickerSearchQuery = useDeferredValue(pickerSearchQuery);

  const indexedStores = useMemo<IndexedStore[]>(() => stores.map((store) => ({
    store,
    searchText: buildStoreSearchText(store),
  })), [stores]);

  // 统计口径完全由门店列表推导，不额外维护一份 state，避免两处数据不同步
  const stats = useMemo<NewCustomerQuotaStats>(() => buildStats(stores), [stores]);

  // 首屏加载态由 useState(true) 承担，这里不再同步 setIsLoading(true)：
  // 效果体内同步 setState 会触发级联渲染（react-hooks/set-state-in-effect）。
  const loadPageData = useCallback(async (): Promise<void> => {
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    try {
      const nextStores = await fetchNewCustomerQuotaStores();
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setStores(nextStores);
      setErrorMessage('');
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setStores([]);
      setErrorMessage(error instanceof Error ? error.message : '获取新客额度数据失败');
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // 首屏自动加载：放进宏任务，避免在 effect 体内同步 setState 触发级联渲染
  // （与 memberList 的取数入口同一惯用法）。
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadPageData();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadPageData]);

  const filteredStores = useMemo(() => {
    let nextStores = indexedStores;

    if (activeTab === 'warning') {
      nextStores = nextStores.filter(({ store }) => resolveQuotaHealth(store) === 'warning');
    } else if (activeTab === 'exhausted') {
      // 只统计「真的用完了」的门店：从未发放过额度（remaining=0 且 consumed=0）不算
      nextStores = nextStores.filter(({ store }) => resolveQuotaHealth(store) === 'exhausted');
    }

    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
    if (normalizedQuery) {
      nextStores = nextStores.filter(({ searchText }) => searchText.includes(normalizedQuery));
    }

    return nextStores.map(({ store }) => store);
  }, [activeTab, deferredSearchQuery, indexedStores]);

  const pickerStores = useMemo(() => {
    const normalizedQuery = deferredPickerSearchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return stores;
    }

    return indexedStores
      .filter(({ searchText }) => searchText.includes(normalizedQuery))
      .map(({ store }) => store);
  }, [deferredPickerSearchQuery, indexedStores, stores]);

  const openStorePicker = useCallback((): void => {
    if (isSubmitting) {
      return;
    }
    setPickerSearchQuery('');
    setShowStorePicker(true);
  }, [isSubmitting]);

  const closeStorePicker = useCallback((): void => {
    if (isSubmitting) {
      return;
    }
    setPickerSearchQuery('');
    setShowStorePicker(false);
  }, [isSubmitting]);

  const handleOpenAdjust = useCallback((store: NewCustomerQuotaStore): void => {
    if (isSubmitting) {
      return;
    }
    setTargetStore(store);
    setPickerSearchQuery('');
    setShowStorePicker(false);
  }, [isSubmitting]);

  const handleCloseAdjust = useCallback((): void => {
    if (isSubmitting) {
      return;
    }
    setTargetStore(null);
  }, [isSubmitting]);

  const handleConfirmAdjust = useCallback(async (
    storeId: string,
    delta: number,
    reason: string,
  ): Promise<void> => {
    if (isSubmitting || delta === 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedStore = await submitNewCustomerQuotaAdjust(storeId, delta, reason);

      // 提交成功后重新拉取最新列表，确保余额与统计口径一致
      try {
        const nextStores = await fetchNewCustomerQuotaStores();
        setStores(nextStores);
      } catch {
        // 后端刷新失败时退回乐观更新：只在拿到有效快照时回写，
        // 否则宁可保留旧值，也不能把兜底的 0 当成真实余额显示出来。
        if (updatedStore) {
          setStores((prevStores) => prevStores.map((store) => (
            store.id === storeId
              ? {
                  ...store,
                  remaining: safeNum(updatedStore.remaining),
                  consumed: safeNum(updatedStore.consumed),
                  updatedAt: Date.now(),
                }
              : store
          )));
        }
      }

      setTargetStore(null);
      showToast({ type: 'success', message: delta > 0 ? '新客额度已发放' : '新客额度已回收' });
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : '调整新客额度失败，请稍后重试',
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting]);

  const retryLoad = useCallback((): void => {
    setIsLoading(true);
    void loadPageData();
  }, [loadPageData]);

  return {
    stores,
    filteredStores,
    pickerStores,
    activeTab,
    searchQuery,
    pickerSearchQuery,
    targetStore,
    showStorePicker,
    isLoading,
    isSubmitting,
    errorMessage,
    stats,
    setActiveTab,
    setSearchQuery,
    setPickerSearchQuery,
    openStorePicker,
    closeStorePicker,
    handleOpenAdjust,
    handleCloseAdjust,
    handleConfirmAdjust,
    retryLoad,
  };
};
