// src/components/form/DayPicker/index.tsx
//
// 组装层：Trigger 输入框 + 移动端弹层 + PC 端下拉
// 状态由 usePickerPopup / useDeviceType 分别管理；
// 面板内部年/月/日状态由各子组件自己通过 useDayPickerState 管理。
//
// 文件结构：
//   index.tsx                ← 本文件（组装层）
//   useDayPickerState.ts     ← 面板内选中状态（selYear / selMonth / selDay / 确定 / 今天）
//   DayPickerMobilePanel     ← 移动端底部 BottomSheet（portal 到 body）
//   DayPickerPcDropdown      ← PC 端下拉面板（portal 到 body，fixed 对齐触发器）
import React, { useCallback, useRef, useState } from 'react';
import classNames from 'classnames';

import { safeNum } from '@utils/utils';
import useDeviceType  from '@components/form/_shared/useDeviceType';
import usePickerPopup from '@components/form/_shared/usePickerPopup';
import { CalendarIcon, CloseIcon } from '@components/form/_shared/icons';
import { pad2 }       from '@components/form/_shared/pickerUtils';
import DayPickerMobilePanel from './DayPickerMobilePanel';
import DayPickerPcDropdown  from './DayPickerPcDropdown';
import styles from './DayPicker.module.less';

// ─── Props ────────────────────────────────────────────────────

export interface DayPickerProps {
  year:     number;
  month:    number;
  day:      number;
  onChange: (year: number, month: number, day: number) => void;
  /** 清除回调：传入时 Trigger 右侧显示 × 按钮 */
  onClear?: () => void;
  displayMode?: 'mobile' | 'pc';
  /** 向前追溯年数（默认 4） */
  pastYears?: number;
  /** 向后预留年数（默认 1） */
  futureYears?: number;
  className?: string;
}

// ─── DayPicker 主组件 ─────────────────────────────────────────

const DayPicker: React.FC<DayPickerProps> = ({
  year,
  month,
  day,
  onChange,
  onClear,
  displayMode,
  pastYears,
  futureYears,
  className,
}) => {
  // ── 设备类型（复用 _shared，displayMode prop 可强制覆盖） ──
  const isMobile = useDeviceType(displayMode);

  // ── 面板开/关状态（复用 _shared，含 ESC + 点击外部关闭） ──
  const {
    visible,
    isClosing,
    wrapperRef,
    handleOpen,
    handleClose,
    handleAnimationEnd,
    handleKeyDown,
  } = usePickerPopup({ isMobile });

  // ── PC 端：记录触发器位置，用于 portal 面板的 fixed 定位 ──
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);

  const handleTriggerOpen = useCallback(() => {
    if (!isMobile && triggerRef.current) {
      setTriggerRect(triggerRef.current.getBoundingClientRect());
    }
    handleOpen();
  }, [isMobile, handleOpen]);

  const displayText = `${safeNum(year)}/${pad2(safeNum(month))}/${pad2(safeNum(day))}`;

  const handleClearClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClear?.();
  }, [onClear]);

  // ─── 渲染 ──────────────────────────────────────────────────

  return (
    <div ref={wrapperRef} className={classNames(styles.wrapper, className)}>

      {/* ── Trigger ── */}
      <div
        ref={triggerRef}
        className={classNames(styles.trigger, visible && styles.triggerOpen)}
        onClick={handleTriggerOpen}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label={displayText}
        aria-expanded={visible}
        aria-haspopup="dialog"
      >
        <CalendarIcon className={styles.calIcon} />
        <span className={styles.triggerText}>{displayText}</span>
        {onClear ? (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={handleClearClick}
            aria-label="清除日期"
          >
            <CloseIcon size={16} />
          </button>
        ) : (
          <span className={styles.arrowPlaceholder} aria-hidden="true" />
        )}
      </div>

      {/* ── 移动端：底部 BottomSheet（Portal，仅 visible 时挂载）── */}
      {isMobile && visible && (
        <DayPickerMobilePanel
          year={year}
          month={month}
          day={day}
          pastYears={pastYears}
          futureYears={futureYears}
          onConfirm={onChange}
          onClose={handleClose}
        />
      )}

      {/* ── PC 端：下拉 Dropdown（Portal 到 body，fixed 对齐触发器）── */}
      {!isMobile && visible && triggerRect && (
        <DayPickerPcDropdown
          year={year}
          month={month}
          day={day}
          pastYears={pastYears}
          futureYears={futureYears}
          isClosing={isClosing}
          triggerRect={triggerRect}
          onConfirm={onChange}
          onClose={handleClose}
          onAnimationEnd={handleAnimationEnd}
        />
      )}
    </div>
  );
};

export default DayPicker;
