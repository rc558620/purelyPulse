// 新客额度页面状态与交互管理 hook：组合列表分页、选店弹层与额度调整流程。
// 搜索 / 筛选条件在本层持有，列表数据由 useQuotaStoreList 按条件分页拉取。
import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { showToast } from '@components/ui/feedback/Toast';
import { safeNum } from '@utils/utils';
import {
  NEW_CUSTOMER_QUOTA_DEFAULT_FILTER_TAB,
} from './newCustomerQuota.constants';
import { submitNewCustomerQuotaAdjust } from './newCustomerQuota.service';
import { useQuotaStoreList } from './useQuotaStoreList';
import { useQuotaStorePicker } from './useQuotaStorePicker';
import type {
  NewCustomerQuotaFilterTab,
  NewCustomerQuotaStats,
  NewCustomerQuotaStore,
} from './newCustomerQuota.types';

interface UseNewCustomerQuotaPageReturn {
  /** 已加载的门店列表（分页累积，已按当前条件由后端过滤） */
  stores: NewCustomerQuotaStore[];
  /** 后端统计概览 */
  stats: NewCustomerQuotaStats;
  /** 当前筛选条件命中的门店总数（含健康度 Tab），列表头「N 家」的事实源 */
  total: number;
  /** 是否还有下一页 */
  hasMore: boolean;
  /** 首屏加载中 */
  isLoading: boolean;
  /** 非首屏刷新中 */
  isRefreshing: boolean;
  /** 列表错误文案 */
  errorMessage: string;
  /** 提交调整中 */
  isSubmitting: boolean;
  /** 当前筛选 Tab */
  activeTab: NewCustomerQuotaFilterTab;
  /** 主列表搜索词 */
  searchQuery: string;
  /** 选店弹层搜索词 */
  pickerSearchQuery: string;
  /** 选店弹层门店列表（分页累积） */
  pickerStores: NewCustomerQuotaStore[];
  /** 选店弹层是否还有下一页 */
  pickerHasMore: boolean;
  /** 选店弹层搜索请求中 */
  pickerIsLoading: boolean;
  /** 选店弹层加载更多请求中 */
  pickerIsLoadingMore: boolean;
  /** 额度调整后的刷新序号：变化即触发列表回顶，避免刷新成第 1 页后停在中段 */
  refreshSeq: number;
  /** 选店弹层错误文案 */
  pickerErrorMessage: string;
  /** 选店弹层当前调整目标 */
  targetStore: NewCustomerQuotaStore | null;
  /** 选店弹层是否可见 */
  showStorePicker: boolean;
  setActiveTab: (tab: NewCustomerQuotaFilterTab) => void;
  setSearchQuery: (value: string) => void;
  setPickerSearchQuery: (value: string) => void;
  openStorePicker: () => void;
  closeStorePicker: () => void;
  handleOpenAdjust: (store: NewCustomerQuotaStore) => void;
  handleCloseAdjust: () => void;
  handleConfirmAdjust: (storeId: string, delta: number, reason: string) => Promise<void>;
  /** 下拉刷新（供 PullRefreshLoadMore 等待完成） */
  refreshStores: () => Promise<void>;
  /** 上拉加载更多（供 PullRefreshLoadMore 等待完成） */
  loadMoreStores: () => Promise<void>;
  /** 选店弹层加载更多（供弹层按钮等待完成） */
  loadMorePickerStores: () => Promise<void>;
  retryLoad: () => void;
  retryPickerLoad: () => void;
}

export const useNewCustomerQuotaPage = (): UseNewCustomerQuotaPageReturn => {
  const [activeTab, setActiveTab] = useState<NewCustomerQuotaFilterTab>(NEW_CUSTOMER_QUOTA_DEFAULT_FILTER_TAB);
  const [searchQuery, setSearchQuery] = useState('');
  const [pickerSearchQuery, setPickerSearchQuery] = useState('');
  const [targetStore, setTargetStore] = useState<NewCustomerQuotaStore | null>(null);
  const [showStorePicker, setShowStorePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshSeq, setRefreshSeq] = useState(0);

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const deferredPickerKeyword = useDeferredValue(pickerSearchQuery);

  // 列表查询条件：搜索词 + 健康度 Tab，全部下推给后端过滤
  const listQuery = useMemo(() => ({
    keyword: deferredSearchQuery.trim(),
    health: activeTab === 'all' ? null : activeTab,
  }), [activeTab, deferredSearchQuery]);

  const {
    stores,
    stats,
    total,
    hasMore,
    isLoading,
    isRefreshing,
    errorMessage,
    refreshStores,
    loadMoreStores,
    patchStore,
    retryLoad,
  } = useQuotaStoreList(listQuery);

  const {
    stores: pickerStores,
    hasMore: pickerHasMore,
    isLoading: pickerIsLoading,
    isLoadingMore: pickerIsLoadingMore,
    errorMessage: pickerErrorMessage,
    loadMoreStores: loadMorePickerStores,
    retryLoad: retryPickerLoad,
  } = useQuotaStorePicker(deferredPickerKeyword.trim(), showStorePicker);

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
    if (isSubmitting || safeNum(delta) === 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedStore = await submitNewCustomerQuotaAdjust(storeId, delta, reason);

      // 提交成功后刷新第 1 页，让余额与后端统计口径保持一致
      // （replace 模式失败时不抛错：列表保持旧数据并进入错误态）。
      await refreshStores();

      // 无论刷新成败，都用后端返回的快照校准当前行：
      // 刷新失败时这就是唯一的余额修正来源，避免把旧余额继续展示给运营。
      if (updatedStore) {
        patchStore(storeId, updatedStore.remaining, updatedStore.consumed);
      }

      // 刷新只回第 1 页：翻过页时必须回顶，否则会出现「列表被换成第 1 页但滚动在中段」
      // 并在底部触发连锁自动加载，运营也看不到刚调整的那一行。
      setRefreshSeq((previousSeq) => previousSeq + 1);
      setTargetStore(null);
      showToast({ type: 'success', message: safeNum(delta) > 0 ? '新客额度已发放' : '新客额度已回收' });
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : '调整新客额度失败，请稍后重试',
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, patchStore, refreshStores]);

  return {
    stores,
    stats,
    total,
    hasMore,
    isLoading,
    isRefreshing,
    errorMessage,
    isSubmitting,
    activeTab,
    searchQuery,
    pickerSearchQuery,
    pickerStores,
    pickerHasMore,
    pickerIsLoading,
    pickerIsLoadingMore,
    pickerErrorMessage,
    targetStore,
    showStorePicker,
    refreshSeq,
    setActiveTab,
    setSearchQuery,
    setPickerSearchQuery,
    openStorePicker,
    closeStorePicker,
    handleOpenAdjust,
    handleCloseAdjust,
    handleConfirmAdjust,
    refreshStores,
    loadMoreStores,
    loadMorePickerStores,
    retryLoad,
    retryPickerLoad,
  };
};
