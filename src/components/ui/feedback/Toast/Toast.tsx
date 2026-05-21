// 全局 Toast 提示组件，支持 default / success / error / warning / info 五种类型。
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { cx, fallbackKey, isNonEmptyArray } from '@utils/utils';
import { IconToastSuccess, IconToastWarning, IconToastError, IconToastInfo } from '@components/ui/_shared/icons';
import styles from './Toast.module.less';
import { TOAST_EVENT, DEFAULT_DURATION, LEAVE_DURATION } from './constants';
import type { ToastItem, ToastType, ShowToastOptions } from './types';

// ─── 内置图标 ──────────────────────────────────────────────────────────────────

/** 根据 type 返回对应的内置图标节点映射（模块级常量，仅创建一次）。 */
const BUILTIN_ICONS: Partial<Record<ToastType, React.JSX.Element>> = {
    success: <IconToastSuccess className={styles.icon} />,
    warning: <IconToastWarning className={styles.icon} />,
    error: <IconToastError className={styles.icon} />,
    info: <IconToastInfo className={styles.icon} />,
};

/**
 * 解析最终渲染图标：
 * - 调用方传入了自定义 icon → 渲染自定义节点（null 表示强制隐藏）
 * - 未传 icon → 使用 type 对应的内置图标（default 类型无内置图标）
 * @param type  - Toast 类型。
 * @param icon  - 外部传入的图标节点（undefined 表示未传）。
 * @returns 需要渲染的图标节点，或 null。
 */
const resolveIcon = (type: ToastType, icon?: React.ReactNode): React.ReactNode => {
    if (icon !== undefined) return icon ?? null;
    return BUILTIN_ICONS[type] ?? null;
};

// ─── 单条 Toast 子组件（memo 隔离，避免列表中其他条目触发重渲染）─────────────

interface ToastCardProps {
    toast: ToastItem;
    onDismiss: (id: string) => void;
}

const ToastCard = memo(function ToastCard({ toast, onDismiss }: ToastCardProps) {
    const handleClick = useCallback(() => onDismiss(toast.id), [onDismiss, toast.id]);

    return (
        <div
            className={cx(
                styles.toastWrapper,
                toast.leaving && styles.wrapperLeaving,
            )}
        >
            <div
                className={cx(
                    styles.toast,
                    styles[toast.type],
                    toast.leaving && styles.leaving,
                )}
                role="alert"
                onClick={handleClick}
            >
                {resolveIcon(toast.type, toast.icon)}
                <span>{toast.message}</span>
            </div>
        </div>
    );
});

// ─── ToastContainer 组件 ──────────────────────────────────────────────────────

/** ToastContainer：全局挂载一次，监听事件并渲染所有 Toast。 */
export const ToastContainer = memo(function ToastContainer(): React.JSX.Element | null {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    // 用 ref 缓存 timer id，避免闭包过期问题。
    const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    /**
     * 触发指定 Toast 离场动画，动画结束后从列表移除。
     * @param id - 需要移除的 Toast id。
     */
    const dismissToast = useCallback((id: string): void => {
        setToasts(prev => prev.map(t => (t.id === id ? { ...t, leaving: true } : t)));
        const removeTimer = setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
            timersRef.current.delete(id);
        }, LEAVE_DURATION);
        timersRef.current.set(`${id}-remove`, removeTimer);
    }, []);

    useEffect(() => {
        /**
         * 监听全局 toast 事件，生成新的 ToastItem 并加入列表。
         * @param event - 携带 ShowToastOptions 的 CustomEvent。
         */
        const handleToastEvent = (event: Event): void => {
            const { message, type = 'default', duration = DEFAULT_DURATION, icon } = (event as CustomEvent<ShowToastOptions>).detail;
            const id = fallbackKey('toast');

            setToasts(prev => [...prev, { id, message, type, icon, leaving: false }]);

            const autoTimer = setTimeout(() => dismissToast(id), duration);
            timersRef.current.set(id, autoTimer);
        };

        window.addEventListener(TOAST_EVENT, handleToastEvent);
        const currentTimers = timersRef.current;
        return () => {
            window.removeEventListener(TOAST_EVENT, handleToastEvent);
            // 页面卸载时清理所有计时器。
            currentTimers.forEach(timer => clearTimeout(timer));
            currentTimers.clear();
        };
    }, [dismissToast]);

    if (!isNonEmptyArray(toasts)) {
        return null;
    }

    return (
        <div className={styles.toastContainer} role="region" aria-live="polite" aria-label="提示消息">
            {toasts.map(toast => (
                <ToastCard key={toast.id} toast={toast} onDismiss={dismissToast} />
            ))}
        </div>
    );
});
