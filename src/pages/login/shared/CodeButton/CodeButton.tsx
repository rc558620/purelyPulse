// 验证码发送按钮，统一替代 register / forgotPassword 中各自内联的 codeButton。
import React, { memo } from 'react';
import styles from './CodeButton.module.less';

export interface CodeButtonProps {
    /** 按钮显示文本（如 "获取验证码" / "60s后重试"）。 */
    text: string;
    /** 是否禁用（倒计时中）。 */
    disabled: boolean;
    /** 点击回调。 */
    onClick: () => void | Promise<void>;
}

/**
 * 验证码发送按钮。
 *
 * 统一替代 register / forgotPassword 中重复定义的 `.codeButton` 内联按钮。
 * 通常作为验证码输入框的 suffix prop 传入。
 */
const CodeButton: React.FC<CodeButtonProps> = memo(({ text, disabled, onClick }) => (
    <button
        type="button"
        className={styles.codeButton}
        onClick={onClick}
        disabled={disabled}
    >
        {text}
    </button>
));

CodeButton.displayName = 'CodeButton';

export default CodeButton;
