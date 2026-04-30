import React, { memo, useEffect, useId, useMemo, useRef } from 'react';
import { cx } from '@utils/utils';
import styles from './Checkbox.module.less';

const radiusMap = {
    sm: '8px',
    md: '12px',
    lg: '16px',
    full: '9999px',
} as const;

export type CheckboxRadius = keyof typeof radiusMap | number | string;

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'value' | 'color'> {
    value?: boolean | unknown;
    color?: string;
    borderRadius?: CheckboxRadius;
    indeterminate?: boolean;
    status?: 'error' | undefined;
    boxClassName?: string;
}

const resolveRadius = (radius?: CheckboxRadius): string | undefined => {
    if (radius === undefined) {
        return undefined;
    }
    if (typeof radius === 'number') {
        return `${radius}px`;
    }
    return radiusMap[radius as keyof typeof radiusMap] ?? radius;
};

const CheckboxInner: React.FC<CheckboxProps> = ({
    id,
    value,
    checked,
    defaultChecked,
    indeterminate = false,
    color,
    borderRadius = 'md',
    status,
    disabled,
    children,
    className,
    boxClassName,
    style,
    ...rest
}) => {
    const autoId = useId();
    const inputId = id ?? `checkbox-${autoId}`;
    const inputRef = useRef<HTMLInputElement>(null);
    const isChecked = typeof checked === 'boolean' ? checked : (typeof value === 'boolean' ? value : undefined);
    const isIndeterminate = indeterminate && !isChecked;

    useEffect(() => {
        if (!inputRef.current) {
            return;
        }
        inputRef.current.indeterminate = isIndeterminate;
    }, [isIndeterminate]);

    const cssVars = useMemo(() => {
        const nextStyle: React.CSSProperties & {
            '--checkbox-color'?: string;
            '--checkbox-radius'?: string;
        } = {
            ...style,
        };
        if (color) {
            nextStyle['--checkbox-color'] = color;
        }
        const resolvedRadius = resolveRadius(borderRadius);
        if (resolvedRadius) {
            nextStyle['--checkbox-radius'] = resolvedRadius;
        }
        return nextStyle;
    }, [borderRadius, color, style]);

    return (
        <label
            htmlFor={inputId}
            className={cx(
                styles.checkbox,
                disabled && styles.checkboxDisabled,
                status === 'error' && styles.checkboxError,
                isIndeterminate && styles.checkboxIndeterminate,
                className,
            )}
            style={cssVars}
        >
            <input
                {...rest}
                id={inputId}
                ref={inputRef}
                type="checkbox"
                checked={isChecked}
                defaultChecked={defaultChecked}
                disabled={disabled}
                className={styles.input}
            />
            <span className={cx(styles.box, boxClassName)} aria-hidden="true">
                <svg className={styles.icon} viewBox="0 0 16 16" fill="none">
                    <path d="M3.5 8.25L6.5 11.25L12.5 5.25" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </span>
            {children ? <span className={styles.label}>{children}</span> : null}
        </label>
    );
};

const Checkbox = memo(CheckboxInner);

export default Checkbox;
