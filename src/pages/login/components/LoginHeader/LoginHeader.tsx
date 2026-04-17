// 登录页品牌 Logo 区：展示应用图标、名称及英文副标题，无 props 纯静态组件。
import React, { memo } from 'react';
import styles from './LoginHeader.module.less';
import icSavings from '@assets/image/Additional/savings.svg';

/**
 * 登录页顶部品牌 Logo 区。
 *
 * 静态内容，无 props，配合 memo 确保引用稳定、永不重渲染。
 */
const LoginHeader: React.FC = memo(() => (
    <header className={styles.logoSection}>
        <div className={styles.logoWrapper}>
            <div className={styles.logoIcon}>
                <img src={icSavings} alt="Savings" className={styles.logoImg} />
            </div>
        </div>
        <h1>purelyPulse</h1>
        <p>PREMIUM PROFIT TRACKER</p>
    </header>
));

LoginHeader.displayName = 'LoginHeader';

export default LoginHeader;
