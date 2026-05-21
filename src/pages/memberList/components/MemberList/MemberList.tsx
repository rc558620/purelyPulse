// 会员列表页主体组件：状态编排 + 事件处理 + 子组件组合。
import React, { useCallback } from 'react';
import PageHeader from '@components/ui/layout/PageHeader';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import { ROUTE_PATHS } from '../../../../router/paths';
import MemberListContent from './components/MemberListContent/MemberListContent';
import MemberListFilterArea from './components/MemberListFilterArea/MemberListFilterArea';
import MemberListSearchBar from './components/MemberListSearchBar/MemberListSearchBar';
import MemberListStatsRow from './components/MemberListStatsRow/MemberListStatsRow';
import { useMemberListPage } from '../../useMemberListPage';
import styles from '../../memberList.module.less';

const MemberList: React.FC = () => {
  const navigate = useAnimatedNavigate();
  const {
    members,
    stats,
    isLoading,
    isRefreshing,
    errorMessage,
    statusFilter,
    levelFilter,
    searchQuery,
    setStatusFilter,
    setLevelFilter,
    setSearchQuery,
    handleSearchClear,
    retryLoadMembers,
  } = useMemberListPage();

  const handleCardClick = useCallback((id: string): void => {
    navigate(`${ROUTE_PATHS.memberDetail}/${id}`);
  }, [navigate]);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.blurOrb} aria-hidden="true" />
      <div className={styles.blurOrb2} aria-hidden="true" />

      {/* 页面顶部导航 */}
      <PageHeader title="会员管理" onBack={() => navigate(-1)} />

      <main className={styles.contentWrapper}>
        {/* 统计概览行：总会员 / 活跃 / 合伙人 / 封禁 */}
        <MemberListStatsRow stats={stats} />

        {/* 搜索栏：姓名 / 手机号 */}
        <MemberListSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={handleSearchClear}
        />

        {/* 状态 Tab + 等级 Chip 筛选区 */}
        <MemberListFilterArea
          statusFilter={statusFilter}
          levelFilter={levelFilter}
          onStatusChange={setStatusFilter}
          onLevelChange={setLevelFilter}
        />

        {/* 列表内容区：加载中 / 错误 / 空 / 正常列表 */}
        <MemberListContent
          members={members}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          errorMessage={errorMessage}
          onRetry={retryLoadMembers}
          onCardClick={handleCardClick}
        />
      </main>
    </div>
  );
};

export default MemberList;
