// MonthPickerMobileSheet — 移动端底部弹出层（BottomSheet）
//
// 通过 ReactDOM.createPortal 挂到 body，规避父容器 overflow:hidden 裁剪。
// 自身只负责 UI 渲染，状态由父组件（MonthPicker）通过 props 注入。
//
// BUG-2/3 fix: 遮罩常驻 DOM，通过类名控制入场/退场动画；
// 关闭时 isClosing=true 触发退场，onTransitionEnd 通知父组件卸载

import React, { useCallback, memo } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';

import MonthPickerPanel from './MonthPickerPanel';
import styles from './MonthPicker.module.less';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface MonthPickerMobileSheetProps {
  /** 面板是否可见（控制 BottomSheet 滑入/滑出） */
  visible: boolean;
  /** 是否正在退场动画（控制遮罩淡出 + 面板滑出） */
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
  /** 退场动画结束时回调（BottomSheet transform 结束后通知父组件卸载） */
  onTransitionEnd: () => void;
}

// ─── 组件 ─────────────────────────────────────────────────────────────────────

const MonthPickerMobileSheet: React.FC<MonthPickerMobileSheetProps> = ({
  visible,
  isClosing,
  year,
  month,
  pastYears,
  futureYears,
  onConfirm,
  onClose,
  onTransitionEnd,
}) => {
  // BUG-3 fix: 只在 isClosing 时处理 transform 结束事件
  const handleTransitionEnd = useCallback((e: React.TransitionEvent) => {
    // 只响应 bottomSheet 自身的 transform 过渡，忽略子元素冒泡
    if (e.target !== e.currentTarget) return;
    if (e.propertyName !== 'transform') return;
    if (isClosing) {
      onTransitionEnd();
    }
  }, [isClosing, onTransitionEnd]);

  // BUG-3 fix: 遮罩退场动画期间禁止 onClick，防止穿透
  const handleMaskClick = useCallback(() => {
    if (isClosing) return;
    onClose();
  }, [isClosing, onClose]);

  return ReactDOM.createPortal(
    <>
      {/* 遮罩：常驻 DOM，通过类名控制入场/退场动画，关闭时不再瞬间消失 */}
      <div
        className={classNames(
          styles.mask,
          visible && !isClosing && styles.maskVisible,
          isClosing && styles.maskClosing,
        )}
        onClick={handleMaskClick}
        aria-hidden="true"
      />

      {/* BottomSheet：常驻 DOM，通过 CSS transform 控制滑入/滑出，保证动画流畅 */}
      {/* BUG-10 fix: 增加 bottomSheetClosing 显式退场类，保证退场时 GPU 层不被提前回收 */}
      <div
        className={classNames(
          styles.bottomSheet,
          visible && !isClosing && styles.bottomSheetVisible,
          isClosing && styles.bottomSheetClosing,
        )}
        onTransitionEnd={handleTransitionEnd}
        role="dialog"
        aria-modal="true"
        aria-label="选择年月"
      >
        {/* 头部把手 + 标题行 */}
        <div className={styles.sheetHeader}>
          <div className={styles.sheetHandle} aria-hidden="true" />
          <div className={styles.sheetTitleRow}>
            <button
              type="button"
              className={styles.sheetCancelBtn}
              onClick={onClose}
            >
              取消
            </button>
            <span className={styles.sheetTitle}>选择年月</span>
            {/* 右侧占位，保持标题居中 */}
            <div className={styles.sheetHeaderRight} />
          </div>
        </div>

        {/* 面板核心：滚轮 + 确定/本月 */}
        <MonthPickerPanel
          year={year}
          month={month}
          visible={visible && !isClosing}
          pastYears={pastYears}
          futureYears={futureYears}
          onConfirm={onConfirm}
          onClose={onClose}
        />
      </div>
    </>,
    document.body,
  ) as React.ReactElement;
};

MonthPickerMobileSheet.displayName = 'MonthPickerMobileSheet';

export default memo(MonthPickerMobileSheet);
