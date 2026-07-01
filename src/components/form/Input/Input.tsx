import React, { memo, forwardRef } from 'react';
import type { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';
import { cx } from '@utils/utils';
import styles from './Input.module.less';

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> & {
    prefix?: ReactNode;
    suffix?: ReactNode;
    status?: 'error' | 'warning';
    wrapperClassName?: string;
};

// ─── Textarea ──────────────────────────────────────────────────

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  status?: 'error' | 'warning';
  wrapperClassName?: string;
};

export const Textarea = memo(forwardRef<HTMLTextAreaElement, TextareaProps>(({
  status,
  className,
  wrapperClassName,
  ...rest
}, ref) => (
  <div className={cx(
    styles.textareaWrapper,
    wrapperClassName,
    status === 'error' && styles.statusError,
    status === 'warning' && styles.statusWarning,
  )}>
    <textarea
      ref={ref}
      className={cx(styles.textareaControl, className)}
      {...rest}
    />
  </div>
))) as React.FC<TextareaProps>;

(Textarea as React.FC & { displayName?: string }).displayName = 'Textarea';

// ─── Input ──────────────────────────────────────────────────────

export const Input = memo(forwardRef<HTMLInputElement, InputProps>(({
    prefix,
    suffix,
    status,
    className,
    wrapperClassName,
    ...rest
}, ref) => {
    // 从 rest 中提取需要转换的属性，避免 {...rest} 覆盖
    const { type = 'text', autoComplete, inputMode, ...restWithoutOverrides } = rest;
    // type="number" 改为 type="text" + inputMode：避免滚轮意外改值，同时页面正常滚动
    // ⚠️ 注意：min / max / step 等 <input type="number"> 的原生属性在 type="text" 下无效，
    // 如需输入值约束，请在业务层校验或自行实现。
    const realType = type === 'number' ? 'text' : type;
    const realInputMode = inputMode ?? (type === 'number' ? 'decimal' : undefined);
    // 默认 off：不再对 type="password" 默认 current-password，
    // 避免新密码/确认密码字段被浏览器自动填充旧密码。
    // 各页面应通过 CHANGE_PASSWORD_FIELDS 配置显式传入 autoComplete。
    const finalAutoComplete = autoComplete || 'off';

    return (
        <div className={cx(
            styles.inputWrapper,
            wrapperClassName,
            status === 'error' && styles.statusError,
            status === 'warning' && styles.statusWarning,
        )}>
            {prefix && <div className={styles.prefixWrapper}>{prefix}</div>}
            <input
                ref={ref}
                className={cx(styles.inputControl, className)}
                type={realType}
                inputMode={realInputMode}
                autoComplete={finalAutoComplete}
                {...restWithoutOverrides}
            />
            {suffix && <div className={styles.suffixWrapper}>{suffix}</div>}
        </div>
    );
})) as React.FC<InputProps>;

(Input as React.FC & { displayName?: string }).displayName = 'Input';
