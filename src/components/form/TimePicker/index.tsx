// src/components/form/TimePicker/index.tsx
//
// 组装层：Trigger 输入框 + 移动端弹层 + PC 端下拉
// 状态由 usePickerPopup / useDeviceType 分别管理；
// 面板内部时/分状态由各子组件自己通过 useTimePickerState 管理。
//
// 文件结构：
//   index.tsx                ← 本文件（组装层）
//   useTimePickerState.ts    ← 面板内选中状态（selH / selM / 确定 / 此刻）
//   TimePickerMobilePanel    ← 移动端底部 BottomSheet
//   TimePickerPcDropdown     ← PC 端下拉面板
import React, { useState, useCallback } from 'react';
import classNames from 'classnames';

import useDeviceType  from '@components/form/_shared/useDeviceType';
import usePickerPopup from '@components/form/_shared/usePickerPopup';
import { ClockIcon, SmallCloseIcon } from '@components/form/_shared/icons';
import TimePickerMobilePanel from './TimePickerMobilePanel';
import TimePickerPcDropdown  from './TimePickerPcDropdown';
import styles from './TimePicker.module.less';

// ─── Props ────────────────────────────────────────────────────

export interface TimePickerProps {
  /** 受控值，null 表示无选中 */
  value?: string | null;
  /** 非受控默认值 */
  defaultValue?: string;
  /** 值变更回调，null 表示已清除 */
  onChange?: (val: string | null) => void;
  /** 占位文本 */
  placeholder?: string;
  /** 错误状态（输入框显示红色边框） */
  status?: 'error';
  /** 是否允许清除，默认 true */
  allowClear?: boolean;
  /** 强制指定显示模式（不传则自动检测设备宽度） */
  displayMode?: 'mobile' | 'pc';
  /** 额外类名 */
  className?: string;
}

// ─── TimePicker 主组件 ────────────────────────────────────────

const TimePicker: React.FC<TimePickerProps> = ({
  value,
  defaultValue,
  onChange,
  placeholder = '请选择时间',
  status,
  allowClear = true,
  displayMode,
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

  // ── 受控 / 非受控 ──
  const [internalValue, setInternalValue] = useState<string | null>(defaultValue ?? null);
  const currentValue = value !== undefined ? (value ?? null) : internalValue;

  const handleChange = useCallback((val: string | null) => {
    if (value === undefined) setInternalValue(val);
    onChange?.(val);
  }, [value, onChange]);

  const handleClearClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    handleChange(null);
  }, [handleChange]);

  // ─── 渲染 ──────────────────────────────────────────────────

  return (
    <div ref={wrapperRef} className={classNames(styles.wrapper, className)}>

      {/* ── Trigger ── */}
      <div
        className={classNames(
          styles.trigger,
          status === 'error' && styles.triggerError,
          visible && styles.triggerOpen,
        )}
        onClick={handleOpen}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label={currentValue || placeholder}
        aria-expanded={visible}
        aria-haspopup="dialog"
      >
        <ClockIcon className={styles.clockIcon} />
        <span className={classNames(
          styles.triggerText,
          !currentValue && styles.triggerPlaceholder,
        )}>
          {currentValue || placeholder}
        </span>
        {allowClear && currentValue ? (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={handleClearClick}
            aria-label="清除时间"
          >
            <SmallCloseIcon />
          </button>
        ) : (
          <span className={styles.arrowPlaceholder} aria-hidden="true" />
        )}
      </div>

      {/* ── 移动端：底部 BottomSheet（Portal，仅 visible 时挂载）── */}
      {isMobile && visible && (
        <TimePickerMobilePanel
          value={currentValue}
          onConfirm={handleChange}
          onClose={handleClose}
        />
      )}

      {/* ── PC 端：下拉 Dropdown ── */}
      {!isMobile && visible && (
        <TimePickerPcDropdown
          value={currentValue}
          isClosing={isClosing}
          onConfirm={handleChange}
          onClose={handleClose}
          onAnimationEnd={handleAnimationEnd}
        />
      )}
    </div>
  );
};

export default TimePicker;
