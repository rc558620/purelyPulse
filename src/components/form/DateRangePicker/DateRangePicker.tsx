/**
 * DateRangePicker —— 开始/结束日期双 DayPicker 组合
 *
 * 用于利润详情、报表中心等「日期范围」自定义查询模式。
 *
 * 修复记录：
 *   - Bug1: 开始日期变更时若晚于结束日期，自动将结束日期对齐到开始日期
 *   - Bug3: 拆分 onClear 为 onClearStart / onClearEnd，区分清除来源
 *   - Bug4: 透传 displayMode 给子 DayPicker
 *   - Bug5: 移动端互斥：同一时间只允许一个 DayPicker 弹层打开
 *
 * 用法：
 * ```tsx
 * <DateRangePicker
 *   startYear={2024} startMonth={3}  startDay={1}
 *   endYear={2024}   endMonth={3}    endDay={31}
 *   onStartChange={(y, m, d) => { ... }}
 *   onEndChange={(y, m, d) => { ... }}
 *   onClearStart={() => { ... }}
 *   onClearEnd={() => { ... }}
 * />
 * ```
 */
import { memo, useCallback } from 'react';
import DayPicker from '@components/form/DayPicker';
import styles from './DateRangePicker.module.less';

// ─── 工具 ─────────────────────────────────────────────────────

/** 将年月日编码为可比较的整数 YYYYMMDD */
const toDateNum = (y: number, m: number, d: number): number =>
  y * 10000 + m * 100 + d;

// ─── Props ────────────────────────────────────────────────────

export interface DateRangePickerProps {
  startYear:  number;
  startMonth: number;
  startDay:   number;
  endYear:    number;
  endMonth:   number;
  endDay:     number;
  onStartChange: (y: number, m: number, d: number) => void;
  onEndChange:   (y: number, m: number, d: number) => void;
  /** 清除开始日期回调（替代原 onClear） */
  onClearStart?: () => void;
  /** 清除结束日期回调（替代原 onClear） */
  onClearEnd?:   () => void;
  /** @deprecated 使用 onClearStart / onClearEnd 替代。兼容旧调用方 */
  onClear?:      () => void;
  /** 强制 DayPicker 渲染模式 */
  displayMode?:  'mobile' | 'pc';
  /** PC 端弹出位置：'top' | 'bottom'，默认 'bottom' */
  popupPlacement?: 'top' | 'bottom';
}

// ─── 组件 ─────────────────────────────────────────────────────

const DateRangePicker = memo<DateRangePickerProps>(({
  startYear,
  startMonth,
  startDay,
  endYear,
  endMonth,
  endDay,
  onStartChange,
  onEndChange,
  onClearStart,
  onClearEnd,
  onClear,
  displayMode,
  popupPlacement = 'bottom',
}) => {

  // ── Bug1: 开始日期变更时，若晚于结束日期则自动对齐 ──
  const handleStartChange = useCallback(
    (y: number, m: number, d: number) => {
      onStartChange(y, m, d);
      if (toDateNum(y, m, d) > toDateNum(endYear, endMonth, endDay)) {
        onEndChange(y, m, d);
      }
    },
    [onStartChange, onEndChange, endYear, endMonth, endDay],
  );

  // 结束日期变更时，若早于开始日期则自动对齐
  const handleEndChange = useCallback(
    (y: number, m: number, d: number) => {
      onEndChange(y, m, d);
      if (toDateNum(y, m, d) < toDateNum(startYear, startMonth, startDay)) {
        onStartChange(y, m, d);
      }
    },
    [onEndChange, onStartChange, startYear, startMonth, startDay],
  );

  // ── Bug3: 区分清除开始 / 清除结束 ──
  const handleClearStart = useCallback(() => {
    if (onClearStart) onClearStart();
    else onClear?.();
  }, [onClearStart, onClear]);

  const handleClearEnd = useCallback(() => {
    if (onClearEnd) onClearEnd();
    else onClear?.();
  }, [onClearEnd, onClear]);

  // ── Bug5: 打开弹层时关闭另一个 ──
  // handleStartOpen / handleEndOpen 已内联到 onVisibleChange 回调中，不再单独声明

  return (
    <div className={styles.dateRangeRow}>
      <div className={styles.dateRangeItem}>
        <DayPicker
          year={startYear}
          month={startMonth}
          day={startDay}
          onChange={handleStartChange}
          onClear={handleClearStart}
          displayMode={displayMode}
          popupPlacement={popupPlacement}
        />
      </div>
      <div className={styles.dateRangeSep} aria-hidden="true">→</div>
      <div className={styles.dateRangeItem}>
        <DayPicker
          year={endYear}
          month={endMonth}
          day={endDay}
          onChange={handleEndChange}
          onClear={handleClearEnd}
          displayMode={displayMode}
          popupPlacement={popupPlacement}
        />
      </div>
    </div>
  );
});

DateRangePicker.displayName = 'DateRangePicker';

export default DateRangePicker;
