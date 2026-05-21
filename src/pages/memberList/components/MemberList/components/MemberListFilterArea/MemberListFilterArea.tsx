// 会员筛选区：状态 Tab 行 + 等级 Chip 行，两者共同决定列表过滤结果。
import React, { memo } from 'react';
import { cx } from '@utils/utils';
import type { MemberFilterLevel, MemberFilterStatus } from '../../../../memberList.types';
import styles from '../../../../memberList.module.less';

const STATUS_TABS: { value: MemberFilterStatus; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '正常' },
  { value: 'inactive', label: '未活跃' },
  { value: 'banned', label: '封禁' },
];

const LEVEL_FILTERS: { value: MemberFilterLevel; label: string }[] = [
  { value: 'all', label: '全部等级' },
  { value: 'annual', label: '年卡' },
  { value: 'quarterly', label: '季卡' },
  { value: 'monthly', label: '月卡' },
  { value: 'free', label: '免费' },
];

interface MemberListFilterAreaProps {
  /** 当前选中的状态筛选 */
  statusFilter: MemberFilterStatus;
  /** 当前选中的等级筛选 */
  levelFilter: MemberFilterLevel;
  /** 状态筛选变更回调 */
  onStatusChange: (value: MemberFilterStatus) => void;
  /** 等级筛选变更回调 */
  onLevelChange: (value: MemberFilterLevel) => void;
}

const MemberListFilterArea: React.FC<MemberListFilterAreaProps> = ({
  statusFilter,
  levelFilter,
  onStatusChange,
  onLevelChange,
}) => (
  <>
    {/* 状态 Tab 行 */}
    <div className={styles.tabRow} role="tablist" aria-label="会员状态筛选">
      {STATUS_TABS.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={statusFilter === tab.value}
          className={cx(styles.tabBtn, statusFilter === tab.value && styles.tabBtnActive)}
          onClick={() => onStatusChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>

    {/* 等级 Chip 行 */}
    <div className={styles.chipRow} role="group" aria-label="等级筛选">
      {LEVEL_FILTERS.map((filterItem) => (
        <button
          key={filterItem.value}
          className={cx(styles.chipBtn, levelFilter === filterItem.value && styles.chipBtnActive)}
          onClick={() => onLevelChange(filterItem.value)}
          aria-pressed={levelFilter === filterItem.value}
        >
          {filterItem.label}
        </button>
      ))}
    </div>
  </>
);

export default memo(MemberListFilterArea);
