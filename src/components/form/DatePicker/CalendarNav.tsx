// CalendarNav — 月份导航栏（上/下月切换 + 年月标题点击跳转年月选择器）
import React, { memo } from 'react';
import { MONTH_NAMES } from './utils';
import styles from './DatePicker.module.less';
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from '@components/form/_shared/icons';

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
      <ChevronLeftIcon />
    </button>
    <button
      type="button"
      className={styles.calNavTitle}
      onClick={onOpenYearMonth}
      aria-label="选择年月"
    >
      {viewYear}年{MONTH_NAMES[viewMonth]}
      <ChevronDownIcon style={{ marginLeft: 4 }} />
    </button>
    <button type="button" className={styles.calNavBtn} onClick={onNextMonth} aria-label="下个月">
      <ChevronRightIcon />
    </button>
  </div>
));

CalendarNav.displayName = 'CalendarNav';

export default CalendarNav;
