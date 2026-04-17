// auth 页面公共底部协议区，统一替代 login / register 中重复的 footer 结构。
import React, { memo } from 'react';
import styles from './AuthFooter.module.less';

export interface AuthFooterProps {
    /**
     * 操作动词，显示在"即代表您同意"之前。
     * @example '登录' → "登录即代表您同意…"
     * @example '注册' → "注册即代表您同意…"
     */
    action: string;
    /** 点击"用户协议"的回调（应阻止默认锚点跳转）。 */
    onAgreementClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
    /** 点击"隐私政策"的回调（应阻止默认锚点跳转）。 */
    onPrivacyClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * Auth 系列页面底部协议链接区。
 *
 * 统一替代 login / register 中重复定义的 `<footer>` 结构及其 `.footer` 样式类。
 */
const AuthFooter: React.FC<AuthFooterProps> = memo(({ action, onAgreementClick, onPrivacyClick }) => (
    <footer className={styles.footer}>
        <p>
            {action}即代表您同意
            <a href="#" onClick={onAgreementClick}>用户协议</a>
            和
            <a href="#" onClick={onPrivacyClick}>隐私政策</a>
        </p>
    </footer>
));

AuthFooter.displayName = 'AuthFooter';

export default AuthFooter;
