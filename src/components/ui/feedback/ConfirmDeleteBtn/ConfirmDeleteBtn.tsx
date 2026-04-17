/**
 * ConfirmDeleteBtn —— 二步确认删除按钮（全局公共组件）
 *
 * 交互：
 *   - 第一次点击：进入"确认态"（按钮变色 + 显示确认文字）
 *   - 第二次点击（确认态内）：触发 onDelete
 *   - 3 秒无操作自动复位（可通过 timeout 定制）
 *
 * 布局定制：通过 className / confirmClassName 传入额外样式。
 * 例：ShiftItem 需要固定宽度 + 左边框 → 传 styles.deleteBtn（父组件 less 定义）
 */
import React, { useState, useCallback, useEffect, useRef, memo } from 'react';
import { cx } from '@utils/utils';
import styles from './ConfirmDeleteBtn.module.less';

// ─── 内联图标（不依赖任何模块图标文件）────────────────────────

const IconTrash: React.FC<{ size?: string }> = ({ size = '14' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

// ─── Props ──────────────────────────────────────────────────────

export interface ConfirmDeleteBtnProps {
  /** 删除确认后触发 */
  onDelete: () => void;
  /** 初始态 aria-label，默认 "删除" */
  ariaLabel?: string;
  /** 确认态 aria-label，默认 "确认删除" */
  confirmAriaLabel?: string;
  /** 确认态显示的文字，默认 "确认" */
  confirmText?: string;
  /** 自动复位超时（ms），默认 3000 */
  timeout?: number;
  /** 图标尺寸（px 字符串），默认 "14" */
  iconSize?: string;
  /** 追加到按钮的 className（控制布局：宽度/方向/边框等） */
  className?: string;
  /** 额外追加到确认态的 className */
  confirmClassName?: string;
}

// ─── 组件 ──────────────────────────────────────────────────────

const ConfirmDeleteBtn: React.FC<ConfirmDeleteBtnProps> = ({
  onDelete,
  ariaLabel        = '删除',
  confirmAriaLabel = '确认删除',
  confirmText      = '确认',
  timeout          = 3000,
  iconSize         = '14',
  className,
  confirmClassName,
}) => {
  const [confirming, setConfirming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 组件卸载时清理定时器，防止内存泄漏
  useEffect(() => () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
  }, []);

  const handleClick = useCallback(() => {
    if (confirming) {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      onDelete();
    } else {
      setConfirming(true);
      timerRef.current = setTimeout(() => {
        setConfirming(false);
        timerRef.current = null;
      }, timeout);
    }
  }, [confirming, onDelete, timeout]);

  return (
    <button
      type="button"
      className={cx(
        styles.deleteBtn,
        confirming && styles.deleteBtnConfirm,
        className,
        confirming && confirmClassName,
      )}
      onClick={handleClick}
      aria-label={confirming ? confirmAriaLabel : ariaLabel}
    >
      <IconTrash size={iconSize} />
      {confirming && <span className={styles.confirmText}>{confirmText}</span>}
    </button>
  );
};

export default memo(ConfirmDeleteBtn);
