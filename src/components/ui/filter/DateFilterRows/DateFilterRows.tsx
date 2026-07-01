/**
 * DateFilterRows —— 通用自定义日期筛选行
 *
 * 导出两个子组件，供各业务筛选栏/周期栏使用：
 *
 * 1. `CustomDateBtnRow`  ——「选择年月日」+「日期范围」两个切换按钮并排
 * 2. `DateRangeRow`      ——「开始日期 DayPicker → 结束日期 DayPicker」双选择器行
 *
 * 设计目标：消除 CostFilterBar 与 PurchasePeriodBar 中完全重复的 JSX + 样式。
 */
import React from 'react';
import { cx } from '@utils/utils';
import DayPicker from '@components/form/DayPicker';
import { IconCalendar, IconDateRange } from '@components/ui/_shared/icons';
import styles from './DateFilterRows.module.less';

// ═══════════════════════════════════════════════════════════════
// Helper
// ═══════════════════════════════════════════════════════════════

/** 判断开始日期是否晚于结束日期（同一年内按天数比较） */
function isStartAfterEnd(
  sy: number, sm: number, sd: number,
  ey: number, em: number, ed: number,
): boolean {
  if (sy !== ey) return sy > ey;
  if (sm !== em) return sm > em;
  return sd > ed;
}

// ═══════════════════════════════════════════════════════════════
// 1. CustomDateBtnRow
// ═══════════════════════════════════════════════════════════════

/** 按钮互斥模式：none=均未选中 / date=选择年月日 / range=日期范围 */
export type CustomDateMode = 'none' | 'date' | 'range';

export interface CustomDateBtnRowProps {
  /** 当前模式（互斥，默认 none） */
  mode?: CustomDateMode;
  /** 「选择年月日」按钮的显示文字（已选中时可显示具体日期） */
  customDateBtnText?: string;
  /** 切换「选择年月日」模式 */
  onToggleCustomDate: () => void;
  /** 切换「日期范围」模式 */
  onToggleCustomRange: () => void;
  /** 是否禁用按钮（默认 false） */
  disabled?: boolean;
}

export const CustomDateBtnRow: React.FC<CustomDateBtnRowProps> = React.memo(({
  mode = 'none',
  customDateBtnText = '选择年月日',
  onToggleCustomDate,
  onToggleCustomRange,
  disabled = false,
}) => {
  const isCustomDate  = mode === 'date';
  const isCustomRange = mode === 'range';

  return (
    <div className={styles.customBtnRow}>
      <button
        type="button"
        className={cx(
          styles.customModeBtn,
          isCustomDate && styles.customModeBtnActive,
          disabled && styles.customModeBtnDisabled,
        )}
        onClick={onToggleCustomDate}
        aria-pressed={isCustomDate}
        aria-label="选择年月日"
        disabled={disabled}
      >
        <IconCalendar />
        <span className={styles.customModeBtnText}>{customDateBtnText}</span>
      </button>
      <button
        type="button"
        className={cx(
          styles.customModeBtn,
          isCustomRange && styles.customModeBtnActive,
          disabled && styles.customModeBtnDisabled,
        )}
        onClick={onToggleCustomRange}
        aria-pressed={isCustomRange}
        aria-label="选择日期范围"
        disabled={disabled}
      >
        <IconDateRange />
        <span className={styles.customModeBtnText}>日期范围</span>
      </button>
    </div>
  );
});

CustomDateBtnRow.displayName = 'CustomDateBtnRow';

// ═══════════════════════════════════════════════════════════════
// 2. DateRangeRow
// ═══════════════════════════════════════════════════════════════

export interface DateRangeRowProps {
  startYear:   number;
  startMonth:  number;
  startDay:    number;
  onStartChange: (year: number, month: number, day: number) => void;
  /** 清除起始日期回调（可选，不传则 DayPicker 不显示清除按钮） */
  onStartClear?: () => void;

  endYear:   number;
  endMonth:  number;
  endDay:    number;
  onEndChange: (year: number, month: number, day: number) => void;
  /** 清除结束日期回调（可选，不传则 DayPicker 不显示清除按钮） */
  onEndClear?: () => void;
  /** PC 端弹出位置：'top' | 'bottom'，默认 'bottom' */
  popupPlacement?: 'top' | 'bottom';
}

export const DateRangeRow: React.FC<DateRangeRowProps> = React.memo(({
  startYear, startMonth, startDay,
  onStartChange, onStartClear,
  endYear, endMonth, endDay,
  onEndChange, onEndClear,
  popupPlacement,
}) => {
  const reversed = isStartAfterEnd(
    startYear, startMonth, startDay,
    endYear, endMonth, endDay,
  );

  return (
    <div className={cx(styles.dateRangeRow, reversed && styles.dateRangeRowReversed)}>
      <div className={styles.dateRangeItem}>
        <DayPicker
          year={startYear}
          month={startMonth}
          day={startDay}
          onChange={onStartChange}
          onClear={onStartClear}
          popupPlacement={popupPlacement}
        />
      </div>
      <div className={styles.dateRangeSep} aria-hidden="true">→</div>
      <div className={styles.dateRangeItem}>
        <DayPicker
          year={endYear}
          month={endMonth}
          day={endDay}
          onChange={onEndChange}
          onClear={onEndClear}
          popupPlacement={popupPlacement}
        />
      </div>
      {reversed && (
        <div className={styles.dateRangeWarning} role="alert">
          开始日期晚于结束日期
        </div>
      )}
    </div>
  );
});

DateRangeRow.displayName = 'DateRangeRow';
