// 会员搜索行：全局 Search 搜索框 + 到期时间 SelectView 下拉框同行布局。
import React, { memo, useMemo } from 'react';
import { cx } from '@utils/utils';
import { Search } from '@components/form/Search/Search';
import { SelectView } from '@components/form/SelectView';
import type { MemberFilterExpiry } from '../../../../memberList.types';
import styles from '../../../../memberList.module.less';

const EXPIRY_OPTIONS: { label: string; value: MemberFilterExpiry }[] = [
  { value: 'all', label: '全部到期日' },
  { value: '1m', label: '1 个月内' },
  { value: '3m', label: '3 个月内' },
  { value: '6m', label: '半年内' },
  { value: '1y', label: '1 年内' },
  { value: '2y', label: '2 年内' },
];

interface MemberListSearchBarProps {
  /** 搜索关键词 */
  searchValue: string;
  /** 关键词变更回调 */
  onSearchChange: (value: string) => void;
  /** 清除搜索回调 */
  onSearchClear: () => void;
  /** 当前选中的到期时间筛选 */
  expiryFilter: MemberFilterExpiry;
  /** 到期时间筛选变更回调 */
  onExpiryChange: (value: MemberFilterExpiry) => void;
  /** 是否只看待补录子账号加价的门店 */
  pendingBackfillFilter: boolean;
  /** 待补录筛选切换回调 */
  onPendingBackfillChange: (value: boolean) => void;
}

const MemberListSearchBar: React.FC<MemberListSearchBarProps> = ({
  searchValue,
  onSearchChange,
  onSearchClear,
  expiryFilter,
  onExpiryChange,
  pendingBackfillFilter,
  onPendingBackfillChange,
}) => {
  const selectOptions = useMemo(() => EXPIRY_OPTIONS, []);

  const handleExpiryChange = (val: string | number | null | undefined): void => {
    // 清除时（val 为 null 或 undefined）重置为 'all'
    if (val == null || val === '') {
      onExpiryChange('all');
      return;
    }
    onExpiryChange(val as MemberFilterExpiry);
  };

  return (
    <div className={styles.searchRow}>
      {/* 搜索框：占主区域 */}
      <div className={styles.searchRowInput}>
        <Search
          value={searchValue}
          onChange={onSearchChange}
          onClear={onSearchClear}
          placeholder="搜索姓名 / 手机号"
        />
      </div>

      {/* 到期时间下拉：固定宽度 */}
      <div className={styles.searchRowSelect}>
        <SelectView
          options={selectOptions}
          value={expiryFilter}
          onChange={handleExpiryChange}
          placeholder="全部到期日"
          searchable={false}
          displayMode="pc"
          allowClear={expiryFilter !== 'all'}
          triggerClassName={styles.expirySelectTrigger}
        />
      </div>

      {/* 待补录清单开关：一键筛出「有子账号但未补录子账号加价」的门店 */}
      <button
        type="button"
        className={cx(
          styles.pendingBackfillToggle,
          pendingBackfillFilter && styles.pendingBackfillToggleActive,
        )}
        aria-pressed={pendingBackfillFilter}
        title="有子账号能力但成交价快照里缺子账号加价的门店，续费会退化为 max(当前配置价, 成交总额)"
        onClick={() => onPendingBackfillChange(!pendingBackfillFilter)}
      >
        待补录子账号加价
      </button>
    </div>
  );
};

export default memo(MemberListSearchBar);
