// CalendarFooter — 日历底部操作区
// 支持 date 模式（今天快捷键 + 确定按钮）和 datetime 模式（此刻 + 确认按钮）
import React, { memo } from 'react';
import styles from './DatePicker.module.less';

export interface CalendarFooterProps {
  /** 是否为 datetime 模式 */
  isDatetime: boolean;
  /** 是否隐藏「今天」快捷按钮 */
  hideToday: boolean;
  /** 是否显示「确定」关闭按钮 */
  showConfirm: boolean;
  /** 今天是否被禁用 */
  todayDisabled: boolean;
  /** 今天点击 */
  onTodayClick: () => void;
  /** 确定/关闭点击（date 模式） */
  onConfirmClose: () => void;
  /** 此刻点击（datetime 模式） */
  onNow?: () => void;
  /** 确认点击（datetime 模式） */
  onConfirm?: () => void;
}

const CalendarFooter: React.FC<CalendarFooterProps> = memo(({
  isDatetime,
  hideToday,
  showConfirm,
  todayDisabled,
  onTodayClick,
  onConfirmClose,
  onNow,
  onConfirm,
}) => {
  let footerClass = styles.calFooter;
  if (isDatetime) footerClass += ` ${styles.calFooterDatetime}`;
  if (showConfirm && !hideToday && !isDatetime) footerClass += ` ${styles.calFooterSpread}`;

  return (
    <div className={footerClass}>
      {isDatetime ? (
        <>
          <button type="button" className={styles.calFooterNow} onClick={onNow}>此刻</button>
          <button type="button" className={styles.calFooterConfirm} onClick={onConfirm}>确认</button>
        </>
      ) : (
        <>
          {showConfirm && (
            <button type="button" className={styles.calFooterConfirm} onClick={onConfirmClose}>确定</button>
          )}
          {!hideToday && (
            <button
              type="button"
              disabled={todayDisabled}
              className={
                todayDisabled
                  ? `${styles.calFooterToday} ${styles.calFooterTodayDisabled}`
                  : styles.calFooterToday
              }
              onClick={onTodayClick}
            >
              今天
            </button>
          )}
        </>
      )}
    </div>
  );
});

CalendarFooter.displayName = 'CalendarFooter';

export default CalendarFooter;
