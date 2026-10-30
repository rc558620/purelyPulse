// DatePickerTrigger — 输入框（触发器）
// 负责：前缀图标 / 展示文本 / 清除按钮 / 状态样式（error、open、disabled）

import React, { memo } from 'react';
import { CalendarIcon, SmallCloseIcon } from '@components/form/_shared/icons';
import styles from './DatePicker.module.less';

export interface DatePickerTriggerProps {
  /** 输入框展示文本，空则显示 placeholder */
  displayText: string;
  /** 占位文本 */
  placeholder: string;
  /** 错误状态（红色边框） */
  status?: 'error';
  /** 禁用状态 */
  disabled: boolean;
  /** 面板是否已展开（影响 triggerOpen 样式与 aria-expanded） */
  visible: boolean;
  /** 是否允许清除 */
  allowClear: boolean;
  /** 当前是否有值（决定是否渲染清除按钮） */
  hasValue: boolean;
  /** 前缀图标（替换默认日历图标） */
  prefix?: React.ReactNode;
  /** 点击触发器（打开/关闭面板） */
  onClick: () => void;
  /** 点击清除按钮 */
  onClear: (e: React.MouseEvent) => void;
  /** 键盘事件（Enter 打开面板） */
  onKeyDown: (e: React.KeyboardEvent) => void;
}

const DatePickerTrigger: React.FC<DatePickerTriggerProps> = memo(({
  displayText,
  placeholder,
  status,
  disabled,
  visible,
  allowClear,
  hasValue,
  prefix,
  onClick,
  onClear,
  onKeyDown,
}) => (
  <div
    className={`${styles.trigger}${status === 'error' ? ` ${styles.triggerError}` : ''}${visible ? ` ${styles.triggerOpen}` : ''}${disabled ? ` ${styles.triggerDisabled}` : ''}`}
    onClick={onClick}
    role="button"
    tabIndex={disabled ? -1 : 0}
    onKeyDown={onKeyDown}
    aria-label={displayText || placeholder}
    aria-expanded={visible}
    aria-haspopup="dialog"
    aria-disabled={disabled || undefined}
  >
    {/* 前缀图标 */}
    {prefix ? (
      <div className={styles.triggerPrefix}>{prefix}</div>
    ) : (
      <CalendarIcon className={styles.calIcon} />
    )}

    {/* 文本 */}
    <span className={displayText ? styles.triggerText : `${styles.triggerText} ${styles.triggerPlaceholder}`}>
      {displayText || placeholder}
    </span>

    {/* 清除 / 占位 */}
    {allowClear && hasValue ? (
      <button type="button" className={styles.clearBtn} onClick={onClear} aria-label="清除日期">
        <SmallCloseIcon />
      </button>
    ) : (
      <span className={styles.arrowPlaceholder} aria-hidden="true" />
    )}
  </div>
));

DatePickerTrigger.displayName = 'DatePickerTrigger';

export default DatePickerTrigger;
