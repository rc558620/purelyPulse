// 群发短信页面状态与交互管理 hook：门店短信余额一览（list）与单门店变动记录（detail）双视图。
//
// 列表走短信账户分页（keyword + 余额健康度 Tab），详情走钱包流水真分页（门店 + 流水 Tab），
// 两套条件都在本层持有，数据由 useSmsAccountList / useSmsWalletLogList 各自按下发条件取数。
import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { showToast } from '@components/ui/feedback/Toast';
import { safeNum } from '@utils/utils';
import { SMS_BROADCAST_DEFAULT_FILTER_TAB, SMS_BROADCAST_LOG_DEFAULT_TAB } from './smsBroadcast.constants';
import { submitSmsBalanceGrant } from './smsBroadcast.service';
import { useSmsAccountList } from './useSmsAccountList';
import { useSmsAccountPicker } from './useSmsAccountPicker';
import { useSmsWalletLogList } from './useSmsWalletLogList';
import type {
  SmsAccount,
  SmsBroadcastFilterTab,
  SmsBroadcastLogTab,
  SmsBroadcastStats,
  SmsWalletLog,
  SmsWalletLogStats,
} from './smsBroadcast.types';

/** 页面视图：list = 门店短信余额一览，detail = 单门店钱包变动记录。 */
export type SmsBroadcastViewMode = 'list' | 'detail';

interface UseSmsBroadcastPageReturn {
  /** 当前视图 */
  viewMode: SmsBroadcastViewMode;
  /** 详情视图的门店（list 视图为 null） */
  selectedStore: SmsAccount | null;
  /** 已加载的门店列表（分页累积，已按当前条件由后端过滤） */
  stores: SmsAccount[];
  /** 后端统计概览 */
  stats: SmsBroadcastStats;
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
  activeTab: SmsBroadcastFilterTab;
  /** 主列表搜索词 */
  searchQuery: string;
  /** 选店弹层搜索词 */
  pickerSearchQuery: string;
  /** 选店弹层门店列表（分页累积） */
  pickerStores: SmsAccount[];
  /** 选店弹层是否还有下一页 */
  pickerHasMore: boolean;
  /** 选店弹层搜索请求中 */
  pickerIsLoading: boolean;
  /** 选店弹层加载更多请求中 */
  pickerIsLoadingMore: boolean;
  /** 选店弹层错误文案 */
  pickerErrorMessage: string;
  /** 选店弹层当前调整目标 */
  targetStore: SmsAccount | null;
  /** 选店弹层是否可见 */
  showStorePicker: boolean;
  /** 变动记录 Tab */
  logTab: SmsBroadcastLogTab;
  /** 已加载的变动记录（分页累积） */
  logs: SmsWalletLog[];
  /** 变动记录统计概览（与列表同口径） */
  logStats: SmsWalletLogStats;
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
  setActiveTab: (tab: SmsBroadcastFilterTab) => void;
  setSearchQuery: (value: string) => void;
  setPickerSearchQuery: (value: string) => void;
  setLogTab: (tab: SmsBroadcastLogTab) => void;
  /** 点击门店行：进入单门店变动记录视图 */
  openStoreDetail: (store: SmsAccount) => void;
  /** 从详情返回门店一览 */
  backToStoreList: () => void;
  openStorePicker: () => void;
  closeStorePicker: () => void;
  handleOpenAdjust: (store: SmsAccount) => void;
  handleCloseAdjust: () => void;
  handleConfirmAdjust: (storeId: string, amountFen: number, reason: string) => Promise<void>;
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

export const useSmsBroadcastPage = (): UseSmsBroadcastPageReturn => {
  const [viewMode, setViewMode] = useState<SmsBroadcastViewMode>('list');
  const [selectedStore, setSelectedStore] = useState<SmsAccount | null>(null);
  const [activeTab, setActiveTab] = useState<SmsBroadcastFilterTab>(SMS_BROADCAST_DEFAULT_FILTER_TAB);
  const [searchQuery, setSearchQuery] = useState('');
  const [pickerSearchQuery, setPickerSearchQuery] = useState('');
  const [targetStore, setTargetStore] = useState<SmsAccount | null>(null);
  const [showStorePicker, setShowStorePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshSeq, setRefreshSeq] = useState(0);
  const [logTab, setLogTab] = useState<SmsBroadcastLogTab>(SMS_BROADCAST_LOG_DEFAULT_TAB);
  const [logRefreshSeq, setLogRefreshSeq] = useState(0);

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
  } = useSmsAccountList(listQuery);

  const {
    stores: pickerStores,
    hasMore: pickerHasMore,
    isLoading: pickerIsLoading,
    isLoadingMore: pickerIsLoadingMore,
    errorMessage: pickerErrorMessage,
    loadMoreStores: loadMorePickerStores,
    retryLoad: retryPickerLoad,
  } = useSmsAccountPicker(deferredPickerKeyword.trim(), showStorePicker);

  // 变动记录查询条件：门店一览视图（无选中门店）不取数。
  // 只依赖门店 ID 而不是整个门店对象：赠送后头部余额快照会更新，
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
  } = useSmsWalletLogList(logQuery);

  // ─── 视图切换 ────────────────────────────────────────────────────
  const openStoreDetail = useCallback((store: SmsAccount): void => {
    setSelectedStore(store);
    // 每次进入详情都回到「全部」：避免沿用上一家门店的 Tab 造成误读
    setLogTab(SMS_BROADCAST_LOG_DEFAULT_TAB);
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

  const handleOpenAdjust = useCallback((store: SmsAccount): void => {
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

  /** 赠送成功后同步详情头部余额：重拉完成前不能停留旧值，权威口径仍以刷新结果为准 */
  const applyStoreSnapshot = useCallback((storeId: string, snapshot: SmsAccount): void => {
    setSelectedStore((previousStore) => (
      previousStore && previousStore.id === storeId ? { ...snapshot } : previousStore
    ));
  }, []);

  const handleConfirmAdjust = useCallback(async (
    storeId: string,
    amountFen: number,
    reason: string,
  ): Promise<void> => {
    if (isSubmitting || safeNum(amountFen) === 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedAccount = await submitSmsBalanceGrant(storeId, amountFen, reason);

      // 提交成功后刷新第 1 页，让余额与后端统计口径保持一致
      // （replace 模式失败时不抛错：列表保持旧数据并进入错误态）。
      await refreshStores();

      // 无论刷新成败，都用后端返回的快照校准当前行：
      // 刷新失败时这就是唯一的余额修正来源，避免把旧余额继续展示给运营。
      if (updatedAccount) {
        patchStore(storeId, updatedAccount);
        applyStoreSnapshot(storeId, updatedAccount);
      }

      // 刷新只回第 1 页：翻过页时必须回顶，否则会出现「列表被换成第 1 页但滚动在中段」，
      // 并在底部触发连锁自动加载，运营也看不到刚调整的那一行。
      setRefreshSeq((previousSeq) => previousSeq + 1);
      setTargetStore(null);
      showToast({ type: 'success', message: safeNum(amountFen) > 0 ? '短信额度已赠送' : '短信额度已回收' });

      // 详情视图：变动记录同样要重拉，否则刚写的 grant / admin_adjust 不会出现在列表里
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
        message: error instanceof Error ? error.message : '调整短信余额失败，请稍后重试',
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [applyStoreSnapshot, isSubmitting, patchStore, refreshLogs, refreshStores, selectedStoreId]);

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
