// YearMonthPicker — 年月快速导航面板
import React, { memo, useMemo, useRef, useEffect } from 'react';
import { MONTH_NAMES, buildYearList } from './utils';
import styles from './DatePicker.module.less';

export interface YearMonthPickerProps {
  viewYear: number;
  viewMonth: number;
  onYearChange: (y: number) => void;
  onMonthSelect: (m: number) => void;
  onBack: () => void;
}

const YearMonthPicker: React.FC<YearMonthPickerProps> = memo(({
  viewYear, viewMonth, onYearChange, onMonthSelect, onBack,
}) => {
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const years       = useMemo(() => buildYearList(currentYear), [currentYear]);
  const yearListRef = useRef<HTMLDivElement>(null);

  // 打开时自动滚动到当前年
  useEffect(() => {
    const el = yearListRef.current?.querySelector(`[data-year="${viewYear}"]`);
    if (el) (el as HTMLElement).scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [viewYear]);

  return (
    <div className={styles.calendarInner}>
      <div className={styles.ymPickerHeader}>
        <button
          type="button"
          className={styles.ymBackBtn}
          onClick={onBack}
          aria-label="返回日历"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          返回
        </button>
        <span className={styles.ymPickerTitle}>选择年月</span>
      </div>

      <div className={styles.ymPickerBody}>
        {/* 年份滚动列 */}
        <div className={styles.ymYearList} ref={yearListRef}>
          {years.map(y => (
            <button
              key={y}
              type="button"
              data-year={y}
              className={
                y === viewYear
                  ? `${styles.ymYearItem} ${styles.ymYearItemActive}`
                  : styles.ymYearItem
              }
              onClick={() => onYearChange(y)}
            >
              {y}年
            </button>
          ))}
        </div>

        {/* 月份网格 */}
        <div className={styles.ymMonthGrid}>
          {MONTH_NAMES.map((name, i) => (
            <button
              key={name}
              type="button"
              className={
                i === viewMonth
                  ? `${styles.ymMonthItem} ${styles.ymMonthItemActive}`
                  : styles.ymMonthItem
              }
              onClick={() => onMonthSelect(i)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

YearMonthPicker.displayName = 'YearMonthPicker';

export default YearMonthPicker;
