// 会员积分管理页面主体：统计与筛选固定在头部下方，变动记录单独挂在 PullRefreshLoadMore 的滚动视口里。
//
// 滚动为什么交给 PullRefreshLoadMore：
// 下拉刷新组件要求自己的滚动容器有确定高度（它按 height:100% 算下拉位移），
// 因此页面容器只占满屏、不滚动，滚动条唯一来源就是这个视口。
//
// 统计与筛选为什么放在视口外：
// 「下拉刷新从变动记录上面开始」—— 滚到记录深处时筛选条件仍然可见可改，
// 刷新提示胶囊也正好落在变动记录卡上方，而不是压在统计卡上。
import React from 'react';
import PullRefreshLoadMore from '@components/ui/layout/PullRefreshLoadMore/PullRefreshLoadMore';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import AdjustPointsModal from './components/AdjustPointsModal/AdjustPointsModal';
import MemberPointsFilterBar from './components/MemberPointsFilterBar/MemberPointsFilterBar';
import MemberPointsPageHeader from './components/MemberPointsPageHeader/MemberPointsPageHeader';
import MemberPointsRecordList from './components/MemberPointsRecordList/MemberPointsRecordList';
import MemberPointsStatsOverview from './components/MemberPointsStatsOverview/MemberPointsStatsOverview';
import UserPickerModal from './components/UserPickerModal/UserPickerModal';
import { useMemberPointsPage } from './useMemberPointsPage';
import styles from './memberPoints.module.less';

const MemberPoints: React.FC = () => {
  const navigate = useAnimatedNavigate();
  const {
    records,
    filteredUsers,
    activeTab,
    recordSearchQuery,
    pickerKeyword,
    adjustTarget,
    showUserPicker,
    isInitialLoading,
    isUsersLoaded,
    isRefreshing,
    isLoadingMore,
    hasMore,
    isSubmitting,
    errorMessage,
    stats,
    scrollToTopTrigger,
    setActiveTab,
    setRecordSearchQuery,
    setPickerKeyword,
    openUserPicker,
    closeUserPicker,
    handleOpenAdjust,
    handleCloseAdjust,
    handleConfirmAdjust,
    refreshRecords,
    loadMoreRecords,
    retryLoad,
  } = useMemberPointsPage();

  const handleBack = (): void => {
    navigate(-1);
  };

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
      <MemberPointsPageHeader
        isSubmitting={isSubmitting}
        onBack={handleBack}
        onOpenUserPicker={openUserPicker}
      />

      {/* 内容总装层：宽度约束在这一层，让刷新视口的滚动条与回顶按钮贴内容区右缘而非窗口边缘 */}
      <main className={styles.contentWrapper}>
        <div className={styles.fixedShell}>
          <MemberPointsStatsOverview stats={stats} />
          <MemberPointsFilterBar
            activeTab={activeTab}
            searchQuery={recordSearchQuery}
            onTabChange={setActiveTab}
            onSearchChange={setRecordSearchQuery}
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
          <MemberPointsRecordList
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
        <UserPickerModal
          users={filteredUsers}
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
