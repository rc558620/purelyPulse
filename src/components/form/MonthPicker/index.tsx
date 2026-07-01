// MonthPicker — 年月选择器（组装层）
//
// 负责 Trigger 渲染、弹层开/关状态管理，以及设备类型判断。
// 实际面板渲染分别委托给：
//   - MonthPickerMobileSheet  移动端底部弹层（Portal）
//   - MonthPickerPcDropdown   PC 端下拉面板

import React, { useCallback } from 'react';
import classNames from 'classnames';

import useDeviceType  from '@components/form/_shared/useDeviceType';
import usePickerPopup from '@components/form/_shared/usePickerPopup';
import { CalendarIcon, CloseIcon } from '@components/form/_shared/icons';
import { pad2 }       from '@components/form/_shared/pickerUtils';

import MonthPickerMobileSheet from './MonthPickerMobileSheet';
import MonthPickerPcDropdown  from './MonthPickerPcDropdown';
import styles from './MonthPicker.module.less';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface MonthPickerProps {
  year:  number;
  month: number;
  onChange: (year: number, month: number) => void;
  /** 清除回调：传入时 Trigger 右侧显示 × 按钮 */
  onClear?: () => void;
  displayMode?: 'mobile' | 'pc';
  /** 向前追溯年数（默认 4） */
  pastYears?: number;
  /** 向后预留年数（默认 1） */
  futureYears?: number;
  /** 是否禁用交互 */
  disabled?: boolean;
  className?: string;
}

// ─── 组件 ─────────────────────────────────────────────────────────────────────

const MonthPicker: React.FC<MonthPickerProps> = ({
  year,
  month,
  onChange,
  onClear,
  displayMode,
  pastYears,
  futureYears,
  disabled = false,
  className,
}) => {
  const isMobile = useDeviceType(displayMode);

  const {
    visible,
    isClosing,
    wrapperRef,
    handleOpen,
    handleClose,
    handleAnimationEnd,
    handleKeyDown,
  } = usePickerPopup({ isMobile });

  const displayText = `${year}/${pad2(month)}`;

  // BUG-8 fix: 禁用时不允许打开面板
  const handleTriggerClick = useCallback(() => {
    if (disabled) return;
    handleOpen();
  }, [disabled, handleOpen]);

  const handleTriggerKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;
    handleKeyDown(e);
  }, [disabled, handleKeyDown]);

  const handleClearClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClear?.();
  }, [onClear]);

  return (
    <div ref={wrapperRef} className={classNames(styles.wrapper, className)}>
      {/* ── Trigger ──────────────────────────────────────────────── */}
      <div
        className={classNames(
          styles.trigger,
          visible && styles.triggerOpen,
          disabled && styles.triggerDisabled,
        )}
        onClick={handleTriggerClick}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleTriggerKeyDown}
        aria-label={displayText}
        aria-expanded={visible}
        aria-haspopup="dialog"
        aria-disabled={disabled || undefined}
      >
        <CalendarIcon className={styles.calIcon} />
        <span className={styles.triggerText}>{displayText}</span>

        {onClear ? (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={handleClearClick}
            aria-label="清除年月"
          >
            <CloseIcon size={16} />
          </button>
        ) : (
          <span className={styles.arrowPlaceholder} aria-hidden="true" />
        )}
      </div>

      {/* ── 移动端：底部 BottomSheet（Portal to body） ─────────────── */}
      {isMobile && (
        <MonthPickerMobileSheet
          visible={visible}
          isClosing={isClosing}
          year={year}
          month={month}
          pastYears={pastYears}
          futureYears={futureYears}
          onConfirm={onChange}
          onClose={handleClose}
          onTransitionEnd={handleAnimationEnd}
        />
      )}

      {/* ── PC 端：绝对定位下拉面板 ──────────────────────────────────── */}
      {!isMobile && visible && (
        <MonthPickerPcDropdown
          isClosing={isClosing}
          year={year}
          month={month}
          pastYears={pastYears}
          futureYears={futureYears}
          onConfirm={onChange}
          onClose={handleClose}
          onAnimationEnd={handleAnimationEnd}
        />
      )}
    </div>
  );
};

export default MonthPicker;
