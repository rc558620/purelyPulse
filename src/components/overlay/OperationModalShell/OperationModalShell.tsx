// 通用业务操作弹窗骨架
//
// 职责（单一）：负责弹窗视觉容器与通用交互，不关心业务字段：
//   - overlay 遮罩 + backdrop 点击关闭
//   - ESC 键关闭（栈式管理：仅最顶层弹窗响应，不会穿透到下层）
//   - 标题行（icon + title + ✕ 关闭按钮）
//   - 可滚动 body 插槽
//   - 底部 取消 / 确认 按钮行
//   - body scroll lock（弹窗打开期间阻止背景页面滚动）
//   - focus trap（Tab 键焦点不逃逸到弹窗外）
//   - 自动聚焦（打开后焦点移入弹窗，关闭后恢复）
//
// 两种展示形态（variant）：
//   - `sheet`（默认）：底部抽屉，mobile 从底部滑入，desktop 居中
//   - `center`       ：始终居中弹出（小表单、确认操作等）
//
// 使用方式：
//   <OperationModalShell
//     ariaLabel="新增进货单"
//     icon={<IconPackage />}
//     title="新增进货单"
//     confirmText="确认进货"
//     confirmIcon={<IconCheck />}
//     onClose={onClose}
//     onConfirm={handleConfirm}
//   >
//     {body JSX}
//   </OperationModalShell>
import React, { type ReactNode, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { cx } from '@utils/utils';
import { IconClose } from '../_shared/icons';
import styles from './OperationModalShell.module.less';

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
  /** 确认按钮禁用（灰显不可点），默认 false */
  confirmDisabled?: boolean;
  /**
   * 展示形态
   * - `sheet`（默认）：底部抽屉（mobile）/ 居中（desktop）
   * - `center`       ：始终居中弹窗
   */
  variant?: 'sheet' | 'center';
  /** 弹窗最大宽度，默认 52rem。通过 CSS 变量 --modal-max-width 注入 */
  maxWidth?: string;
  /** 桌面端纵向对齐方式，默认 center；需要避免高度变化抖动时可用 top；variant=center 时此 prop 无效 */
  desktopAlign?: 'center' | 'top';
  /** 点击遮罩是否允许关闭，默认 true */
  closeOnBackdropClick?: boolean;
}

// ─── 弹窗栈计数器（BUG-1：多实例 ESC 仅最顶层响应）─────────────────

let openModalCount = 0;

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
  confirmDisabled = false,
  variant      = 'sheet',
  maxWidth,
  desktopAlign = 'center',
  closeOnBackdropClick = true,
}) => {
  const isCenter = variant === 'center';
  // BUG-10: variant=center 时 desktopAlign 无效，始终居中
  const isDesktopTop = !isCenter && desktopAlign === 'top';

  // ─── Refs ────────────────────────────────────────────────────
  const overlayRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  // BUG-5: 用 ref 缓存最新回调，避免 onClose 引用变化导致监听器反复注册
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // ─── BUG-2: body scroll lock ─────────────────────────────────
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // ─── BUG-1 + BUG-5: ESC 关闭（栈式管理，仅最顶层响应）─────
  useEffect(() => {
    // 递增栈计数
    openModalCount += 1;
    const myOrder = openModalCount;

    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // 只有当前实例是栈顶（最新的）才响应
      if (myOrder !== openModalCount) return;
      e.stopImmediatePropagation();
      onCloseRef.current();
    };

    window.addEventListener('keydown', handler);
    return () => {
      openModalCount -= 1;
      window.removeEventListener('keydown', handler);
    };
  }, []);

  // ─── BUG-7 + BUG-8: Focus Trap + 自动聚焦 ──────────────────
  useEffect(() => {
    // BUG-8: 记录触发元素，打开时自动聚焦到弹窗内第一个可交互元素
    previouslyFocusedRef.current = document.activeElement as HTMLElement;

    const overlay = overlayRef.current;
    if (!overlay) return;

    // 自动聚焦到弹窗内第一个可聚焦元素
    const autoFocusTarget = overlay.querySelector<HTMLElement>(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (autoFocusTarget) {
      autoFocusTarget.focus();
    } else {
      // 没有可聚焦元素时聚焦到 overlay 本身
      overlay.focus();
    }

    // BUG-7: focus trap — Tab/Shift+Tab 在弹窗内循环
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableSelectors = [
        'button:not([disabled])',
        '[href]',
        'input',
        'select',
        'textarea',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');

      const focusableElements = overlay.querySelectorAll<HTMLElement>(focusableSelectors);
      if (focusableElements.length === 0) {
        e.preventDefault();
        return;
      }

      const firstEl = focusableElements[0];
      const lastEl = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: 从第一个元素跳到最后一个
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        // Tab: 从最后一个元素跳到第一个
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    overlay.addEventListener('keydown', handleKeyDown);
    return () => {
      overlay.removeEventListener('keydown', handleKeyDown);
      // 关闭时恢复焦点到触发元素
      if (previouslyFocusedRef.current && typeof previouslyFocusedRef.current.focus === 'function') {
        previouslyFocusedRef.current.focus();
      }
    };
  }, []);

  // ─── backdrop 点击 ──────────────────────────────────────────
  const handleOverlayClick = useCallback(() => {
    if (closeOnBackdropClick) onClose();
  }, [closeOnBackdropClick, onClose]);

  // ─── BUG-6: SSR 兼容 ────────────────────────────────────────
  if (typeof document === 'undefined') return null;

  return ReactDOM.createPortal(
    <div
      ref={overlayRef}
      className={cx(
        styles.overlay,
        isCenter && styles.overlayCenter,
        isDesktopTop && styles.overlayDesktopTop,
      )}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      tabIndex={-1}
      style={maxWidth ? ({ '--modal-max-width': maxWidth } as React.CSSProperties) : undefined}
      onClick={handleOverlayClick}
    >
      <div className={cx(styles.card, isCenter && styles.cardCenter)} onClick={(event) => event.stopPropagation()}>

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
          {/* BUG-3: 移除冗余的 onClick 条件判断，disabled 属性已阻止 click */}
          <button
            type="button"
            className={cx(styles.confirmBtn, confirmDisabled && styles.confirmBtnDisabled)}
            onClick={onConfirm}
            disabled={confirmDisabled}
            aria-disabled={confirmDisabled || undefined}
          >
            {confirmIcon}
            {confirmText}
          </button>
        </div>

      </div>
    </div>,
    document.body,
  );
};

export default OperationModalShell;
