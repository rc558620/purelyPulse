// 确认弹窗组件 - 基于 Modal 扩展，支持图标和危险操作样式
import React, { useCallback, useMemo, type ReactNode } from 'react';
import ReactDOM from 'react-dom';
import { cx } from '@utils/utils';
import styles from './ConfirmModal.module.less';

export type ConfirmModalVariant = 'default' | 'danger' | 'primary' | 'warning';

export interface ConfirmModalProps {
    /** 是否显示 */
    visible: boolean;
    /** 标题 */
    title: ReactNode;
    /** 描述内容 */
    description?: ReactNode;
    /** 自定义内容（children） */
    children?: ReactNode;
    /** 图标 */
    icon?: ReactNode;
    /** 取消按钮文案 */
    cancelText?: string;
    /** 确认按钮文案 */
    confirmText?: string;
    /** 按钮样式变体 */
    variant?: ConfirmModalVariant;
    /** 取消回调 */
    onCancel: () => void;
    /** 确认回调 */
    onConfirm: () => void;
    /** 自定义类名 */
    className?: string;
}

/** 确认弹窗组件 */
const ConfirmModal: React.FC<ConfirmModalProps> = ({
    visible,
    title,
    description,
    children,
    icon,
    cancelText = '取消',
    confirmText = '确定',
    variant = 'default',
    onCancel,
    onConfirm,
    className,
}) => {
    const handleCancel = useCallback(() => {
        onCancel();
    }, [onCancel]);

    const handleConfirm = useCallback(() => {
        onConfirm();
    }, [onConfirm]);

    const iconClass = useMemo(() => cx(
        styles.modalIcon,
        variant === 'danger' && styles.modalIconDanger,
        variant === 'primary' && styles.modalIconPrimary,
        variant === 'warning' && styles.modalIconWarning
    ), [variant]);

    const confirmBtnClass = useMemo(() => cx(
        styles.modalConfirmBtn,
        variant === 'danger' && styles.modalConfirmBtnDanger,
        variant === 'primary' && styles.modalConfirmBtnPrimary,
        variant === 'warning' && styles.modalConfirmBtnWarning
    ), [variant]);

    if (!visible) return null;

    return ReactDOM.createPortal(
        <div
            className={cx(styles.modalOverlay, className)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
        >
            <div className={styles.modalCard}>
                {icon && <div className={iconClass} aria-hidden="true">{icon}</div>}
                <h3 id="confirm-modal-title" className={styles.modalTitle}>{title}</h3>
                {description && <p className={styles.modalDesc}>{description}</p>}
                {children}
                <div className={styles.modalActions}>
                    <button className={styles.modalCancelBtn} onClick={handleCancel} type="button">
                        {cancelText}
                    </button>
                    <button className={confirmBtnClass} onClick={handleConfirm} type="button">
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default React.memo(ConfirmModal);
