// 设置类页面公共图标说明区：圆形图标容器 + 提示文案。
import React from 'react';
import styles from './PageIconIntro.module.less';

export interface PageIconIntroProps {
    /** 圆形容器内的图标节点（一般传入 SVG 组件）。 */
    icon: React.ReactNode;
    /** 图标下方的提示文案；不传则不渲染。 */
    hint?: string;
}

/** 设置类页面公共图标说明区：圆形主图标 + 提示文案（可选）。 */
const PageIconIntro: React.FC<PageIconIntroProps> = ({ icon, hint }) => (
    <section className={styles.section}>
        <div className={styles.iconSection}>
            <div className={styles.iconCircle}>{icon}</div>
            {hint != null && hint !== '' && (
                <p className={styles.iconHint}>{hint}</p>
            )}
        </div>
    </section>
);

export default PageIconIntro;
