// 全局 Toast 提示组件，支持 default / success / error / warning / info 五种类型。
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { cx, fallbackKey, isNonEmptyArray } from '@utils/utils';
import styles from './Toast.module.less';
import { TOAST_EVENT, DEFAULT_DURATION, LEAVE_DURATION } from './constants';
import type { ToastItem, ToastType, ShowToastOptions } from './types';

// ─── 内置图标 ──────────────────────────────────────────────────────────────────

/** 成功图标：Ant Design CheckCircleFilled */
const IconSuccess = memo(function IconSuccess() {
    return (
        <svg className={styles.icon} viewBox="64 64 896 896" fill="currentColor" aria-hidden="true">
            <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm193.5 301.7l-210.6 292a31.8 31.8 0 01-51.7 0L318.5 484.9c-3.8-5.3 0-12.7 6.5-12.7h46.9c10.2 0 19.9 4.9 25.9 13.3l71.2 98.8 157.2-218c6-8.3 15.6-13.3 25.9-13.3H699c6.5 0 10.3 7.4 6.5 12.7z" />
        </svg>
    );
});

/** 警告图标：Ant Design ExclamationCircleFilled */
const IconWarning = memo(function IconWarning() {
    return (
        <svg className={styles.icon} viewBox="64 64 896 896" fill="currentColor" aria-hidden="true">
            <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm-32 232c0-4.4 3.6-8 8-8h48c4.4 0 8 3.6 8 8v272c0 4.4-3.6 8-8 8h-48c-4.4 0-8-3.6-8-8V296zm32 440a48.01 48.01 0 010-96 48.01 48.01 0 010 96z" />
        </svg>
    );
});

/** 错误图标：Ant Design CloseCircleFilled */
const IconError = memo(function IconError() {
    return (
        <svg className={styles.icon} viewBox="64 64 896 896" fill="currentColor" aria-hidden="true">
            <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm165.4 618.2l-66-.3L512 563.4l-99.3 118.4-66.1.3c-4.4 0-8-3.5-8-8 0-1.9.7-3.7 1.9-5.2l130.1-155L340.5 359a8.32 8.32 0 01-1.9-5.2c0-4.4 3.6-8 8-8l66.1.3L512 464.6l99.3-118.4 66-.3c4.4 0 8 3.5 8 8 0 1.9-.7 3.7-1.9 5.2L553.5 514l130 155c1.2 1.5 1.9 3.3 1.9 5.2 0 4.4-3.6 8-8 8z" />
        </svg>
    );
});

/** 信息图标：Ant Design InfoCircleFilled */
const IconInfo = memo(function IconInfo() {
    return (
        <svg className={styles.icon} viewBox="64 64 896 896" fill="currentColor" aria-hidden="true">
            <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm32 664c0 4.4-3.6 8-8 8h-48c-4.4 0-8-3.6-8-8V456c0-4.4 3.6-8 8-8h48c4.4 0 8 3.6 8 8v272zm-32-344a48.01 48.01 0 010-96 48.01 48.01 0 010 96z" />
        </svg>
    );
});

/** 根据 type 返回对应的内置图标节点映射（模块级常量，仅创建一次）。 */
const BUILTIN_ICONS: Partial<Record<ToastType, React.JSX.Element>> = {
    success: <IconSuccess />,
    warning: <IconWarning />,
    error: <IconError />,
    info: <IconInfo />,
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
