// 二步确认删除按钮（全局公共组件）
import React, { useState, useCallback, useEffect, useRef, memo } from 'react';
import { cx } from '@utils/utils';
import { IconTrash } from '@components/ui/_shared/icons';
import styles from './ConfirmDeleteBtn.module.less';

export interface ConfirmDeleteBtnProps {
  /** 删除确认后触发 */
  onDelete: () => void;
  /** 初始态 aria-label，默认 "删除" */
  ariaLabel?: string;
  /** 确认态 aria-label，默认 "确认删除" */
  confirmAriaLabel?: string;
  /** 确认态显示的文字，默认 "确认删除" */
  confirmText?: string;
  /** 自动复位超时（ms），默认 3000 */
  timeout?: number;
  /** 图标尺寸（px 字符串），默认 "14" */
  iconSize?: string;
  /** 追加到按钮的 className（控制布局：宽度/方向/边框等） */
  className?: string;
  /** 额外追加到确认态的 className */
  confirmClassName?: string;
  /** 外部禁用态，默认 false */
  disabled?: boolean;
}

const ConfirmDeleteBtn: React.FC<ConfirmDeleteBtnProps> = ({
  onDelete,
  ariaLabel = '删除',
  confirmAriaLabel = '确认删除',
  confirmText = '确认删除',
  timeout = 3000,
  iconSize = '14',
  className,
  confirmClassName,
  disabled = false,
}) => {
  const [confirming, setConfirming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** 用 ref 追踪 confirming 最新值，避免 useCallback 闭包陈旧 */
  const confirmingRef = useRef(false);
  /** 组件是否已卸载，防止异步回调操作已卸载组件的状态 */
  const mountedRef = useRef(true);

  /** 安全地更新 confirming 状态并同步 ref */
  const updateConfirming = useCallback((value: boolean) => {
    if (!mountedRef.current) return;
    confirmingRef.current = value;
    setConfirming(value);
  }, []);

  /** 清除定时器并置空引用 */
  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /** 启动自动复位定时器 */
  const startResetTimer = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      updateConfirming(false);
      timerRef.current = null;
    }, timeout);
  }, [clearTimer, timeout, updateConfirming]);

  // 组件卸载时：清理定时器 + 标记已卸载
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // disabled 变为 true 时：清除定时器 + 复位确认态
  useEffect(() => {
    if (!disabled) return;
    clearTimer();
    updateConfirming(false);
  }, [disabled, clearTimer, updateConfirming]);

  const handleClick = useCallback(() => {
    if (disabled) return;

    // 确认态 → 触发删除
    if (confirmingRef.current) {
      clearTimer();
      updateConfirming(false);
      onDelete();
      return;
    }

    // 初始态 → 进入确认态
    updateConfirming(true);
    startResetTimer();
  }, [disabled, clearTimer, updateConfirming, startResetTimer, onDelete]);

  const isConfirming = confirming && !disabled;

  return (
    <button
      type="button"
      className={cx(
        styles.deleteBtn,
        isConfirming && styles.deleteBtnConfirm,
        className,
        isConfirming && confirmClassName,
      )}
      onClick={handleClick}
      aria-label={isConfirming ? confirmAriaLabel : ariaLabel}
      disabled={disabled}
      aria-disabled={disabled}
    >
      {!isConfirming && <IconTrash size={iconSize} />}
      {isConfirming && <span className={styles.confirmText}>{confirmText}</span>}
    </button>
  );
};

export default memo(ConfirmDeleteBtn);
