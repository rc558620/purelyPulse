// 通用主按钮组件，统一全站 CTA 按钮的视觉风格与点击效果。
import React, { memo } from 'react';
import { cx } from '@utils/utils';
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

/** 加载 Spinner — 静态节点，避免每次渲染重建 */
const Spinner = memo(function Spinner() {
    return (
        <svg
            className={styles.spinner}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden="true"
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    );
});

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
    ...rest
}: ButtonProps) {
    const isDisabled = disabled || loading;

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
            {...rest}
        >
            {loading ? (
                <span className={styles.loadingRow}>
                    <Spinner />
                    {children}
                </span>
            ) : (
                children
            )}
        </button>
    );
});

export default Button;
