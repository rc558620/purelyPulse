// 会员列表页主体组件：状态编排 + 事件处理 + 子组件组合。
//
// 滚动为什么交给 PullRefreshLoadMore：
// 下拉刷新组件要求自己的滚动容器有确定高度（它按 height:100% 算下拉位移），
// 因此页面容器只占满屏、不滚动，滚动条唯一来源就是这个视口。
//
// 统计行 / 搜索行为什么放在视口外：下拉手势与刷新提示胶囊只作用于会员列表，
// 「下拉刷新从会员列表上面开始」——统计和筛选条件滚到列表深处时仍然可见可改。
import React, { useCallback, useMemo } from 'react';
import PageHeader from '@components/ui/layout/PageHeader';
import PullRefreshLoadMore from '@components/ui/layout/PullRefreshLoadMore/PullRefreshLoadMore';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import { ROUTE_PATHS } from '../../../../router/paths';
import MemberListContent from './components/MemberListContent/MemberListContent';
import MemberListSearchBar from './components/MemberListSearchBar/MemberListSearchBar';
import MemberListStatsRow from './components/MemberListStatsRow/MemberListStatsRow';
import { useMemberListPage } from '../../useMemberListPage';
import styles from '../../memberList.module.less';

const MemberList: React.FC = () => {
  const navigate = useAnimatedNavigate();
  const {
    members,
    stats,
    hasMore,
    isLoading,
    isRefreshing,
    errorMessage,
    statusFilter,
    levelFilter,
    expiryFilter,
    pendingBackfillFilter,
    renewalPriceFilter,
    searchQuery,
    setStatusFilter,
    setLevelFilter,
    setExpiryFilter,
    setPendingBackfillFilter,
    setRenewalPriceFilter,
    setSearchQuery,
    handleSearchClear,
    refreshMembers,
    loadMoreMembers,
    retryLoadMembers,
  } = useMemberListPage();

  const handleCardClick = useCallback((id: string): void => {
    navigate(`${ROUTE_PATHS.memberDetail}/${id}`);
  }, [navigate]);

  // 首屏请求还没回来时忽略下拉：并发两个「第 1 页查询」会让竞态保护互相覆盖
  const handleRefresh = useCallback(async (): Promise<void> => {
    if (isLoading) {
      return;
    }

    await refreshMembers();
  }, [isLoading, refreshMembers]);

  // 筛选 / 搜索变化会让列表重置回第 1 页，滚动位置一并回到顶部
  const scrollToTopTrigger = useMemo(
    () => [statusFilter, levelFilter, expiryFilter, pendingBackfillFilter, renewalPriceFilter, searchQuery].join('|'),
    [statusFilter, levelFilter, expiryFilter, pendingBackfillFilter, renewalPriceFilter, searchQuery],
  );

  // 清单型筛选的空态文案：说清「筛的是什么」+ 下一步动作。
  // 两个开关同时打开时，任何单一解释都不准确，退回通用文案。
  const emptyStateHint = useMemo(() => {
    if (renewalPriceFilter && pendingBackfillFilter) {
      return {};
    }

    if (renewalPriceFilter) {
      return {
        title: '暂无调整过续费价的账号',
        description: '可在会员详情里用「调整续费价格」单独议定续费价',
      };
    }

    if (pendingBackfillFilter) {
      return {
        title: '暂无待补录子账号加价的账号',
        description: '子账号加价可在会员详情的成交价快照里补录',
      };
    }

    return {};
  }, [renewalPriceFilter, pendingBackfillFilter]);

  return (
    <div className={styles.pageContainer}>

      {/* 页面顶部导航 */}
      <PageHeader title="会员管理" onBack={() => navigate(-1)} />

      {/* 内容总装层：宽度约束在这一层，让刷新视口的滚动条与回顶按钮贴内容区右缘而非窗口边缘 */}
      <main className={styles.contentWrapper}>
        {/* 统计 + 搜索固定区：在刷新视口之外，与列表卡之间的留白即视口顶部间距 */}
        <div className={styles.listHeadShell}>
          {/* 统计概览行：总会员 / 活跃 / 合伙人 / 封禁 */}
          <MemberListStatsRow stats={stats} />

          {/* 搜索栏 + 状态 / 等级 / 到期时间筛选同行 */}
          <MemberListSearchBar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchClear={handleSearchClear}
            expiryFilter={expiryFilter}
            onExpiryChange={setExpiryFilter}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            levelFilter={levelFilter}
            onLevelChange={setLevelFilter}
            pendingBackfillFilter={pendingBackfillFilter}
            onPendingBackfillChange={setPendingBackfillFilter}
            renewalPriceFilter={renewalPriceFilter}
            onRenewalPriceChange={setRenewalPriceFilter}
          />
        </div>

        {/* 列表滚动视口：下拉刷新 / 加载更多 / 内容滚动都发生在这里 */}
        <PullRefreshLoadMore
          className={styles.refreshShell}
          contentClassName={styles.refreshContent}
          onRefresh={handleRefresh}
          onLoadMore={loadMoreMembers}
          hasMore={hasMore}
          scrollToTopTrigger={scrollToTopTrigger}
        >
          {/* 列表内容区：加载中 / 错误 / 空 / 正常列表 */}
          <MemberListContent
            members={members}
            totalCount={stats.totalCount}
            isLoading={isLoading}
            isRefreshing={isRefreshing}
            errorMessage={errorMessage}
            onRetry={retryLoadMembers}
            onCardClick={handleCardClick}
            emptyTitle={emptyStateHint.title}
            emptyDescription={emptyStateHint.description}
          />
        </PullRefreshLoadMore>
      </main>
    </div>
  );
};

export default MemberList;
