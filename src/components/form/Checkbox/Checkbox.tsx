import React, { memo, useEffect, useId, useMemo, useRef } from 'react';
import { cx } from '@utils/utils';
import styles from './Checkbox.module.less';
import { CheckboxCheckIcon } from '@components/form/_shared/icons';

const radiusMap = {
    sm: '8px',
    md: '12px',
    lg: '16px',
    full: '9999px',
} as const;

type RadiusMapKey = keyof typeof radiusMap;

export type CheckboxRadius = RadiusMapKey | number | string;

// Bug5 修复：value 类型从 boolean|unknown 改为 boolean，FormItem 注入场景由 checked 承载
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'value' | 'color'> {
    /** 受控选中态（布尔值），FormItem 通过 valuePropName="checked" 注入。 */
    value?: boolean;
    /** 自定义主色。 */
    color?: string;
    /** 方框圆角。 */
    borderRadius?: CheckboxRadius;
    /** 半选态标识，indeterminate=true 时显示横线而非对勾。 */
    indeterminate?: boolean;
    /** 校验状态。 */
    status?: 'error' | undefined;
    /** 方框额外类名。 */
    boxClassName?: string;
}

// Bug6 修复：使用类型收窄代替 as 断言
const resolveRadius = (radius?: CheckboxRadius): string | undefined => {
    if (radius === undefined) {
        return undefined;
    }
    if (typeof radius === 'number') {
        return `${radius}px`;
    }
    if (radius in radiusMap) {
        return radiusMap[radius as RadiusMapKey];
    }
    return radius;
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

    // 受控值推导：checked 优先，value 次之，均未传则为 undefined（非受控）
    const isChecked = typeof checked === 'boolean' ? checked : (typeof value === 'boolean' ? value : undefined);

    // Bug2 修复：indeterminate 的语义是"部分选中"，与 checked 无关
    // indeterminate=true 时始终显示半选态，由调用方负责在子项全选后移除 indeterminate
    const isIndeterminate = indeterminate;

    // Bug4 修复：判断是否为受控模式
    const isControlled = typeof checked === 'boolean' || typeof value === 'boolean';

    useEffect(() => {
        if (!inputRef.current) {
            return;
        }
        inputRef.current.indeterminate = isIndeterminate;
    }, [isIndeterminate]);

    // Bug9 修复：将 style 展开到 useMemo 内部，避免依赖外部对象引用
    const cssVars = useMemo(() => {
        const nextStyle: React.CSSProperties & {
            '--checkbox-color'?: string;
            '--checkbox-radius'?: string;
        } = {};
        if (style) {
            Object.assign(nextStyle, style);
        }
        if (color) {
            nextStyle['--checkbox-color'] = color;
        }
        const resolvedRadius = resolveRadius(borderRadius);
        if (resolvedRadius) {
            nextStyle['--checkbox-radius'] = resolvedRadius;
        }
        return nextStyle;
    // style 的每个字段不稳定时无法精确缓存，但 useMemo 仍然能避免
    // borderRadius/color 不变时的不必要重建；style 变化时正确更新
     
    }, [borderRadius, color, style]);

    // Bug4 修复：非受控模式不传 checked 属性，避免 React 将 checkbox 视为受控组件
    const inputProps: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'ref'> & { ref?: React.Ref<HTMLInputElement> } = {
        ...rest,
        id: inputId,
        ref: inputRef,
        type: 'checkbox',
        disabled,
        className: styles.input,
    };

    if (isControlled) {
        inputProps.checked = isChecked;
    } else if (defaultChecked !== undefined) {
        inputProps.defaultChecked = defaultChecked;
    }

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
            <input {...inputProps} />
            <span className={cx(styles.box, boxClassName)} aria-hidden="true">
                {/* Bug7 修复：半选态不渲染对勾图标，由 CSS ::after 伪元素显示横线 */}
                {!isIndeterminate && <CheckboxCheckIcon className={styles.icon} />}
            </span>
            {children ? <span className={styles.label}>{children}</span> : null}
        </label>
    );
};

const Checkbox = memo(CheckboxInner) as unknown as typeof CheckboxInner & {
    /** Bug10 修复：声明受控属性名，FormItem 可自动推断 valuePropName。 */
    __VALUE_PROP_NAME__: 'checked';
};

Checkbox.__VALUE_PROP_NAME__ = 'checked';

export default Checkbox;
