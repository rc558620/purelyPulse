// auth 页面公共布局：提供背景渐变、弥散光球和内容区包裹层，避免各页面重复定义。
import React, { memo } from 'react';
import styles from './AuthPageLayout.module.less';

export interface AuthPageLayoutProps {
    /** 页面内部内容。 */
    children: React.ReactNode;
    /**
     * 内容区对齐方式。
     * - `center`：垂直居中（登录页）
     * - `top`：顶部对齐、可滚动（注册/找回密码/新增门店）
     *
     * @default 'top'
     */
    contentAlign?: 'center' | 'top';
    /**
     * 渲染在滚动容器外部、固定于顶部的 header 区域（透明吸顶 PageHeader）。
     * 仅在 `contentAlign='top'` 时有效，渲染为 `.authContainer` 的直接子元素，
     * 不受内容区滚动影响。
     */
    header?: React.ReactNode;
}

/**
 * Auth 系列页面公共布局组件。
 *
 * 封装了四个认证页面共享的：
 * - 全屏容器（背景色 + 顶部径向渐变）
 * - 弥散光球背景特效
 * - 内容包裹层（支持居中 / 顶部对齐两种模式）
 */
const AuthPageLayout: React.FC<AuthPageLayoutProps> = memo(({ children, contentAlign = 'top', header }) => (
    <div className={styles.authContainer}>
        <div className={styles.blurOrb} aria-hidden="true" />
        {/* header 渲染在滚动容器外，作为 authContainer 直接子元素，固定于顶部不随内容滚动 */}
        {contentAlign === 'top' && header && (
            <div className={styles.headerArea}>
                {header}
            </div>
        )}
        <div className={contentAlign === 'center' ? styles.contentWrapperCenter : styles.contentWrapperTop}>
            {children}
        </div>
    </div>
));

AuthPageLayout.displayName = 'AuthPageLayout';

export default AuthPageLayout;
