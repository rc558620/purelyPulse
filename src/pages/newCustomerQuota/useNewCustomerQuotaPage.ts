// 新客额度页面状态与交互管理 hook：门店额度一览（list）与单门店变动记录（detail）双视图。
//
// 列表走门店额度分页（keyword + 健康度 Tab），详情走变动记录真分页（门店 + 记录 Tab），
// 两套条件都在本层持有，数据由 useQuotaStoreList / useQuotaLogList 各自按下发条件取数。
import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { showToast } from '@components/ui/feedback/Toast';
import { safeNum } from '@utils/utils';
import {
  NEW_CUSTOMER_QUOTA_DEFAULT_FILTER_TAB,
  NEW_CUSTOMER_QUOTA_LOG_DEFAULT_TAB,
} from './newCustomerQuota.constants';
import { submitNewCustomerQuotaAdjust } from './newCustomerQuota.service';
import { useQuotaLogList } from './useQuotaLogList';
import { useQuotaStoreList } from './useQuotaStoreList';
import { useQuotaStorePicker } from './useQuotaStorePicker';
import type {
  NewCustomerQuotaFilterTab,
  NewCustomerQuotaLog,
  NewCustomerQuotaLogStats,
  NewCustomerQuotaLogTab,
  NewCustomerQuotaStats,
  NewCustomerQuotaStore,
} from './newCustomerQuota.types';

/** 页面视图：list = 门店额度一览，detail = 单门店额度变动记录。 */
export type NewCustomerQuotaViewMode = 'list' | 'detail';

interface UseNewCustomerQuotaPageReturn {
  /** 当前视图 */
  viewMode: NewCustomerQuotaViewMode;
  /** 详情视图的门店（list 视图为 null） */
  selectedStore: NewCustomerQuotaStore | null;
  /** 已加载的门店列表（分页累积，已按当前条件由后端过滤） */
  stores: NewCustomerQuotaStore[];
  /** 门店额度统计概览（只吃 keyword，不随健康度 Tab 变化） */
  stats: NewCustomerQuotaStats;
  /** 当前筛选条件命中的门店总数（含健康度 Tab），列表头「N 家」的事实源 */
  total: number;
  /** 门店列表是否还有下一页 */
  hasMore: boolean;
  /** 门店列表首屏加载中 */
  isLoading: boolean;
  /** 门店列表非首屏刷新中 */
  isRefreshing: boolean;
  /** 门店列表错误文案 */
  errorMessage: string;
  /** 提交调整中 */
  isSubmitting: boolean;
  /** 门店列表健康度 Tab */
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
  /** 选店弹层错误文案 */
  pickerErrorMessage: string;
  /** 当前调整目标 */
  targetStore: NewCustomerQuotaStore | null;
  /** 选店弹层是否可见 */
  showStorePicker: boolean;
  /** 门店列表刷新序号：变化即触发列表回顶 */
  refreshSeq: number;
  /** 变动记录 Tab */
  logTab: NewCustomerQuotaLogTab;
  /** 已加载的变动记录（分页累积） */
  logs: NewCustomerQuotaLog[];
  /** 变动记录统计概览（门店全量口径） */
  logStats: NewCustomerQuotaLogStats;
  /** 当前 Tab 下的变动记录总数 */
  logTotal: number;
  /** 变动记录是否还有下一页 */
  logsHasMore: boolean;
  /** 变动记录首屏加载中 */
  isLogsInitialLoading: boolean;
  /** 变动记录下拉刷新中 */
  isLogsRefreshing: boolean;
  /** 变动记录加载更多中 */
  isLogsLoadingMore: boolean;
  /** 变动记录错误文案 */
  logsErrorMessage: string;
  /** 详情视图回顶信号：值变化即触发容器回到顶部 */
  detailScrollToTopTrigger: string;
  /** 列表视图回顶信号：搜索 / Tab / 调整后回到列表顶部 */
  listScrollToTopTrigger: string;
  setActiveTab: (tab: NewCustomerQuotaFilterTab) => void;
  setSearchQuery: (value: string) => void;
  setPickerSearchQuery: (value: string) => void;
  setLogTab: (tab: NewCustomerQuotaLogTab) => void;
  /** 点击门店行：进入单门店变动记录视图 */
  openStoreDetail: (store: NewCustomerQuotaStore) => void;
  /** 从详情返回门店一览 */
  backToStoreList: () => void;
  openStorePicker: () => void;
  closeStorePicker: () => void;
  handleOpenAdjust: (store: NewCustomerQuotaStore) => void;
  handleCloseAdjust: () => void;
  handleConfirmAdjust: (storeId: string, delta: number, reason: string) => Promise<void>;
  /** 下拉刷新门店列表（供 PullRefreshLoadMore 等待完成） */
  refreshStores: () => Promise<void>;
  /** 上拉加载更多门店（失败时抛错，由容器呈现失败态） */
  loadMoreStores: () => Promise<void>;
  /** 选店弹层加载更多（供弹层按钮等待完成） */
  loadMorePickerStores: () => Promise<void>;
  /** 下拉刷新变动记录（供 PullRefreshLoadMore 等待完成） */
  refreshLogs: () => Promise<void>;
  /** 上拉加载更多变动记录（失败时抛错，由容器呈现失败态） */
  loadMoreLogs: () => Promise<void>;
  retryLoad: () => void;
  retryPickerLoad: () => void;
  retryLoadLogs: () => void;
}

