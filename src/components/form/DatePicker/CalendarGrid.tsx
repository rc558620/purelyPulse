// CalendarGrid — 星期标题行 + 日期格子网格
import React, { memo } from 'react';
import { WEEK_LABELS } from './utils';
import type { CalCell } from './utils';
import styles from './DatePicker.module.less';

export interface CalendarGridProps {
  cells: CalCell[];
  selected: string | null;
  todayStr: string;
  onDayClick: (day: number) => void;
  checkDisabled: (dateStr: string) => boolean;
}

const CalendarGrid: React.FC<CalendarGridProps> = memo(({
  cells, selected, todayStr, onDayClick, checkDisabled,
}) => (
  <>
    {/* 星期标题行 */}
    <div className={styles.calWeekRow}>
      {WEEK_LABELS.map(w => <span key={w} className={styles.calWeekCell}>{w}</span>)}
    </div>

    {/* 日期格子 */}
    <div className={styles.calDayGrid}>
      {cells.map((cell, idx) => {
        if (!cell.day || !cell.dateStr) {
          return <span key={`blank-${idx}`} className={styles.calDayBlank} />;
        }
        const disabled   = checkDisabled(cell.dateStr);
        const isToday    = cell.dateStr === todayStr;
        const isSelected = cell.dateStr === selected;

        let dayClass = styles.calDayBtn;
        if (isSelected)  dayClass += ` ${styles.calDaySelected}`;
        else if (isToday) dayClass += ` ${styles.calDayToday}`;
        if (disabled)    dayClass += ` ${styles.calDayDisabled}`;

        return (
          <button
            key={cell.dateStr}
            type="button"
            disabled={disabled}
            className={dayClass}
            onClick={() => onDayClick(cell.day!)}
          >
            {cell.day}
          </button>
        );
      })}
    </div>
  </>
));

CalendarGrid.displayName = 'CalendarGrid';

export default CalendarGrid;
