/**
 * OperationModalShell —— 通用业务操作弹窗骨架
 *
 * 职责（单一）：负责弹窗视觉容器与通用交互，不关心业务字段：
 *   - overlay 遮罩 + backdrop 点击关闭
 *   - ESC 键关闭（统一注册，子组件无需重复）
 *   - 标题行（icon + title + ✕ 关闭按钮）
 *   - 可滚动 body 插槽
 *   - 底部 取消 / 确认 按钮行
 *
 * 两种展示形态（variant）：
 *   - `sheet`（默认）：底部抽屉，mobile 从底部滑入，desktop 居中
 *   - `center`       ：始终居中弹出（小表单、确认操作等）
 *
 * 使用方式：
 *   <OperationModalShell
 *     ariaLabel="新增进货单"
 *     icon={<IconPackage />}
 *     title="新增进货单"
 *     confirmText="确认进货"
 *     confirmIcon={<IconCheck />}
 *     onClose={onClose}
 *     onConfirm={handleConfirm}
 *   >
 *     {body JSX}
 *   </OperationModalShell>
 */
import React, { type ReactNode, useCallback, useEffect } from 'react';
import { cx } from '@utils/utils';
import styles from './OperationModalShell.module.less';

// ─── 内联关闭图标（自洽，不依赖外部图标集）──────────────────────

const IconClose: React.FC = () => (
  <svg
    width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    aria-hidden="true"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── Props ──────────────────────────────────────────────────────

export interface OperationModalShellProps {
  /** dialog aria-label，用于无障碍 */
  ariaLabel: string;
  /** 标题左侧图标 */
  icon: ReactNode;
  /** 标题文字 */
  title: string;
  /** 确认按钮文字，默认"确认" */
  confirmText?: string;
  /** 确认按钮左侧图标，可选 */
  confirmIcon?: ReactNode;
  /** 取消按钮文字，默认"取消" */
  cancelText?: string;
  /** 弹窗内容 */
  children: ReactNode;
  /** 关闭回调（遮罩点击 / ESC / ✕ 按钮） */
  onClose: () => void;
  /** 确认回调 */
  onConfirm: () => void;
  /**
   * 展示形态
   * - `sheet`（默认）：底部抽屉（mobile）/ 居中（desktop）
   * - `center`       ：始终居中弹窗
   */
  variant?: 'sheet' | 'center';
  /** 弹窗最大宽度，默认 52rem。通过 CSS 变量 --modal-max-width 注入 */
  maxWidth?: string;
}

// ─── 组件 ──────────────────────────────────────────────────────

const OperationModalShell: React.FC<OperationModalShellProps> = ({
  ariaLabel,
  icon,
  title,
  confirmText  = '确认',
  confirmIcon,
  cancelText   = '取消',
  children,
  onClose,
  onConfirm,
  variant      = 'sheet',
  maxWidth,
}) => {
  const isCenter = variant === 'center';

  // ─── ESC 关闭 ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleBackdrop = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  return (
    <div
      className={cx(styles.overlay, isCenter && styles.overlayCenter)}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={handleBackdrop}
      style={maxWidth ? ({ '--modal-max-width': maxWidth } as React.CSSProperties) : undefined}
    >
      <div className={cx(styles.card, isCenter && styles.cardCenter)}>

        {/* ── 标题行 ── */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>{icon}</div>
          <h2 className={styles.headerTitle}>{title}</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="关闭"
          >
            <IconClose />
          </button>
        </div>

        {/* ── 可滚动 body 插槽 ── */}
        <div className={cx(styles.body, isCenter && styles.bodyCenter)}>
          {children}
        </div>

        {/* ── 底部操作区 ── */}
        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            {cancelText}
          </button>
          <button type="button" className={styles.confirmBtn} onClick={onConfirm}>
            {confirmIcon}
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );
};

export default OperationModalShell;
