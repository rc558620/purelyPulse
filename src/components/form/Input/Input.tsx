import React, { memo, useRef, useEffect } from 'react';
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

export const Textarea: React.FC<TextareaProps> = memo(({
  status,
  className,
  wrapperClassName,
  ...rest
}) => (
  <div className={cx(styles.textareaWrapper, wrapperClassName, status === 'error' && styles.statusError)}>
    <textarea
      className={cx(styles.textareaControl, className)}
      {...rest}
    />
  </div>
)) as React.FC<TextareaProps>;

(Textarea as React.FC & { displayName?: string }).displayName = 'Textarea';

// ─── Input ──────────────────────────────────────────────────────

export const Input: React.FC<InputProps> = memo(({
    prefix,
    suffix,
    status,
    className,
    wrapperClassName,
    ...rest
}) => {
    const { type = 'text', autoComplete } = rest;
    const finalAutoComplete = autoComplete || (type === 'password' ? 'current-password' : 'off');

    const inputRef = useRef<HTMLInputElement>(null);

    // iOS iPhone 真机兼容：type=number 时阻止滚轮意外改值
    useEffect(() => {
        if (type !== 'number') return;
        const el = inputRef.current;
        if (!el) return;
        const prevent = (e: WheelEvent) => e.preventDefault();
        el.addEventListener('wheel', prevent, { passive: false });
        return () => el.removeEventListener('wheel', prevent);
    }, [type]);

    return (
        <div className={cx(styles.inputWrapper, wrapperClassName, status === 'error' ? styles.statusError : '')}>
            {prefix && <div className={styles.prefixWrapper}>{prefix}</div>}
            <input
                ref={inputRef}
                className={cx(styles.inputControl, className)}
                type={type}
                autoComplete={finalAutoComplete}
                {...rest}
            />
            {suffix && <div className={styles.suffixWrapper}>{suffix}</div>}
        </div>
    );
}) as React.FC<InputProps>;

(Input as React.FC & { displayName?: string }).displayName = 'Input';
