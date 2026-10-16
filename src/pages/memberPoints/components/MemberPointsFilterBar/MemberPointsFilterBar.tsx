// memberPoints 搜索与筛选区块
import React from 'react';
import SlidingTabBar from '@components/ui/filter/SlidingTabBar/SlidingTabBar';
import { IconMemberPointsClose, IconMemberPointsSearch } from '../MemberPointsIcons/MemberPointsIcons';
import { MEMBER_POINTS_FILTER_TABS } from '../../memberPoints.constants';
import type { MemberPointsFilterTab } from '../../memberPoints.types';
import styles from './MemberPointsFilterBar.module.less';

interface MemberPointsFilterBarProps {
  /** 当前筛选 Tab：不传则不渲染 Tab 行（积分一览视图只用搜索框） */
  activeTab?: MemberPointsFilterTab;
  /** 搜索输入值：onSearchChange 不传时整个搜索框不渲染（详情视图只用 Tab） */
  searchQuery?: string;
  onTabChange?: (tab: MemberPointsFilterTab) => void;
  onSearchChange?: (value: string) => void;
  /** 搜索框占位文案，默认按会员姓名 / 手机号口径 */
  searchPlaceholder?: string;
}

const MemberPointsFilterBar: React.FC<MemberPointsFilterBarProps> = React.memo(({
  activeTab,
  searchQuery = '',
  onTabChange,
  onSearchChange,
  searchPlaceholder = '搜索会员姓名 / 手机号...',
}) => (
  <>
    {onSearchChange ? (
      <div className={styles.searchWrap}>
        <IconMemberPointsSearch className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          aria-label="搜索会员"
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
    ) : null}

    {activeTab && onTabChange ? (
      <SlidingTabBar
        options={MEMBER_POINTS_FILTER_TABS}
        value={activeTab}
        onChange={(value) => onTabChange(value as MemberPointsFilterTab)}
        variant="pill"
        ariaLabel="积分记录筛选"
      />
    ) : null}
  </>
));

export default MemberPointsFilterBar;
