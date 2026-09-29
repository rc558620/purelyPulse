// 会员记录管理页主体：筛选卡固定在头部下方，记录列表卡单独挂在 PullRefreshLoadMore 的滚动视口里。
//
// 滚动为什么交给 PullRefreshLoadMore：
// 下拉刷新组件要求自己的滚动容器有确定高度（它按 height:100% 算下拉位移），
// 因此页面容器只占满屏、不滚动，滚动条唯一来源就是这个视口。
//
// 筛选卡为什么放在视口外：刷新提示胶囊相对视口顶部定位，包住整页时它会
// 弹在筛选卡上面；移出去之后「松手立即刷新」正好出现在记录明细卡上方，
// 下拉手势也只作用于列表 —— 滚到列表深处时筛选条件同样保持可见可改。
import React, { useCallback } from 'react';
import PageHeader from '@components/ui/layout/PageHeader';
import PullRefreshLoadMore from '@components/ui/layout/PullRefreshLoadMore/PullRefreshLoadMore';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import { useMemberRecordsPage } from '../../useMemberRecordsPage';
import MemberRecordsFilterCard from './components/MemberRecordsFilterCard/MemberRecordsFilterCard';
import MemberRecordsListCard from './components/MemberRecordsListCard/MemberRecordsListCard';
import styles from '../../memberRecords.module.less';

const MemberRecords: React.FC = () => {
  const navigate = useAnimatedNavigate();
  const {
    filters,
    appliedQuery,
    records,
    isInitialLoading,
    isRefreshing,
    isLoadingMore,
    hasMore,
    errorMessage,
    isRangeReversed,
    updateFilters,
    setSingleDate,
    setRangeStart,
    setRangeEnd,
    submitSearch,
    resetFilters,
    refreshRecords,
    loadMoreRecords,
    retryLoadRecords,
  } = useMemberRecordsPage();

  // 首屏请求还没回来时忽略下拉：两个「第一页」请求并发会让游标互相覆盖
  const handleRefresh = useCallback(async (): Promise<void> => {
    if (isInitialLoading) {
      return;
    }

    await refreshRecords();
  }, [isInitialLoading, refreshRecords]);

  return (
    <div className={styles.pageContainer}>
      <PageHeader title="会员记录管理" onBack={() => navigate(-1)} />

      {/* 内容总装层：宽度约束在这一层，让刷新视口的滚动条与回顶按钮贴内容区右缘而非窗口边缘 */}
      <main className={styles.contentWrapper}>
        <div className={styles.filterShell}>
          <MemberRecordsFilterCard
            filters={filters}
            isSearching={isInitialLoading}
            isRangeReversed={isRangeReversed}
            // 电话只可能是数字（后端按门店电话 / 微信手机号 / 占位邮箱里的号码模糊匹配），
            // 输入时直接拦掉其它字符：手输、粘贴带空格或横线的号码都会被规整成纯数字
            onChangePhone={(phone) =>
              updateFilters({ phone: phone.replace(/\D/g, '') })
            }
            onChangeName={(name) => updateFilters({ name })}
            onChangeLevel={(level) => updateFilters({ level })}
            onChangeType={(type) => updateFilters({ type })}
            onChangeSingleDate={setSingleDate}
            onChangeRangeStart={setRangeStart}
            onChangeRangeEnd={setRangeEnd}
            onSubmit={submitSearch}
            onReset={resetFilters}
          />
        </div>

        <PullRefreshLoadMore
          className={styles.refreshShell}
          contentClassName={styles.refreshContent}
          onRefresh={handleRefresh}
          onLoadMore={loadMoreRecords}
          hasMore={hasMore}
          refreshErrorText="刷新失败，请稍后重试"
          loadMoreErrorText="加载更多失败"
          allLoadedText="没有更多记录了"
        >
          <MemberRecordsListCard
            records={records}
            appliedQuery={appliedQuery}
            isInitialLoading={isInitialLoading}
            isRefreshing={isRefreshing}
            isLoadingMore={isLoadingMore}
            errorMessage={errorMessage}
            onRetry={retryLoadRecords}
          />
        </PullRefreshLoadMore>
      </main>
    </div>
  );
};

export default MemberRecords;
