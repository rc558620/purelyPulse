// 封禁管理筛选栏：负责状态切换与数量徽标展示。
import React from 'react';
import { cx, safeNum } from '@utils/utils';
import type { MemberFilterStatus } from '../../../memberList/memberList.types';
import { STATUS_TABS } from '../../banManagement.types';
import type { BanManagementCounts } from '../../banManagement.types';
import styles from './BanManagementFilterTabs.module.less';

interface BanManagementFilterTabsProps {
  counts: BanManagementCounts;
  disabled: boolean;
  statusFilter: MemberFilterStatus;
  onChange: (value: MemberFilterStatus) => void;
}

const TAB_BADGE_KEY_MAP: Record<MemberFilterStatus, keyof BanManagementCounts> = {
  all: 'all',
  active: 'active',
  inactive: 'inactive',
  banned: 'banned',
};

const getTabBadgeValue = (counts: BanManagementCounts, status: MemberFilterStatus): number => {
  return safeNum(counts[TAB_BADGE_KEY_MAP[status]]);
};

const BanManagementFilterTabsComponent: React.FC<BanManagementFilterTabsProps> = ({
  counts,
  disabled,
  statusFilter,
  onChange,
}) => {
  return (
    <div className={styles.filterWrap} role="tablist" aria-label="筛选用户状态">
      {STATUS_TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={statusFilter === tab.value}
          className={cx(styles.filterBtn, statusFilter === tab.value && styles.filterBtnActive)}
          onClick={() => onChange(tab.value)}
          disabled={disabled}
        >
          {tab.label}
          <span className={cx(styles.filterBadge, tab.value === 'banned' && styles.filterBadgeBanned)}>
            {getTabBadgeValue(counts, tab.value)}
          </span>
        </button>
      ))}
    </div>
  );
};

export const BanManagementFilterTabs = React.memo(BanManagementFilterTabsComponent);

BanManagementFilterTabs.displayName = 'BanManagementFilterTabs';
