// MonthPickerPcDropdown — PC 端下拉面板
//
// 绝对定位，入场/退场由 CSS animation 控制（dropdownIn / dropdownOut）。
// 自身只负责 UI 渲染，状态由父组件（MonthPicker）通过 props 注入。

import React, { useCallback, memo } from 'react';
import classNames from 'classnames';

import MonthPickerPanel from './MonthPickerPanel';
import styles from './MonthPicker.module.less';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface MonthPickerPcDropdownProps {
  /** 是否正在退场动画（用于切换 dropdownClosing 类） */
  isClosing: boolean;
  /** 当前年份，传给 MonthPickerPanel */
  year: number;
  /** 当前月份（1-12），传给 MonthPickerPanel */
  month: number;
  /** 向前追溯年数 */
  pastYears?: number;
  /** 向后预留年数 */
  futureYears?: number;
  /** 用户确认选择后回调 */
  onConfirm: (year: number, month: number) => void;
  /** 关闭面板 */
  onClose: () => void;
  /** 退场动画结束时回调（用于通知父组件彻底卸载） */
  onAnimationEnd: () => void;
}

// ─── 组件 ─────────────────────────────────────────────────────────────────────

const MonthPickerPcDropdown: React.FC<MonthPickerPcDropdownProps> = ({
  isClosing,
  year,
  month,
  pastYears,
  futureYears,
  onConfirm,
  onClose,
  onAnimationEnd,
}) => {
  // BUG-4 fix: 只处理容器自身的动画结束事件，校验 animationName 防止子元素冒泡误触
  const handleAnimationEnd = useCallback((e: React.AnimationEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.animationName !== 'dropdownIn' && e.animationName !== 'dropdownOut') return;
    onAnimationEnd();
  }, [onAnimationEnd]);

  return (
    <div
      className={classNames(styles.dropdown, isClosing && styles.dropdownClosing)}
      onAnimationEnd={handleAnimationEnd}
      role="dialog"
      aria-modal="true"
      aria-label="选择年月"
    >
      <MonthPickerPanel
        year={year}
        month={month}
        visible={!isClosing}
        pastYears={pastYears}
        futureYears={futureYears}
        onConfirm={onConfirm}
        onClose={onClose}
      />
    </div>
  );
};

MonthPickerPcDropdown.displayName = 'MonthPickerPcDropdown';

export default memo(MonthPickerPcDropdown);
