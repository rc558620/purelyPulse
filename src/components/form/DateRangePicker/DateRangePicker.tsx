/**
 * DateRangePicker —— 开始/结束日期双 DayPicker 组合
 *
 * 用于利润详情、报表中心等「日期范围」自定义查询模式。
 *
 * 用法：
 * ```tsx
 * <DateRangePicker
 *   startYear={2024} startMonth={3}  startDay={1}
 *   endYear={2024}   endMonth={3}    endDay={31}
 *   onStartChange={(y, m, d) => { ... }}
 *   onEndChange={(y, m, d) => { ... }}
 *   onClear={() => setPeriod('month')}
 * />
 * ```
 */
import { memo, useCallback } from 'react';
import DayPicker from '@components/form/DayPicker';
import styles from './DateRangePicker.module.less';

export interface DateRangePickerProps {
  startYear:  number;
  startMonth: number;
  startDay:   number;
  endYear:    number;
  endMonth:   number;
  endDay:     number;
  onStartChange: (y: number, m: number, d: number) => void;
  onEndChange:   (y: number, m: number, d: number) => void;
  onClear:       () => void;
}

const DateRangePicker = memo<DateRangePickerProps>(({
  startYear,
  startMonth,
  startDay,
  endYear,
  endMonth,
  endDay,
  onStartChange,
  onEndChange,
  onClear,
}) => {
  const handleStartChange = useCallback(
    (y: number, m: number, d: number) => onStartChange(y, m, d),
    [onStartChange],
  );

  const handleEndChange = useCallback(
    (y: number, m: number, d: number) => onEndChange(y, m, d),
    [onEndChange],
  );

  return (
    <div className={styles.dateRangeRow}>
      <div className={styles.dateRangeItem}>
        <DayPicker
          year={startYear}
          month={startMonth}
          day={startDay}
          onChange={handleStartChange}
          onClear={onClear}
        />
      </div>
      <div className={styles.dateRangeSep} aria-hidden="true">→</div>
      <div className={styles.dateRangeItem}>
        <DayPicker
          year={endYear}
          month={endMonth}
          day={endDay}
          onChange={handleEndChange}
          onClear={onClear}
        />
      </div>
    </div>
  );
});

DateRangePicker.displayName = 'DateRangePicker';

export default DateRangePicker;