export const useNewCustomerQuotaPage = (): UseNewCustomerQuotaPageReturn => {
  const [viewMode, setViewMode] = useState<NewCustomerQuotaViewMode>('list');
  const [selectedStore, setSelectedStore] = useState<NewCustomerQuotaStore | null>(null);
  const [activeTab, setActiveTab] = useState<NewCustomerQuotaFilterTab>(NEW_CUSTOMER_QUOTA_DEFAULT_FILTER_TAB);
  const [searchQuery, setSearchQuery] = useState('');
  const [pickerSearchQuery, setPickerSearchQuery] = useState('');
  const [targetStore, setTargetStore] = useState<NewCustomerQuotaStore | null>(null);
  const [showStorePicker, setShowStorePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshSeq, setRefreshSeq] = useState(0);
  const [logTab, setLogTab] = useState<NewCustomerQuotaLogTab>(NEW_CUSTOMER_QUOTA_LOG_DEFAULT_TAB);
  const [logRefreshSeq, setLogRefreshSeq] = useState(0);

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const deferredPickerKeyword = useDeferredValue(pickerSearchQuery);

  // 列表查询条件：搜索词 + 健康度 Tab，全部下推给后端过滤
  const listQuery = useMemo(
    () => ({
      keyword: deferredSearchQuery.trim(),
      health: activeTab === 'all' ? null : activeTab,
    }),
    [activeTab, deferredSearchQuery],
  );

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

  // 变动记录查询条件：门店一览视图（无选中门店）不取数。
  // 只依赖门店 ID 而不是整个门店对象：调整额度后头部余额快照会更新，
  // 若依赖对象引用会连带把变动记录当成「换了条件」而多打一次首屏请求。
  const selectedStoreId = selectedStore?.id ?? '';
  const logQuery = useMemo(
    () => (selectedStoreId ? { storeId: selectedStoreId, tab: logTab } : null),
    [logTab, selectedStoreId],
  );

  const {
    logs,
    stats: logStats,
    total: logTotal,
    hasMore: logsHasMore,
    isInitialLoading: isLogsInitialLoading,
    isRefreshing: isLogsRefreshing,
    isLoadingMore: isLogsLoadingMore,
    errorMessage: logsErrorMessage,
    refreshLogs,
    loadMoreLogs,
    retryLoad: retryLoadLogs,
  } = useQuotaLogList(logQuery);

  // ─── 视图切换 ────────────────────────────────────────────────────
  const openStoreDetail = useCallback((store: NewCustomerQuotaStore): void => {
    setSelectedStore(store);
    // 每次进入详情都回到「全部」：避免沿用上一家门店的 Tab 造成误读
    setLogTab(NEW_CUSTOMER_QUOTA_LOG_DEFAULT_TAB);
    setViewMode('detail');
  }, []);

  const backToStoreList = useCallback((): void => {
    setSelectedStore(null);
    setViewMode('list');
  }, []);

  // ─── 选店弹层与额度调整 ──────────────────────────────────────────
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

  const handleOpenAdjust = useCallback(
    (store: NewCustomerQuotaStore): void => {
      if (isSubmitting) {
        return;
      }
      setTargetStore(store);
      setPickerSearchQuery('');
      setShowStorePicker(false);
    },
    [isSubmitting],
  );

  const handleCloseAdjust = useCallback((): void => {
    if (isSubmitting) {
      return;
    }
    setTargetStore(null);
  }, [isSubmitting]);

  /** 调整成功后同步详情头部余额：重拉完成前不能停留旧值，权威口径仍以刷新结果为准 */
  const applyStoreSnapshot = useCallback((storeId: string, remaining: number, consumed: number): void => {
    setSelectedStore((previousStore) =>
      previousStore && previousStore.id === storeId
        ? {
            ...previousStore,
            remaining: safeNum(remaining),
            consumed: safeNum(consumed),
          }
        : previousStore,
    );
  }, []);

  const handleConfirmAdjust = useCallback(
    async (storeId: string, delta: number, reason: string): Promise<void> => {
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
          applyStoreSnapshot(storeId, updatedStore.remaining, updatedStore.consumed);
        }

        // 刷新只回第 1 页：翻过页时必须回顶，否则会出现「列表被换成第 1 页但滚动在中段」
        setRefreshSeq((previousSeq) => previousSeq + 1);
        setTargetStore(null);
        showToast({
          type: 'success',
          message: delta > 0 ? '新客额度已发放' : '新客额度已回收',
        });

        // 详情视图：变动记录同样要重拉，否则刚写的 admin_adjust 不会出现在列表里
        if (selectedStoreId === storeId) {
          setLogRefreshSeq((previousSeq) => previousSeq + 1);
          try {
            await refreshLogs();
          } catch {
            showToast({
              type: 'error',
              message: '调整已生效，记录刷新失败，请下拉重试',
            });
          }
        }
      } catch (error) {
        showToast({
          type: 'error',
          message: error instanceof Error ? error.message : '调整新客额度失败，请稍后重试',
        });
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [applyStoreSnapshot, isSubmitting, patchStore, refreshLogs, refreshStores, selectedStoreId],
  );

  return {
    viewMode,
    selectedStore,
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
    logTab,
    logs,
    logStats,
    logTotal,
    logsHasMore,
    isLogsInitialLoading,
    isLogsRefreshing,
    isLogsLoadingMore,
    logsErrorMessage,
    detailScrollToTopTrigger: `${selectedStore?.id ?? ''}__${logTab}__${logRefreshSeq}`,
    listScrollToTopTrigger: `${activeTab}__${deferredSearchQuery}__${refreshSeq}`,
    setActiveTab,
    setSearchQuery,
    setPickerSearchQuery,
    setLogTab,
    openStoreDetail,
    backToStoreList,
    openStorePicker,
    closeStorePicker,
    handleOpenAdjust,
    handleCloseAdjust,
    handleConfirmAdjust,
    refreshStores,
    loadMoreStores,
    loadMorePickerStores,
    refreshLogs,
    loadMoreLogs,
    retryLoad,
    retryPickerLoad,
    retryLoadLogs,
  };
};
