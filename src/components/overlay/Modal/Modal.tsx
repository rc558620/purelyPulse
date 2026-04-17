import React, { useCallback, type ReactNode } from 'react';
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
  const handleOverlayClick = useCallback(() => {
    onCancel();
  }, [onCancel]);

  const handleContentClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  if (!visible) return null;

  return ReactDOM.createPortal(
    <div
      className={cx(styles.modalOverlay, className)}
      onClick={handleOverlayClick}
    >
      <div className={styles.modalContent} onClick={handleContentClick}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{title}</h3>
        </div>
        <div className={styles.modalBody}>{children}</div>
        <div className={styles.modalFooter}>
          <button className={styles.modalCancelBtn} onClick={onCancel}>
            {cancelText}
          </button>
          <button className={styles.modalConfirmBtn} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default React.memo(Modal);
