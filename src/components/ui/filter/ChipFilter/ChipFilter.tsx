// 通用横向可滚动 Chip 筛选组：支持"全部" + 动态分类单选切换。
// 适用于：库存盘点分类筛、商品额外分类筛、报表分类筛等场景。
import React, { memo } from 'react';
import { cx, isNonEmptyArray } from '@utils/utils';
import styles from './ChipFilter.module.less';

export interface ChipFilterOption {
  /** chip 显示文本 */
  label: string;
  /** chip 唯一值 */
  value: string;
}

export interface ChipFilterProps {
  /** chip 选项列表（不含"全部"，组件内部自动添加） */
  options: ChipFilterOption[] | string[];
  /** 当前选中值（空字符串 = 全部） */
  value: string;
  /** 选中某 chip 回调（再次点击同一项则清空 → 传回空字符串） */
  onChange: (value: string) => void;
  /** "全部" chip 的文本，默认"全部" */
  allLabel?: string;
  /** 额外 class，用于外部调整容器间距 */
  className?: string;
}

/** 将 string[] 或 ChipFilterOption[] 统一归一化为 ChipFilterOption[] */
function normalizeOptions(options: ChipFilterOption[] | string[]): ChipFilterOption[] {
  if (!isNonEmptyArray(options)) return [];
  return (options as Array<string | ChipFilterOption>).map(opt =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt,
  );
}

const ChipFilter: React.FC<ChipFilterProps> = memo(({
  options,
  value,
  onChange,
  allLabel = '全部',
  className,
}) => {
  const normalized = normalizeOptions(options);

  const handleSelect = (optValue: string) => {
    // 再次点击同一项 → 取消选中（回到"全部"）
    onChange(value === optValue ? '' : optValue);
  };

  return (
    <div className={cx(styles.filterScroll, className)}>
      {/* "全部"固定 chip */}
      <button
        type="button"
        className={cx(styles.chip, !value && styles.chipActive)}
        onClick={() => onChange('')}
      >
        {allLabel}
      </button>

      {/* 动态 chip */}
      {normalized.map(opt => (
        <button
          key={opt.value}
          type="button"
          className={cx(styles.chip, value === opt.value && styles.chipActive)}
          onClick={() => handleSelect(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
});

ChipFilter.displayName = 'ChipFilter';

export default ChipFilter;
