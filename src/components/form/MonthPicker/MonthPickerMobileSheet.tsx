// MonthPickerMobileSheet — 移动端底部弹出层（BottomSheet）
//
// 通过 ReactDOM.createPortal 挂到 body，规避父容器 overflow:hidden 裁剪。
// 自身只负责 UI 渲染，状态由父组件（MonthPicker）通过 props 注入。

import React, { memo } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';

import MonthPickerPanel from './MonthPickerPanel';
import styles from './MonthPicker.module.less';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface MonthPickerMobileSheetProps {
  /** 面板是否可见（控制 BottomSheet 滑入/滑出） */
  visible: boolean;
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
}

// ─── 组件 ─────────────────────────────────────────────────────────────────────

const MonthPickerMobileSheet: React.FC<MonthPickerMobileSheetProps> = ({
  visible,
  year,
  month,
  pastYears,
  futureYears,
  onConfirm,
  onClose,
}) => ReactDOM.createPortal(
  <>
    {/* 遮罩：仅 visible 时渲染，点击关闭 */}
    {visible && (
      <div className={styles.mask} onClick={onClose} aria-hidden="true" />
    )}

    {/* BottomSheet：常驻 DOM，通过 CSS transform 控制滑入/滑出，保证动画流畅 */}
    <div
      className={classNames(styles.bottomSheet, visible && styles.bottomSheetVisible)}
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
        pastYears={pastYears}
        futureYears={futureYears}
        onConfirm={onConfirm}
        onClose={onClose}
      />
    </div>
  </>,
  document.body,
) as React.ReactElement;

MonthPickerMobileSheet.displayName = 'MonthPickerMobileSheet';

export default memo(MonthPickerMobileSheet);
