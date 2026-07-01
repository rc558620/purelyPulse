// 确认弹窗组件 - 基于 Modal 扩展，支持图标和危险操作样式
import React, { useEffect, useId, useMemo, type ReactNode } from 'react';
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
    // Bug 11: 使用 useId 替代硬编码 id，避免多实例 id 冲突
    const reactId = useId();
    const titleId = `confirm-modal-title-${reactId.replace(/:/g, '')}`;

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

    // Bug 8: 移除多余的 useCallback 包裹，直接使用 props 回调
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
            aria-labelledby={titleId}
        >
            <div className={styles.modalCard}>
                {icon && <div className={iconClass} aria-hidden="true">{icon}</div>}
                <h3 id={titleId} className={styles.modalTitle}>{title}</h3>
                {description && <p className={styles.modalDesc}>{description}</p>}
                {children}
                <div className={styles.modalActions}>
                    <button className={styles.modalCancelBtn} onClick={onCancel} type="button">
                        {cancelText}
                    </button>
                    <button className={confirmBtnClass} onClick={onConfirm} type="button">
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default React.memo(ConfirmModal);
