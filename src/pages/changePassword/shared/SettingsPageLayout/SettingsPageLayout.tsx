// preferences 类页面公共壳层：封装页面容器、PageHeader、内容区。
import React from 'react';
import { cx } from '@utils/utils';
import PageHeader from '@components/ui/layout/PageHeader';
import styles from './SettingsPageLayout.module.less';

export interface SettingsPageLayoutProps {
    /** 页面标题（传给 PageHeader）。 */
    title: string;
    /** 点击返回按钮回调；不传则 PageHeader 默认 navigate(-1)。 */
    onBack?: () => void;
    /**
     * 内容区高度模式。
     * - `scroll`（默认）：内容超出时页面整体滚动。
     * - `fixed`：内容区独立滚动。
     */
    heightMode?: 'scroll' | 'fixed';
    /** 内容区间距档位。 */
    gap?: '0' | '2rem' | '2.4rem';
    /** 页面内容。 */
    children: React.ReactNode;
}

/** 设置类页面公共壳层布局：背景渐变、PageHeader、内容区容器（居中 + max-width）。 */
const SettingsPageLayout: React.FC<SettingsPageLayoutProps> = ({
    title,
    onBack,
    heightMode = 'scroll',
    gap = '2rem',
    children,
}) => (
    <div className={styles.pageContainer} data-height-mode={heightMode}>
        {/* 页面顶部导航 */}
        <PageHeader title={title} onBack={onBack} variant="transparent" />

        <main className={cx(styles.contentWrapper, styles[`gap${gap.replace('.', '_').replace('rem', 'Rem')}`])}>
            {children}
        </main>
    </div>
);

export default SettingsPageLayout;
