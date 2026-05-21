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
import { IconTrash } from '@components/ui/_shared/icons';
import styles from './ConfirmDeleteBtn.module.less';

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
  const disabledResetRef = useRef(false);
  const isConfirming = confirming && !disabled && !disabledResetRef.current;

  useEffect(() => () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
  }, []);

  useEffect(() => {
    if (!disabled) {
      return;
    }

    disabledResetRef.current = true;
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [disabled]);

  const handleClick = useCallback(() => {
    if (disabled) {
      return;
    }

    if (isConfirming) {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      disabledResetRef.current = false;
      setConfirming(false);
      onDelete();
      return;
    }

    disabledResetRef.current = false;
    setConfirming(true);
    timerRef.current = setTimeout(() => {
      disabledResetRef.current = false;
      setConfirming(false);
      timerRef.current = null;
    }, timeout);
  }, [disabled, isConfirming, onDelete, timeout]);

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
