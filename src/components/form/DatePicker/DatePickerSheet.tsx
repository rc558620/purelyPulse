// DatePickerSheet — 移动端底部 BottomSheet（Portal 挂到 body）
// 负责：遮罩、顶部操作栏（取消 / 标题 / 确定）、下滑关闭手势

import React, { memo, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import styles from './DatePicker.module.less';

/** 下滑超过该距离（px）视为关闭 */
const SHEET_CLOSE_THRESHOLD = 100;

export interface DatePickerSheetProps {
  /** 面板标题 */
  title: string;
  /** 是否 datetime 模式（决定右上角是「确定」还是占位） */
  isDatetime: boolean;
  /** 关闭回调（遮罩点击 / 取消按钮 / 下滑手势） */
  onClose: () => void;
  /** 确定回调（datetime 模式提交） */
  onConfirm: () => void;
  /** 面板内容 */
  children: React.ReactNode;
}

const DatePickerSheet: React.FC<DatePickerSheetProps> = memo(({
  title,
  isDatetime,
  onClose,
  onConfirm,
  children,
}) => {
  // Bug13 修复：下滑关闭手势
  const sheetRef    = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const touchDeltaY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchDeltaY.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const deltaY = e.touches[0].clientY - touchStartY.current;
    // 只允许向下拖动
    if (deltaY > 0 && sheetRef.current) {
      touchDeltaY.current = deltaY;
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
      sheetRef.current.style.transition = 'none';
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (sheetRef.current) {
      sheetRef.current.style.transition = '';
      sheetRef.current.style.transform  = '';
    }
    if (touchDeltaY.current > SHEET_CLOSE_THRESHOLD) {
      onClose();
    }
    touchDeltaY.current = 0;
  }, [onClose]);

  return ReactDOM.createPortal(
    <>
      {/* Bug7 修复：遮罩层点击一律关闭，不自动提交 datetime 值 */}
      <div className={styles.mask} onClick={onClose} aria-hidden="true" />

      <div
        ref={sheetRef}
        className={`${styles.bottomSheet} ${styles.bottomSheetVisible}${isDatetime ? ` ${styles.bottomSheetDatetime}` : ''}`}
        role="dialog"
        aria-modal="true"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={styles.sheetHeader}>
          <div className={styles.sheetHandle} aria-hidden="true" />
          <div className={styles.sheetTitleRow}>
            <button type="button" className={styles.sheetCancelBtn} onClick={onClose}>取消</button>
            <span className={styles.sheetTitle}>{title}</span>
            {isDatetime ? (
              <button type="button" className={styles.sheetConfirmBtn} onClick={onConfirm}>确定</button>
            ) : (
              <div className={styles.sheetHeaderRight} />
            )}
          </div>
        </div>
        {children}
      </div>
    </>,
    document.body,
  );
});

DatePickerSheet.displayName = 'DatePickerSheet';

export default DatePickerSheet;
