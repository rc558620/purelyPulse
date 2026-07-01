import React, { memo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconChevronLeft } from '@components/ui/_shared/icons';
import styles from './PageHeader.module.less';

export type PageHeaderVariant = 'sticky' | 'transparent' | 'absolute' | 'relative';

export interface PageHeaderProps {
    /** 页面标题，不传则不渲染标题 */
    title?: string;
    /** 点击返回按钮的回调，不传则默认执行 navigate(-1) */
    onBack?: () => void;
    /**
     * 定位模式
     * - `sticky`（默认）：吸顶 + 透明背景 + 无边框
     * - `transparent`：吸顶 + 透明背景 + 无边框，适合有背景装饰的页面（如 Profile）
     * - `absolute`：绝对定位，适合全屏居中布局（overflow: hidden）
     * - `relative`：普通文档流
     */
    variant?: PageHeaderVariant;
    /** 右侧自定义内容 */
    rightExtra?: React.ReactNode;
    /** 返回按钮右侧（左区域）的额外内容，如视图模式切换按钮 */
    leftExtra?: React.ReactNode;
    /** 是否隐藏返回按钮，默认 false（显示返回按钮） */
    hideBack?: boolean;
}


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
    hideBack = false,
}: PageHeaderProps) {
    const navigate = useNavigate();
    const onBackRef = useRef(onBack);
    onBackRef.current = onBack;

    const handleBack = useCallback((): void => {
        if (onBackRef.current) {
            onBackRef.current();
        } else {
            navigate(-1);
        }
    }, [navigate]);

    return (
        <header className={variantClass[variant]}>
            <div className={styles.left}>
                {!hideBack && (
                    <button
                        className={styles.backBtn}
                        onClick={handleBack}
                        aria-label="返回"
                        type="button"
                    >
                        <IconChevronLeft />
                    </button>
                )}
                {leftExtra}
            </div>
            {title && (
                <h1 className={styles.title}>{title}</h1>
            )}
            <div className={styles.right}>
                {rightExtra}
            </div>
        </header>
    );
});

export default PageHeader;
