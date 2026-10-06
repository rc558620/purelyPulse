// 合伙人纯利豆管理页面主体：统计与筛选固定在头部下方，变动记录单独挂在 PullRefreshLoadMore 的滚动视口里。
//
// 滚动为什么交给 PullRefreshLoadMore：
// 下拉刷新组件要求自己的滚动容器有确定高度（它按 height:100% 算下拉位移），
// 因此页面容器只占满屏、不滚动，滚动条唯一来源就是这个视口。
//
// 统计、余额一览与筛选为什么放在视口外：
// 「下拉刷新从变动记录上面开始」—— 滚到记录深处时筛选条件仍然可见可改，
// 刷新提示胶囊也正好落在变动记录卡上方，而不是压在统计卡上。
import React from 'react';
import PageHeader from '@components/ui/layout/PageHeader';
import PullRefreshLoadMore from '@components/ui/layout/PullRefreshLoadMore/PullRefreshLoadMore';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import AdjustBeanModal from './components/AdjustBeanModal/AdjustBeanModal';
import PartnerBeansFilterBar from './components/PartnerBeansFilterBar/PartnerBeansFilterBar';
import { IconPartnerBeansAdd } from './components/PartnerBeansIcons/PartnerBeansIcons';
import PartnerBeansRecordList from './components/PartnerBeansRecordList/PartnerBeansRecordList';
import PartnerBeansStatsOverview from './components/PartnerBeansStatsOverview/PartnerBeansStatsOverview';
import PartnerBeansSummaryCard from './components/PartnerBeansSummaryCard/PartnerBeansSummaryCard';
import PartnerBeansUserPicker from './components/PartnerBeansUserPicker/PartnerBeansUserPicker';
import { usePartnerBeansPage } from './usePartnerBeansPage';
import styles from './partnerBeans.module.less';

const PartnerBeans: React.FC = () => {
  const navigate = useAnimatedNavigate();
  const {
    records,
    users,
    pickerUsers,
    activeTab,
    searchQuery,
    pickerSearchQuery,
    adjustTarget,
    showUserPicker,
    isInitialLoading,
    isUsersLoading,
    isUsersLoaded,
    isRefreshing,
    isLoadingMore,
    hasMore,
    isSubmitting,
    errorMessage,
    stats,
    scrollToTopTrigger,
    setActiveTab,
    setSearchQuery,
    setPickerSearchQuery,
    openUserPicker,
    closeUserPicker,
    handleOpenAdjust,
    handleCloseAdjust,
    handleConfirmAdjust,
    refreshRecords,
    loadMoreRecords,
    retryLoad,
  } = usePartnerBeansPage();

  // 挂载条件与 hasMore 解耦：hasMore 为 false 时也要挂上 onLoadMore，
  // 否则 footer 整个不渲染，传下去的「没有更多记录了」永远看不到
  //（组件内部 runLoadMore 自己会按 hasMore 决定是否真的发请求、以及显示什么文案）。
  //
  // 首屏 / 刷新中 / 失败态不挂：这三个态下底部文案会与列表内的「加载中 / 加载失败 + 重试」
  // 自相矛盾；刷新还要单独排除——它与加载更多共用同一个 abortController，并发会互相取消，
  // 刷新被静默 abort 后列表没更新，刷新条却显示「刷新成功」。
  const canLoadMore = !isInitialLoading && !isRefreshing && !errorMessage;

  return (
    <div className={styles.pageContainer}>
      <PageHeader
        title="合伙人纯利豆管理"
        onBack={() => navigate(-1)}
        rightExtra={(
          <button
            type="button"
            className={styles.adjustBtn}
            onClick={openUserPicker}
            aria-label="调整合伙人纯利豆"
            disabled={isSubmitting}
          >
            <IconPartnerBeansAdd />
            调整纯利豆
          </button>
        )}
      />

      {/* 内容总装层：宽度约束在这一层，让刷新视口的滚动条与回顶按钮贴内容区右缘而非窗口边缘 */}
      <main className={styles.contentWrapper}>
        <div className={styles.fixedShell}>
          <PartnerBeansStatsOverview stats={stats} />
          {/* 用快照自己的加载态：它先于流水到位，不能用流水首屏标记代替 */}
          <PartnerBeansSummaryCard
            isLoading={isUsersLoading}
            isSubmitting={isSubmitting}
            users={users}
            onAdjust={handleOpenAdjust}
          />
          <PartnerBeansFilterBar
            activeTab={activeTab}
            searchQuery={searchQuery}
            setActiveTab={setActiveTab}
            setSearchQuery={setSearchQuery}
          />
        </div>

        <PullRefreshLoadMore
          className={styles.refreshShell}
          contentClassName={styles.refreshContent}
          onRefresh={refreshRecords}
          onLoadMore={canLoadMore ? loadMoreRecords : undefined}
          hasMore={hasMore}
          scrollToTopTrigger={scrollToTopTrigger}
          refreshErrorText="刷新失败，请下拉重试"
          loadMoreErrorText="加载更多失败"
          allLoadedText="没有更多记录了"
        >
          <PartnerBeansRecordList
            records={records}
            totalCount={stats.totalRecords}
            showBalance={isUsersLoaded}
            isInitialLoading={isInitialLoading}
            isLoadingMore={isLoadingMore}
            errorMessage={errorMessage}
            onRetry={retryLoad}
          />
        </PullRefreshLoadMore>
      </main>

      {showUserPicker ? (
        <PartnerBeansUserPicker
          isSubmitting={isSubmitting}
          searchQuery={pickerSearchQuery}
          users={pickerUsers}
          onClose={closeUserPicker}
          onSearchChange={setPickerSearchQuery}
          onSelect={handleOpenAdjust}
        />
      ) : null}

      {adjustTarget ? (
        <AdjustBeanModal
          user={adjustTarget}
          onClose={handleCloseAdjust}
          onConfirm={handleConfirmAdjust}
          isSubmitting={isSubmitting}
        />
      ) : null}
    </div>
  );
};

export default PartnerBeans;
