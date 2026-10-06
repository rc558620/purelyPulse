// 新客额度管理页面主体：状态编排 + 事件处理 + 子组件组合。
//
// 滚动为什么交给 PullRefreshLoadMore：
// 下拉刷新组件要求自己的滚动容器有确定高度（它按 height:100% 算下拉位移），
// 因此页面容器只占满屏、不滚动，滚动条唯一来源就是这个视口。
//
// 统计概览 / 搜索 / Tab 为什么放在视口外：
// 「下拉刷新从门店额度一览上面开始」——统计与筛选条件滚到列表深处时仍然可见可改。
import React, { useCallback, useMemo } from 'react';
import PageHeader from '@components/ui/layout/PageHeader';
import PullRefreshLoadMore from '@components/ui/layout/PullRefreshLoadMore/PullRefreshLoadMore';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import NewCustomerQuotaFilterBar from './components/NewCustomerQuotaFilterBar/NewCustomerQuotaFilterBar';
import { IconNewCustomerQuotaAdd } from './components/NewCustomerQuotaIcons/NewCustomerQuotaIcons';
import NewCustomerQuotaStoreList from './components/NewCustomerQuotaStoreList/NewCustomerQuotaStoreList';
import NewCustomerQuotaStorePicker from './components/NewCustomerQuotaStorePicker/NewCustomerQuotaStorePicker';
import NewCustomerQuotaStatsOverview from './components/NewCustomerQuotaStatsOverview/NewCustomerQuotaStatsOverview';
import SetQuotaModal from './components/SetQuotaModal/SetQuotaModal';
import { useNewCustomerQuotaPage } from './useNewCustomerQuotaPage';
import styles from './newCustomerQuota.module.less';

const NewCustomerQuota: React.FC = () => {
  const navigate = useAnimatedNavigate();
  const {
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
  } = useNewCustomerQuotaPage();

  // 首屏请求还没回来时忽略下拉：并发两个「第 1 页查询」会让竞态保护互相覆盖
  const handleRefresh = useCallback(async (): Promise<void> => {
    if (isLoading) {
      return;
    }

    await refreshStores();
  }, [isLoading, refreshStores]);

  const handleLoadMore = useCallback(async (): Promise<void> => {
    await loadMoreStores();
  }, [loadMoreStores]);

  const handleLoadMorePickerStores = useCallback(async (): Promise<void> => {
    await loadMorePickerStores();
  }, [loadMorePickerStores]);

  // 搜索 / Tab 切换会让列表重置回第 1 页；额度调整成功后同样只回第 1 页，
  // 两种情况都要把滚动位置拉回顶部，避免停在中段触发连锁自动加载。
  const scrollToTopTrigger = useMemo(
    () => [activeTab, searchQuery, refreshSeq].join('|'),
    [activeTab, refreshSeq, searchQuery],
  );

  return (
    <div className={styles.pageContainer}>
      <PageHeader
        title="新客额度管理"
        onBack={() => navigate(-1)}
        rightExtra={(
          <button
            type="button"
            className={styles.adjustEntryBtn}
            onClick={openStorePicker}
            aria-label="设置门店新客额度"
            disabled={isSubmitting}
          >
            <IconNewCustomerQuotaAdd />
            设置额度
          </button>
        )}
      />

      {/* 内容总装层：宽度约束在这一层，让刷新视口的滚动条与回顶按钮贴内容区右缘 */}
      <main className={styles.contentWrapper}>
        {/* 统计 + 搜索 / Tab 固定区：在刷新视口之外，与列表卡之间的留白即视口顶部间距 */}
        <div className={styles.listHeadShell}>
          <NewCustomerQuotaStatsOverview stats={stats} />
          <NewCustomerQuotaFilterBar
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
          onRefresh={handleRefresh}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          scrollToTopTrigger={scrollToTopTrigger}
        >
          {/* 列表内容区：加载中 / 错误 / 空 / 正常列表 */}
          <NewCustomerQuotaStoreList
            isSubmitting={isSubmitting}
            stores={stores}
            totalCount={total}
            isLoading={isLoading}
            isRefreshing={isRefreshing}
            errorMessage={errorMessage}
            onRetry={retryLoad}
            onAdjust={handleOpenAdjust}
          />
        </PullRefreshLoadMore>
      </main>

      {showStorePicker ? (
        <NewCustomerQuotaStorePicker
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
        <SetQuotaModal
          store={targetStore}
          onClose={handleCloseAdjust}
          onConfirm={handleConfirmAdjust}
          isSubmitting={isSubmitting}
        />
      ) : null}
    </div>
  );
};

export default NewCustomerQuota;
