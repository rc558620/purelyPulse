// CalendarNav — 月份导航栏（上/下月切换 + 年月标题点击跳转年月选择器）
import React, { memo } from 'react';
import { MONTH_NAMES } from './utils';
import styles from './DatePicker.module.less';

export interface CalendarNavProps {
  viewYear: number;
  viewMonth: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpenYearMonth: () => void;
}

const CalendarNav: React.FC<CalendarNavProps> = memo(({
  viewYear, viewMonth, onPrevMonth, onNextMonth, onOpenYearMonth,
}) => (
  <div className={styles.calNav}>
    <button type="button" className={styles.calNavBtn} onClick={onPrevMonth} aria-label="上个月">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
    <button
      type="button"
      className={styles.calNavTitle}
      onClick={onOpenYearMonth}
      aria-label="选择年月"
    >
      {viewYear}年{MONTH_NAMES[viewMonth]}
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" style={{ marginLeft: 4 }}>
        <path d="M6 8L2 4h8z" />
      </svg>
    </button>
    <button type="button" className={styles.calNavBtn} onClick={onNextMonth} aria-label="下个月">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  </div>
));

CalendarNav.displayName = 'CalendarNav';

export default CalendarNav;
