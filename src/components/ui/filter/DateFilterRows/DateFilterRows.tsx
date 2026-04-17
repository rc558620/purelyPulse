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
import React, { useCallback } from 'react';
import { cx } from '@utils/utils';
import DayPicker from '@components/form/DayPicker';
import styles from './DateFilterRows.module.less';

// ─── 内联图标（自洽，不依赖外部图标集）────────────────────────────

const CalendarIcon = (
  <svg
    width="13" height="13" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" style={{ flexShrink: 0 }}
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8"  y1="2" x2="8"  y2="6" />
    <line x1="3"  y1="10" x2="21" y2="10" />
  </svg>
);

const RangeIcon = (
  <svg
    width="13" height="13" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" style={{ flexShrink: 0 }}
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8"  y1="2" x2="8"  y2="6" />
    <line x1="3"  y1="10" x2="21" y2="10" />
    <line x1="8"  y1="15" x2="16" y2="15" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════
// 1. CustomDateBtnRow
// ═══════════════════════════════════════════════════════════════

export interface CustomDateBtnRowProps {
  /** 是否处于「选择年月日」模式 */
  isCustomDate: boolean;
  /** 是否处于「日期范围」模式 */
  isCustomRange: boolean;
  /** 「选择年月日」按钮的显示文字（已选中时可显示具体日期） */
  customDateBtnText?: string;
  /** 切换「选择年月日」模式 */
  onToggleCustomDate: () => void;
  /** 切换「日期范围」模式 */
  onToggleCustomRange: () => void;
}

export const CustomDateBtnRow: React.FC<CustomDateBtnRowProps> = React.memo(({
  isCustomDate,
  isCustomRange,
  customDateBtnText = '选择年月日',
  onToggleCustomDate,
  onToggleCustomRange,
}) => (
  <div className={styles.customBtnRow}>
    <button
      type="button"
      className={cx(styles.customModeBtn, isCustomDate && styles.customModeBtnActive)}
      onClick={onToggleCustomDate}
      aria-pressed={isCustomDate}
      aria-label="选择年月日"
    >
      {CalendarIcon}
      <span>{customDateBtnText}</span>
    </button>
    <button
      type="button"
      className={cx(styles.customModeBtn, isCustomRange && styles.customModeBtnActive)}
      onClick={onToggleCustomRange}
      aria-pressed={isCustomRange}
      aria-label="选择日期范围"
    >
      {RangeIcon}
      <span>日期范围</span>
    </button>
  </div>
));

CustomDateBtnRow.displayName = 'CustomDateBtnRow';

// ═══════════════════════════════════════════════════════════════
// 2. DateRangeRow
// ═══════════════════════════════════════════════════════════════

export interface DateRangeRowProps {
  startYear:   number;
  startMonth:  number;
  startDay:    number;
  onStartChange: (year: number, month: number, day: number) => void;
  onStartClear: () => void;

  endYear:   number;
  endMonth:  number;
  endDay:    number;
  onEndChange: (year: number, month: number, day: number) => void;
  onEndClear: () => void;
}

export const DateRangeRow: React.FC<DateRangeRowProps> = React.memo(({
  startYear, startMonth, startDay,
  onStartChange, onStartClear,
  endYear, endMonth, endDay,
  onEndChange, onEndClear,
}) => {
  const handleStartChange = useCallback((y: number, m: number, d: number) => {
    onStartChange(y, m, d);
  }, [onStartChange]);

  const handleEndChange = useCallback((y: number, m: number, d: number) => {
    onEndChange(y, m, d);
  }, [onEndChange]);

  return (
    <div className={styles.dateRangeRow}>
      <div className={styles.dateRangeItem}>
        <span className={styles.dateRangeLabel}>开始日期</span>
        <DayPicker
          year={startYear}
          month={startMonth}
          day={startDay}
          onChange={handleStartChange}
          onClear={onStartClear}
        />
      </div>
      <div className={styles.dateRangeSep} aria-hidden="true">→</div>
      <div className={styles.dateRangeItem}>
        <span className={styles.dateRangeLabel}>结束日期</span>
        <DayPicker
          year={endYear}
          month={endMonth}
          day={endDay}
          onChange={handleEndChange}
          onClear={onEndClear}
        />
      </div>
    </div>
  );
});

DateRangeRow.displayName = 'DateRangeRow';
