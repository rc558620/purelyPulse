// 通用主按钮组件，统一全站 CTA 按钮的视觉风格与点击效果。
import React, { memo, useCallback } from 'react';
import { cx } from '@utils/utils';
import { IconSpinner } from '@components/ui/_shared/icons';
import styles from './Button.module.less';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** 按钮变体：primary 绿色主按钮 / secondary 边框次级按钮 / ghost 无背景文字按钮 */
    variant?: ButtonVariant;
    /** 尺寸：md 标准 / lg 大号（默认 lg） */
    size?: ButtonSize;
    /** 是否占满父容器宽度（默认 true） */
    block?: boolean;
    /** 加载中状态，禁用点击并显示 spinner */
    loading?: boolean;
    /** 子内容 */
    children: React.ReactNode;
    /** 自定义类名 */
    className?: string;
}

/** 全站通用主按钮 */
const Button = memo(function Button({
    variant = 'primary',
    size = 'lg',
    block = true,
    loading = false,
    children,
    className,
    disabled,
    type = 'button',
    onMouseDown,
    onTouchStart,
    ...rest
}: ButtonProps) {
    const isDisabled = disabled || loading;

    // loading 态下包装事件处理器：阻止 onMouseDown / onTouchStart 传播，
    // 因为部分浏览器中 disabled 按钮仍可触发这些事件
    const handleMouseDown = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            if (loading) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            onMouseDown?.(e);
        },
        [loading, onMouseDown],
    );

    const handleTouchStart = useCallback(
        (e: React.TouchEvent<HTMLButtonElement>) => {
            if (loading) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            onTouchStart?.(e);
        },
        [loading, onTouchStart],
    );

    return (
        <button
            type={type}
            disabled={isDisabled}
            className={cx(
                styles.btn,
                styles[`variant-${variant}`],
                styles[`size-${size}`],
                block && styles.block,
                loading && styles.loading,
                className,
            )}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            {...rest}
        >
            {loading ? (
                <span className={styles.loadingRow}>
                    <IconSpinner className={styles.spinner} />
                    {children}
                </span>
            ) : (
                children
            )}
        </button>
    );
});

export default Button;
