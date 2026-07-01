import React, { useCallback, useEffect, useId, type ReactNode } from 'react';
import ReactDOM from 'react-dom';
import { cx } from '@utils/utils';
import styles from './Modal.module.less';

export interface ModalProps {
  visible: boolean;
  title: ReactNode;
  children: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  cancelText?: string;
  confirmText?: string;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  visible,
  title,
  children,
  onCancel,
  onConfirm,
  cancelText = '取消',
  confirmText = '确定',
  className,
}) => {
  // Bug 11: 使用 useId 生成唯一 id，避免多实例冲突（与 ConfirmModal 统一方案）
  const reactId = useId();
  const titleId = `modal-title-${reactId.replace(/:/g, '')}`;

  // Bug 2: ESC 键关闭支持
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible, onCancel]);

  // Bug 7: 弹窗打开时锁定背景滚动
  useEffect(() => {
    if (!visible) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = originalOverflow; };
  }, [visible]);

  const handleOverlayClick = useCallback(() => {
    onCancel();
  }, [onCancel]);

  const handleContentClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  if (!visible) return null;

  // Bug 3: 添加无障碍属性 role="dialog", aria-modal, aria-labelledby
  // Bug 1: 按钮添加 type="button"
  return ReactDOM.createPortal(
    <div
      className={cx(styles.modalOverlay, className)}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className={styles.modalContent} onClick={handleContentClick}>
        <div className={styles.modalHeader}>
          <h3 id={titleId} className={styles.modalTitle}>{title}</h3>
        </div>
        {/* Bug 9: modalBody 添加滚动支持（通过 CSS max-height + overflow-y） */}
        <div className={styles.modalBody}>{children}</div>
        <div className={styles.modalFooter}>
          <button className={styles.modalCancelBtn} onClick={onCancel} type="button">
            {cancelText}
          </button>
          <button className={styles.modalConfirmBtn} onClick={onConfirm} type="button">
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default React.memo(Modal);
