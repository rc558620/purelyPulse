// 会员积分管理页面主体：会员积分一览（列表视图）与单会员变动记录（详情视图）共用一个骨架。
//
// 滚动为什么交给 PullRefreshLoadMore：
// 下拉刷新组件要求自己的滚动容器有确定高度（它按 height:100% 算下拉位移），
// 因此页面容器只占满屏、不滚动，滚动条唯一来源就是这个视口。
//
// 固定区（视口外）放什么由视图决定：
// - list：搜索框固定，会员积分一览挂在视口里做真分页（下拉刷新 / 上拉加载更多）；
// - detail：会员头部 + 该会员的统计 + Tab 固定，变动记录挂在视口里做游标分页。
import React from 'react';
import PullRefreshLoadMore from '@components/ui/layout/PullRefreshLoadMore/PullRefreshLoadMore';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import AdjustPointsModal from './components/AdjustPointsModal/AdjustPointsModal';
import MemberPointsDetailHeader from './components/MemberPointsDetailHeader/MemberPointsDetailHeader';
import MemberPointsFilterBar from './components/MemberPointsFilterBar/MemberPointsFilterBar';
import MemberPointsHeaderAction from './components/MemberPointsHeaderAction/MemberPointsHeaderAction';
import MemberPointsPageHeader from './components/MemberPointsPageHeader/MemberPointsPageHeader';
import MemberPointsRecordList from './components/MemberPointsRecordList/MemberPointsRecordList';
import MemberPointsStatsOverview from './components/MemberPointsStatsOverview/MemberPointsStatsOverview';
import MemberPointsSummaryCard from './components/MemberPointsSummaryCard/MemberPointsSummaryCard';
import UserPickerModal from './components/UserPickerModal/UserPickerModal';
import { useMemberPointsPage } from './useMemberPointsPage';
import styles from './memberPoints.module.less';

const MemberPoints: React.FC = () => {
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
    pickerKeyword,
    pickerUsers,
    adjustTarget,
    showUserPicker,
    isUsersLoading,
    isUsersRefreshing,
    usersHasMore,
    usersErrorMessage,
    isRecordsInitialLoading,
    isRecordsRefreshing,
    isRecordsLoadingMore,
    recordsHasMore,
    recordsErrorMessage,
    isSubmitting,
    scrollToTopTrigger,
    usersScrollToTopTrigger,
    setSearchQuery,
    setActiveTab,
    setPickerKeyword,
    openMemberDetail,
    backToMemberList,
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
  } = useMemberPointsPage();

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
      <MemberPointsPageHeader
        title={isDetailView && selectedUser ? `${selectedUser.name} · 变动记录` : '会员积分管理'}
        onBack={isDetailView ? backToMemberList : () => navigate(-1)}
        rightExtra={
          <MemberPointsHeaderAction
            disabled={isSubmitting}
            onClick={isDetailView && selectedUser ? () => handleOpenAdjust(selectedUser) : openUserPicker}
            ariaLabel={isDetailView && selectedUser ? `调整 ${selectedUser.name} 的积分` : '调整用户积分'}
          />
        }
      />

      {/* 内容总装层：宽度约束在这一层，让刷新视口的滚动条与回顶按钮贴内容区右缘而非窗口边缘 */}
      <main className={styles.contentWrapper}>
        {isDetailView && selectedUser ? (
          <>
            <div className={styles.fixedShell}>
              <MemberPointsDetailHeader
                user={selectedUser}
                isSubmitting={isSubmitting}
                onAdjust={handleOpenAdjust}
              />
              {/* 统计是该会员的口径：后端按 storeId 过滤的完整结果集计算 */}
              <MemberPointsStatsOverview stats={stats} />
              <MemberPointsFilterBar
                activeTab={activeTab}
                onTabChange={setActiveTab}
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
              <MemberPointsRecordList
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
              <MemberPointsFilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
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
              allLoadedText="没有更多会员了"
            >
              <MemberPointsSummaryCard
                isLoading={isUsersLoading}
                isSubmitting={isSubmitting}
                users={users}
                totalCount={usersTotal}
                errorMessage={usersErrorMessage}
                onRetry={retryLoadUsers}
                onOpen={openMemberDetail}
                onAdjust={handleOpenAdjust}
              />
            </PullRefreshLoadMore>
          </>
        )}
      </main>

      {showUserPicker ? (
        <UserPickerModal
          users={pickerUsers}
          keyword={pickerKeyword}
          isSubmitting={isSubmitting}
          onKeywordChange={setPickerKeyword}
          onClose={closeUserPicker}
          onSelect={handleOpenAdjust}
        />
      ) : null}

      {adjustTarget ? (
        <AdjustPointsModal
          key={adjustTarget.id}
          user={adjustTarget}
          onClose={handleCloseAdjust}
          onConfirm={handleConfirmAdjust}
          isSubmitting={isSubmitting}
        />
      ) : null}
    </div>
  );
};

export default MemberPoints;
