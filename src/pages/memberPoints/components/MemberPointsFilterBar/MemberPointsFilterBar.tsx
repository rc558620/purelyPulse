// memberPoints 搜索与筛选区块
import React from 'react';
import SlidingTabBar from '@components/ui/filter/SlidingTabBar/SlidingTabBar';
import { IconMemberPointsClose, IconMemberPointsSearch } from '../MemberPointsIcons/MemberPointsIcons';
import type { MemberPointsFilterTab, MemberPointsTabOption } from '../../memberPoints.types';
import styles from './MemberPointsFilterBar.module.less';

const MEMBER_POINTS_FILTER_TABS: MemberPointsTabOption[] = [
  { value: 'all', label: '全部' },
  { value: 'admin', label: '管理员调整' },
  { value: 'earn', label: '获得' },
  { value: 'spend', label: '消耗' },
];

interface MemberPointsFilterBarProps {
  activeTab: MemberPointsFilterTab;
  searchQuery: string;
  onTabChange: (tab: MemberPointsFilterTab) => void;
  onSearchChange: (value: string) => void;
}

const MemberPointsFilterBar: React.FC<MemberPointsFilterBarProps> = React.memo(({
  activeTab,
  searchQuery,
  onTabChange,
  onSearchChange,
}) => (
  <>
    <div className={styles.searchWrap}>
      <IconMemberPointsSearch className={styles.searchIcon} />
      <input
        className={styles.searchInput}
        type="text"
        placeholder="搜索用户姓名 / 手机号 / 说明..."
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        aria-label="搜索积分记录"
      />
      {searchQuery ? (
        <button
          type="button"
          className={styles.searchClear}
          onClick={() => onSearchChange('')}
          aria-label="清除搜索"
        >
          <IconMemberPointsClose width={14} height={14} />
        </button>
      ) : null}
    </div>

    <SlidingTabBar
      options={MEMBER_POINTS_FILTER_TABS}
      value={activeTab}
      onChange={(value) => onTabChange(value as MemberPointsFilterTab)}
      variant="pill"
      ariaLabel="积分记录筛选"
    />
  </>
));

export default MemberPointsFilterBar;
