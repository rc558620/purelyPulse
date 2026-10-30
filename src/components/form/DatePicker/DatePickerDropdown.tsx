// DatePickerDropdown — PC 端下拉面板（Portal + fixed 定位，避免被父容器 overflow 裁切）
// 位置由 useDatePicker 计算后传入，top / bottom 二选一：
// 向上弹出时必须用 bottom 贴住触发器上边，否则面板会从触发器顶部「向下」展开。

import React, { memo, type RefObject } from 'react';
import ReactDOM from 'react-dom';
import type { DropdownPos } from './useDatePicker';
import styles from './DatePicker.module.less';

export interface DatePickerDropdownProps {
  /** 是否 datetime 模式 */
  isDatetime: boolean;
  /** 弹出方向 */
  placement: 'top' | 'bottom';
  /** 是否处于退出动画中 */
  isClosing: boolean;
  /** 面板定位（fixed，相对视口） */
  pos: DropdownPos | null;
  /** 面板 ref，用于点击外部判定排除面板内部 */
  panelRef: RefObject<HTMLDivElement | null>;
  /** 退出动画结束回调（真正卸载） */
  onAnimationEnd: () => void;
  /** 面板内容 */
  children: React.ReactNode;
}

const DatePickerDropdown: React.FC<DatePickerDropdownProps> = memo(({
  isDatetime,
  placement,
  isClosing,
  pos,
  panelRef,
  onAnimationEnd,
  children,
}) => ReactDOM.createPortal(
  <div
    ref={panelRef}
    className={`${styles.dropdown}${isDatetime ? ` ${styles.dropdownDatetime}` : ''}${placement === 'top' ? ` ${styles.dropdownTop}` : ` ${styles.dropdownBottom}`}${isClosing ? ` ${styles.dropdownClosing}` : ''}`}
    style={{
      position: 'fixed',
      top:      pos?.top ?? 'auto',
      bottom:   pos?.bottom ?? 'auto',
      left:     pos?.left ?? 0,
    }}
    onAnimationEnd={onAnimationEnd}
    role="dialog"
    aria-modal="true"
  >
    {children}
  </div>,
  document.body,
));

DatePickerDropdown.displayName = 'DatePickerDropdown';

export default DatePickerDropdown;
