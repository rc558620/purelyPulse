// MonthPickerView — picker="month" 模式的月份选择面板
import React, { memo, useMemo, useState, useCallback } from 'react';
import { MONTH_NAMES, isMonthDisabled } from './utils';
import styles from './DatePicker.module.less';

export interface MonthPickerViewProps {
  /** 当前选中值，格式 "YYYY-MM"，null 表示未选中 */
  selected: string | null;
  /** 最大可选月份 "YYYY-MM"（含） */
  maxMonth?: string;
  /** 最小可选月份 "YYYY-MM"（含） */
  minMonth?: string;
  /** 选中回调 */
  onSelect: (val: string) => void;
  /** 关闭面板回调 */
  onClose: () => void;
}

const MonthPickerView: React.FC<MonthPickerViewProps> = memo(({
  selected,
  maxMonth,
  minMonth,
  onSelect,
  onClose,
}) => {
  const today   = useMemo(() => new Date(), []);
  const todayYM = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const initYear = selected ? parseInt(selected.split('-')[0], 10) : today.getFullYear();
  const [viewYear, setViewYear] = useState(initYear);

  const checkDisabled = useCallback(
    (ym: string) => isMonthDisabled(ym, maxMonth, minMonth),
    [maxMonth, minMonth],
  );

  const handleMonthClick = useCallback((monthIdx: number) => {
    const ym = `${viewYear}-${String(monthIdx + 1).padStart(2, '0')}`;
    if (!checkDisabled(ym)) {
      onSelect(ym);
      onClose();
    }
  }, [viewYear, checkDisabled, onSelect, onClose]);

  const handleTodayMonth = useCallback(() => {
    if (!checkDisabled(todayYM)) {
      onSelect(todayYM);
      onClose();
    }
  }, [todayYM, checkDisabled, onSelect, onClose]);

  return (
    <div className={styles.calendarInner}>
      {/* 年份导航 */}
      <div className={styles.calNav}>
        <button
          type="button"
          className={styles.calNavBtn}
          onClick={() => setViewYear(y => y - 1)}
          aria-label="上一年"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 17l-5-5 5-5M17 17l-5-5 5-5" />
          </svg>
        </button>
        <span className={styles.calNavTitle} style={{ cursor: 'default' }}>{viewYear}年</span>
        <button
          type="button"
          className={styles.calNavBtn}
          onClick={() => setViewYear(y => y + 1)}
          aria-label="下一年"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 17l5-5-5-5M7 17l5-5-5-5" />
          </svg>
        </button>
      </div>

      {/* 月份网格 */}
      <div className={styles.monthGrid}>
        {MONTH_NAMES.map((name, i) => {
          const ym       = `${viewYear}-${String(i + 1).padStart(2, '0')}`;
          const disabled = checkDisabled(ym);
          const isSelected = ym === selected;
          const isToday    = ym === todayYM;

          let cellClass = styles.monthCell;
          if (isSelected)              cellClass += ` ${styles.monthCellSelected}`;
          else if (isToday)            cellClass += ` ${styles.monthCellToday}`;
          if (disabled)                cellClass += ` ${styles.monthCellDisabled}`;

          return (
            <button
              key={ym}
              type="button"
              disabled={disabled}
              className={cellClass}
              onClick={() => handleMonthClick(i)}
            >
              {name}
            </button>
          );
        })}
      </div>

      {/* 底部「本月」快捷 */}
      <div className={styles.calFooter}>
        <button
          type="button"
          disabled={checkDisabled(todayYM)}
          className={
            checkDisabled(todayYM)
              ? `${styles.calFooterToday} ${styles.calFooterTodayDisabled}`
              : styles.calFooterToday
          }
          onClick={handleTodayMonth}
        >
          本月
        </button>
      </div>
    </div>
  );
});

MonthPickerView.displayName = 'MonthPickerView';

export default MonthPickerView;
