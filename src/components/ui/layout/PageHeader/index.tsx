import React, { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PageHeader.module.less';

export type PageHeaderVariant = 'sticky' | 'transparent' | 'absolute' | 'relative';

export interface PageHeaderProps {
    /** 页面标题，不传则不渲染标题与右侧占位 */
    title?: string;
    /** 点击返回按钮的回调，不传则默认执行 navigate(-1) */
    onBack?: () => void;
    /**
     * 定位模式
     * - `sticky`（默认）：吸顶 + 模糊背景 + 下边框
     * - `transparent`：吸顶 + 透明背景 + 无边框，适合有背景装饰的页面（如 Profile）
     * - `absolute`：绝对定位，适合全屏居中布局（overflow: hidden）
     * - `relative`：普通文档流
     */
    variant?: PageHeaderVariant;
    /** 右侧自定义内容 */
    rightExtra?: React.ReactNode;
    /** 返回按钮右侧（左区域）的额外内容，如视图模式切换按钮 */
    leftExtra?: React.ReactNode;
}

/** 返回箭头图标 — 模块级常量，避免每次渲染重建 JSX */
const BACK_ICON = (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d="M15 18l-6-6 6-6" />
    </svg>
);

const variantClass: Record<PageHeaderVariant, string> = {
    sticky: styles.header,
    transparent: styles.headerTransparent,
    absolute: styles.headerAbsolute,
    relative: styles.headerRelative,
};

const PageHeader = memo(function PageHeader({
    title,
    onBack,
    variant = 'sticky',
    rightExtra,
    leftExtra,
}: PageHeaderProps) {
    const navigate = useNavigate();

    const handleBack = useCallback((): void => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    }, [onBack, navigate]);

    return (
        <header className={variantClass[variant]}>
            <div className={styles.left}>
                <button
                    className={styles.backBtn}
                    onClick={handleBack}
                    aria-label="返回"
                    type="button"
                >
                    {BACK_ICON}
                </button>
                {leftExtra}
            </div>
            {title && (
                <>
                    <h1 className={styles.title}>{title}</h1>
                    <div className={styles.right}>
                        {rightExtra}
                    </div>
                </>
            )}
        </header>
    );
});

export default PageHeader;
