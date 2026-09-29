// 会员搜索行：全局 Search 搜索框 + 状态 / 等级 / 到期时间 SelectView 下拉框同行；
// 清单筛选开关（待补录 / 已调续费价）手机端另起一行，桌面端回到同行。
import React, { memo, useMemo } from 'react';
import { cx } from '@utils/utils';
import { Search } from '@components/form/Search/Search';
import { SelectView } from '@components/form/SelectView';
import type {
  MemberFilterExpiry,
  MemberFilterLevel,
  MemberFilterStatus,
} from '../../../../memberList.types';
import styles from '../../../../memberList.module.less';

const EXPIRY_OPTIONS: { label: string; value: MemberFilterExpiry }[] = [
  { value: 'all', label: '全部到期日' },
  { value: '1m', label: '1 个月内' },
  { value: '3m', label: '3 个月内' },
  { value: '6m', label: '半年内' },
  { value: '1y', label: '1 年内' },
  { value: '2y', label: '2 年内' },
];

const STATUS_OPTIONS: { label: string; value: MemberFilterStatus }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'active', label: '正常' },
  { value: 'inactive', label: '未活跃' },
  { value: 'banned', label: '封禁' },
];

const LEVEL_OPTIONS: { label: string; value: MemberFilterLevel }[] = [
  { value: 'all', label: '全部等级' },
  { value: 'lifetime', label: '永久' },
  { value: 'annual', label: '年卡' },
  { value: 'quarterly', label: '季卡' },
  { value: 'monthly', label: '月卡' },
  { value: 'free', label: '免费' },
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
  /** 当前选中的状态筛选 */
  statusFilter: MemberFilterStatus;
  /** 状态筛选变更回调 */
  onStatusChange: (value: MemberFilterStatus) => void;
  /** 当前选中的等级筛选 */
  levelFilter: MemberFilterLevel;
  /** 等级筛选变更回调 */
  onLevelChange: (value: MemberFilterLevel) => void;
  /** 是否只看待补录子账号加价的门店 */
  pendingBackfillFilter: boolean;
  /** 待补录筛选切换回调 */
  onPendingBackfillChange: (value: boolean) => void;
  /** 是否只看「续费价被单独调整过」的门店 */
  renewalPriceFilter: boolean;
  /** 已调续费价筛选切换回调 */
  onRenewalPriceChange: (value: boolean) => void;
}

const MemberListSearchBar: React.FC<MemberListSearchBarProps> = ({
  searchValue,
  onSearchChange,
  onSearchClear,
  expiryFilter,
  onExpiryChange,
  statusFilter,
  onStatusChange,
  levelFilter,
  onLevelChange,
  pendingBackfillFilter,
  onPendingBackfillChange,
  renewalPriceFilter,
  onRenewalPriceChange,
}) => {
  const expirySelectOptions = useMemo(() => EXPIRY_OPTIONS, []);
  const statusSelectOptions = useMemo(() => STATUS_OPTIONS, []);
  const levelSelectOptions = useMemo(() => LEVEL_OPTIONS, []);

  const handleExpiryChange = (val: string | number | null | undefined): void => {
    // 清除时（val 为 null 或 undefined）重置为 'all'
    if (val == null || val === '') {
      onExpiryChange('all');
      return;
    }
    onExpiryChange(val as MemberFilterExpiry);
  };

  const handleStatusChange = (val: string | number | null | undefined): void => {
    if (val == null || val === '') {
      onStatusChange('all');
      return;
    }
    onStatusChange(val as MemberFilterStatus);
  };

  const handleLevelChange = (val: string | number | null | undefined): void => {
    if (val == null || val === '') {
      onLevelChange('all');
      return;
    }
    onLevelChange(val as MemberFilterLevel);
  };

  return (
    <div className={styles.searchRow}>
      {/* 搜索框：手机端独占一行，桌面端宽度有上限、右侧留给筛选下拉 */}
      <div className={styles.searchRowInput}>
        <Search
          value={searchValue}
          onChange={onSearchChange}
          onClear={onSearchClear}
          placeholder="搜索姓名 / 手机号"
          triggerClassName={styles.memberSearchTrigger}
        />
      </div>

      {/* 筛选下拉组：手机端整行换行 + 横向滚动，桌面端与搜索框同行 */}
      <div className={styles.searchRowSelects}>
        {/* 状态下拉：固定宽度；不写死 displayMode，手机端自动走底部弹层（写在横向滚动容器里会被裁剪） */}
        <div className={styles.searchRowSelectSm}>
          <SelectView
            options={statusSelectOptions}
            value={statusFilter}
            onChange={handleStatusChange}
            placeholder="全部状态"
            searchable={false}
            allowClear={statusFilter !== 'all'}
            triggerClassName={styles.expirySelectTrigger}
          />
        </div>

        {/* 等级下拉：固定宽度 */}
        <div className={styles.searchRowSelectSm}>
          <SelectView
            options={levelSelectOptions}
            value={levelFilter}
            onChange={handleLevelChange}
            placeholder="全部等级"
            searchable={false}
            allowClear={levelFilter !== 'all'}
            triggerClassName={styles.expirySelectTrigger}
          />
        </div>

        {/* 到期时间下拉：固定宽度 */}
        <div className={styles.searchRowSelect}>
          <SelectView
            options={expirySelectOptions}
            value={expiryFilter}
            onChange={handleExpiryChange}
            placeholder="全部到期日"
            searchable={false}
            allowClear={expiryFilter !== 'all'}
            triggerClassName={styles.expirySelectTrigger}
          />
        </div>
      </div>

      {/*
        清单筛选开关行：手机端整行换行（并排后会把搜索框压成只剩图标），
        桌面端收成一个不压缩的 flex item，回到与搜索框同行。
      */}
      <div className={styles.filterToggleRow} role="group" aria-label="清单筛选">
        {/* 待补录清单开关：一键筛出「有子账号但未补录子账号加价」的门店 */}
        <button
          type="button"
          className={cx(
            styles.searchRowToggle,
            styles.pendingBackfillToggle,
            pendingBackfillFilter && styles.pendingBackfillToggleActive,
          )}
          aria-pressed={pendingBackfillFilter}
          title="有子账号能力但成交价快照里缺子账号加价的门店，续费会退化为 max(当前配置价, 成交总额)"
          onClick={() => onPendingBackfillChange(!pendingBackfillFilter)}
        >
          待补录子账号加价
        </button>

        {/*
          已调续费价开关：筛出「续费价被调整过」的门店。
          刻意用状态词（已调）而非动作词——「调整续费价格」是会员详情页的操作入口，
          同名会被读成「点一下去改价」。口径是「曾经调过」：后来清空覆盖（恢复配置价）
          的门店仍会留在清单里。
        */}
        <button
          type="button"
          className={cx(
            styles.searchRowToggle,
            styles.renewalPriceToggle,
            renewalPriceFilter && styles.renewalPriceToggleActive,
          )}
          aria-pressed={renewalPriceFilter}
          aria-label="已调续费价：只看续费价被调整过的账号"
          title="续费价被调整过的账号；后来在弹窗里清空、恢复配置价的也算调过价，仍会留在清单里"
          onClick={() => onRenewalPriceChange(!renewalPriceFilter)}
        >
          已调续费价
        </button>
      </div>
    </div>
  );
};

export default memo(MemberListSearchBar);
