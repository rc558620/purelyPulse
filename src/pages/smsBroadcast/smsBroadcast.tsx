// 群发短信管理页面主体：门店短信余额一览（list）与单门店钱包变动记录（detail）共用一个骨架。
//
// 滚动为什么交给 PullRefreshLoadMore：
// 下拉刷新组件要求自己的滚动容器有确定高度（它按 height:100% 算下拉位移），
// 因此页面容器只占满屏、不滚动，滚动条唯一来源就是这个视口。
//
// 固定区（视口外）放什么由视图决定：
// - list：统计 + 搜索 / 健康度 Tab 固定，门店余额一览挂在视口里做真分页；
// - detail：门店头部 + 变动记录统计 + 流水 Tab 固定，变动记录挂在视口里做真分页。
import React, { useCallback } from 'react';
import PageHeader from '@components/ui/layout/PageHeader';
import PullRefreshLoadMore from '@components/ui/layout/PullRefreshLoadMore/PullRefreshLoadMore';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import SmsBroadcastAccountList from './components/SmsBroadcastAccountList/SmsBroadcastAccountList';
import SmsBroadcastAccountPicker from './components/SmsBroadcastAccountPicker/SmsBroadcastAccountPicker';
import SmsBroadcastDetailHeader from './components/SmsBroadcastDetailHeader/SmsBroadcastDetailHeader';
import SmsBroadcastFilterBar from './components/SmsBroadcastFilterBar/SmsBroadcastFilterBar';
import { IconSmsBroadcastAdd } from './components/SmsBroadcastIcons/SmsBroadcastIcons';
import SmsBroadcastLogFilterBar from './components/SmsBroadcastLogFilterBar/SmsBroadcastLogFilterBar';
import SmsBroadcastLogStatsOverview from './components/SmsBroadcastLogStatsOverview/SmsBroadcastLogStatsOverview';
import SmsBroadcastStatsOverview from './components/SmsBroadcastStatsOverview/SmsBroadcastStatsOverview';
import SmsBroadcastWalletLogList from './components/SmsBroadcastWalletLogList/SmsBroadcastWalletLogList';
import GrantSmsBalanceModal from './components/GrantSmsBalanceModal/GrantSmsBalanceModal';
import { useSmsBroadcastPage } from './useSmsBroadcastPage';
import styles from './smsBroadcast.module.less';

