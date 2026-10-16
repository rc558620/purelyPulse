// 合伙人纯利豆管理页面主体：余额一览（列表视图）与单合伙人变动记录（详情视图）共用一个骨架。
//
// 滚动为什么交给 PullRefreshLoadMore：
// 下拉刷新组件要求自己的滚动容器有确定高度（它按 height:100% 算下拉位移），
// 因此页面容器只占满屏、不滚动，滚动条唯一来源就是这个视口。
//
// 固定区（视口外）放什么由视图决定：
// - list：搜索框固定，余额一览挂在视口里做真分页（下拉刷新 / 上拉加载更多）；
// - detail：合伙人头部 + 该合伙人的统计 + Tab 固定，变动记录挂在视口里做游标分页。
import React from 'react';
import PageHeader from '@components/ui/layout/PageHeader';
import PullRefreshLoadMore from '@components/ui/layout/PullRefreshLoadMore/PullRefreshLoadMore';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import AdjustBeanModal from './components/AdjustBeanModal/AdjustBeanModal';
import PartnerBeansDetailHeader from './components/PartnerBeansDetailHeader/PartnerBeansDetailHeader';
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
    viewMode,
    selectedUser,
    users,
    usersTotal,
    records,
    stats,
    activeTab,
    searchQuery,
    pickerSearchQuery,
    pickerUsers,
    adjustTarget,
    showUserPicker,
    isSubmitting,
    isUsersLoading,
    isUsersRefreshing,
    usersHasMore,
    usersErrorMessage,
    isRecordsInitialLoading,
    isRecordsRefreshing,
    isRecordsLoadingMore,
    recordsHasMore,
    recordsErrorMessage,
    scrollToTopTrigger,
    usersScrollToTopTrigger,
    setSearchQuery,
    setActiveTab,
    setPickerSearchQuery,
    openPartnerDetail,
    backToPartnerList,
    openUserPicker,
    closeUserPicker,
    handleOpenAdjust,
    handleCloseAdjust,
    handleConfirmAdjust,
    refreshUsers,
    loadMoreUsers,
    retryLoadUsers,
    refreshRecords,
    loadMoreRecords,
    retryLoadRecords,
  } = usePartnerBeansPage();

  const isDetailView = viewMode === 'detail' && Boolean(selectedUser);

  // 挂载条件与 hasMore 解耦：hasMore 为 false 时也要挂上 onLoadMore，
  // 否则 footer 整个不渲染，传下去的「没有更多」文案永远看不到
  //（组件内部 runLoadMore 自己会按 hasMore 决定是否真的发请求、以及显示什么文案）。
  //
  // 首屏 / 刷新中 / 失败态不挂：这三个态下底部文案会与列表内的「加载中 / 加载失败 + 重试」
  // 自相矛盾；刷新还要单独排除——它与加载更多共用同一个 abortController，并发会互相取消，
  // 刷新被静默 abort 后列表没更新，刷新条却显示「刷新成功」。
  const canLoadMoreUsers = !isUsersLoading && !isUsersRefreshing && !usersErrorMessage;
  const canLoadMoreRecords = !isRecordsInitialLoading && !isRecordsRefreshing && !recordsErrorMessage;

  return (
    <div className={styles.pageContainer}>
      <PageHeader
        title={isDetailView && selectedUser ? `${selectedUser.name} · 变动记录` : '合伙人纯利豆管理'}
        onBack={isDetailView ? backToPartnerList : () => navigate(-1)}
        rightExtra={isDetailView && selectedUser ? (
          <button
            type="button"
            className={styles.adjustBtn}
            onClick={() => handleOpenAdjust(selectedUser)}
            aria-label={`调整 ${selectedUser.name} 的纯利豆`}
            disabled={isSubmitting}
          >
            <IconPartnerBeansAdd />
            调整纯利豆
          </button>
        ) : (
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
        {isDetailView && selectedUser ? (
          <>
            <div className={styles.fixedShell}>
              <PartnerBeansDetailHeader
                user={selectedUser}
                isSubmitting={isSubmitting}
                onAdjust={handleOpenAdjust}
              />
              {/* 统计是该合伙人的口径：后端按 storeId 过滤的完整结果集计算 */}
              <PartnerBeansStatsOverview stats={stats} />
              <PartnerBeansFilterBar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            </div>

            <PullRefreshLoadMore
              className={styles.refreshShell}
              contentClassName={styles.refreshContent}
              onRefresh={refreshRecords}
              onLoadMore={canLoadMoreRecords ? loadMoreRecords : undefined}
              hasMore={recordsHasMore}
              scrollToTopTrigger={scrollToTopTrigger}
              refreshErrorText="刷新失败，请下拉重试"
              loadMoreErrorText="加载更多失败"
              allLoadedText="没有更多记录了"
            >
              <PartnerBeansRecordList
                records={records}
                totalCount={stats.totalRecords}
                showBalance={Boolean(selectedUser)}
                isInitialLoading={isRecordsInitialLoading}
                isLoadingMore={isRecordsLoadingMore}
                errorMessage={recordsErrorMessage}
                onRetry={retryLoadRecords}
              />
            </PullRefreshLoadMore>
          </>
        ) : (
          <>
            <div className={styles.fixedShell}>
              <PartnerBeansFilterBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searchPlaceholder="搜索合伙人姓名 / 手机号..."
              />
            </div>

            <PullRefreshLoadMore
              className={styles.refreshShell}
              contentClassName={styles.refreshContent}
              onRefresh={refreshUsers}
              onLoadMore={canLoadMoreUsers ? loadMoreUsers : undefined}
              hasMore={usersHasMore}
              scrollToTopTrigger={usersScrollToTopTrigger}
              refreshErrorText="刷新失败，请下拉重试"
              loadMoreErrorText="加载更多失败"
              allLoadedText="没有更多合伙人了"
            >
              <PartnerBeansSummaryCard
                isLoading={isUsersLoading}
                isSubmitting={isSubmitting}
                users={users}
                totalCount={usersTotal}
                errorMessage={usersErrorMessage}
                onRetry={retryLoadUsers}
                onOpen={openPartnerDetail}
                onAdjust={handleOpenAdjust}
              />
            </PullRefreshLoadMore>
          </>
        )}
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
