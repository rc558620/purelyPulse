// 密码明/密文切换按钮，统一替代 login / register / forgotPassword 中各自内联的 button。
import React, { memo } from 'react';
import icVisibility from '@assets/image/Additional/visibility.svg';
import icVisibilityOff from '@assets/image/Additional/visibility_off.svg';
import styles from './PasswordVisibilityToggle.module.less';

export interface PasswordVisibilityToggleProps {
    /** 当前密码是否可见（明文）。 */
    visible: boolean;
    /** 切换可见性的回调。 */
    onToggle: () => void;
    /** 辅助技术标签，描述当前字段（如"密码"/"确认密码"）。 */
    ariaLabel?: string;
}

/**
 * 密码可见性切换按钮（眼睛图标）。
 *
 * 统一替代 login / register / forgotPassword 中重复定义的：
 * - `passwordSuffix` useMemo 内联按钮（login）
 * - `visibilityToggle` className 按钮（register / forgotPassword）
 */
const PasswordVisibilityToggle: React.FC<PasswordVisibilityToggleProps> = memo(
    ({ visible, onToggle, ariaLabel = 'Toggle Visibility' }) => (
        <button
            type="button"
            className={styles.visibilityToggle}
            onClick={onToggle}
            aria-label={ariaLabel}
        >
            <img
                src={visible ? icVisibility : icVisibilityOff}
                alt={ariaLabel}
                className={styles.visibilityIcon}
            />
        </button>
    ),
);

PasswordVisibilityToggle.displayName = 'PasswordVisibilityToggle';

export default PasswordVisibilityToggle;