const SmsBroadcast: React.FC = () => {
  const navigate = useAnimatedNavigate();
  const {
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
    detailScrollToTopTrigger,
    listScrollToTopTrigger,
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
  } = useSmsBroadcastPage();

  const isDetailView = viewMode === 'detail' && Boolean(selectedStore);

  // 首屏请求还没回来时忽略下拉：并发两个「第 1 页查询」会让竞态保护互相覆盖
  const handleRefreshStores = useCallback(async (): Promise<void> => {
    if (isLoading) {
      return;
    }

    await refreshStores();
  }, [isLoading, refreshStores]);

  const handleLoadMoreStores = useCallback(async (): Promise<void> => {
    await loadMoreStores();
  }, [loadMoreStores]);

  const handleLoadMorePickerStores = useCallback(async (): Promise<void> => {
    await loadMorePickerStores();
  }, [loadMorePickerStores]);

  const handleAdjustSelectedStore = useCallback((): void => {
    if (selectedStore) {
      handleOpenAdjust(selectedStore);
    }
  }, [handleOpenAdjust, selectedStore]);

  // 与 hasMore 解耦：hasMore 为 false 时也要挂上 onLoadMore，否则底部「没有更多」文案不渲染。
  // 首屏 / 刷新中 / 失败态不挂：这三个态下底部文案会与列表内的加载 / 失败态自相矛盾，
  // 且刷新与加载更多共用同一个取消信号，并发会互相作废。
  const canLoadMoreStores = !isLoading && !isRefreshing && !errorMessage;
  const canLoadMoreLogs = !isLogsInitialLoading && !isLogsRefreshing && !logsErrorMessage;

  return (
    <div className={styles.pageContainer}>
      <PageHeader
        title={isDetailView && selectedStore ? `${selectedStore.ownerName} · 变动记录` : '群发短信管理'}
        onBack={isDetailView ? backToStoreList : () => navigate(-1)}
        rightExtra={(
          <button
            type="button"
            className={styles.adjustEntryBtn}
            onClick={isDetailView ? handleAdjustSelectedStore : openStorePicker}
            aria-label={isDetailView ? '调整当前门店的短信余额' : '赠送门店短信额度'}
            disabled={isSubmitting}
          >
            <IconSmsBroadcastAdd />
            赠送额度
          </button>
        )}
      />

      {/* 内容总装层：宽度约束在这一层，让刷新视口的滚动条与回顶按钮贴内容区右缘 */}
      <main className={styles.contentWrapper}>
        {isDetailView && selectedStore ? (
          <>
            <div className={styles.fixedShell}>
              <SmsBroadcastDetailHeader
                account={selectedStore}
                isSubmitting={isSubmitting}
                onAdjust={handleOpenAdjust}
              />
              {/* 统计与列表同源：后端按当前 Tab 的完整结果集聚合（不吃分页） */}
              <SmsBroadcastLogStatsOverview stats={logStats} />
              <SmsBroadcastLogFilterBar activeTab={logTab} setActiveTab={setLogTab} />
            </div>

            <PullRefreshLoadMore
              className={styles.refreshShell}
              contentClassName={styles.refreshContent}
              onRefresh={refreshLogs}
              onLoadMore={canLoadMoreLogs ? loadMoreLogs : undefined}
              hasMore={logsHasMore}
              scrollToTopTrigger={detailScrollToTopTrigger}
              refreshErrorText="刷新失败，请下拉重试"
              loadMoreErrorText="加载更多失败"
              allLoadedText="没有更多记录了"
            >
              <SmsBroadcastWalletLogList
                logs={logs}
                totalCount={logTotal}
                isInitialLoading={isLogsInitialLoading}
                isLoadingMore={isLogsLoadingMore}
                errorMessage={logsErrorMessage}
                onRetry={retryLoadLogs}
              />
            </PullRefreshLoadMore>
          </>
        ) : (
          <>
            {/* 统计 + 搜索 / Tab 固定区：在刷新视口之外，与列表卡之间的留白即视口顶部间距 */}
            <div className={styles.listHeadShell}>
              <SmsBroadcastStatsOverview stats={stats} />
              <SmsBroadcastFilterBar
                activeTab={activeTab}
                searchQuery={searchQuery}
                setActiveTab={setActiveTab}
                setSearchQuery={setSearchQuery}
              />
            </div>

            {/* 列表滚动视口：下拉刷新 / 加载更多 / 内容滚动都发生在这里 */}
            <PullRefreshLoadMore
              className={styles.refreshShell}
              contentClassName={styles.refreshContent}
              onRefresh={handleRefreshStores}
              onLoadMore={canLoadMoreStores ? handleLoadMoreStores : undefined}
              hasMore={hasMore}
              scrollToTopTrigger={listScrollToTopTrigger}
              refreshErrorText="刷新失败，请下拉重试"
              loadMoreErrorText="加载更多失败"
              allLoadedText="没有更多门店了"
            >
              <SmsBroadcastAccountList
                isSubmitting={isSubmitting}
                stores={stores}
                totalCount={total}
                isLoading={isLoading}
                isRefreshing={isRefreshing}
                errorMessage={errorMessage}
                onRetry={retryLoad}
                onOpen={openStoreDetail}
                onAdjust={handleOpenAdjust}
              />
            </PullRefreshLoadMore>
          </>
        )}
      </main>

      {showStorePicker ? (
        <SmsBroadcastAccountPicker
          isSubmitting={isSubmitting}
          searchQuery={pickerSearchQuery}
          stores={pickerStores}
          hasMore={pickerHasMore}
          isLoading={pickerIsLoading}
          isLoadingMore={pickerIsLoadingMore}
          errorMessage={pickerErrorMessage}
          onClose={closeStorePicker}
          onSearchChange={setPickerSearchQuery}
          onLoadMore={handleLoadMorePickerStores}
          onRetry={retryPickerLoad}
          onSelect={handleOpenAdjust}
        />
      ) : null}

      {targetStore ? (
        <GrantSmsBalanceModal
          store={targetStore}
          onClose={handleCloseAdjust}
          onConfirm={handleConfirmAdjust}
          isSubmitting={isSubmitting}
        />
      ) : null}
    </div>
  );
};

export default SmsBroadcast;
