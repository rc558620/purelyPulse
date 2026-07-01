// 表单项组件，负责字段注册、错误展示与输入绑定。
import React, {
    memo,
    useCallback,
    useEffect,
    useId,
    useRef,
    useState,
    useSyncExternalStore,
    type ChangeEvent,
    type ReactNode,
} from 'react';
import type { FormFieldName, FormValues, ValidatorRule } from './types';
import { useFormContext } from './context';
import { cx } from '@utils/utils';
import styles from './Form.module.less';

/** 表单子组件可注入属性。 */
interface FormItemChildProps {
    /** 输入值。 */
    value?: unknown;
    /** 复选类组件的受控选中态。 */
    checked?: boolean;
    /** 值变化回调。 */
    onChange?: (event: unknown) => void;
    /** 输入状态。 */
    status?: 'error' | undefined;
    /** BUG-4 修复：无障碍关联标签 id，RadioGroup 等非原生表单元素需要。 */
    ['aria-labelledby']?: string;
}

/** 表单项属性。 */
export interface FormItemProps<T extends FormValues = Record<string, unknown>> {
    /** 字段名。 */
    name: FormFieldName<T>;
    /** 字段标签。 */
    label?: string;
    /** 是否强制展示为必填。默认按 rules.required 推断。 */
    required?: boolean;
    /** 字段校验规则。 */
    rules?: ValidatorRule[];
    /** 受控字段注入的属性名，默认使用 value。 */
    valuePropName?: 'value' | 'checked';
    /** 子组件节点。 */
    children: ReactNode;
    /** 自定义样式类名。 */
    className?: string;
}

/** 判断是否为输入组件 change 事件。 */
const isInputChangeEvent = (event: unknown): event is ChangeEvent<HTMLInputElement> => {
    if (!event || typeof event !== 'object') {
        return false;
    }
    return 'target' in event;
};

/** 从事件对象中提取字段值。 */
const extractFieldValue = (event: unknown): unknown => {
    if (isInputChangeEvent(event)) {
        const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
        if ('type' in target && target.type === 'checkbox') {
            return (target as HTMLInputElement).checked;
        }
        return target.value;
    }
    return event;
};

/** 错误提示展示子组件，独立 memo 避免父级刷新传染。 */
const ErrorMessage = memo(({ displayError, exiting }: { displayError: string | null; exiting: boolean }) => {
    if (!displayError) return null;
    return (
        <div className={exiting ? styles.explainErrorExit : styles.explainError}>
            {displayError}
        </div>
    );
});
ErrorMessage.displayName = 'ErrorMessage';

/** 表单项组件。
 *  使用 useSyncExternalStore 订阅单字段变更，实现字段级精细更新：
 *  其他字段变化时本字段不会重渲染。
 */
/** Bug10 修复：从子组件静态属性自动推断 valuePropName，Checkbox 无需手动指定。 */
const resolveValuePropName = (children: ReactNode, explicitPropName?: 'value' | 'checked'): 'value' | 'checked' => {
    if (explicitPropName) return explicitPropName;
    if (React.isValidElement(children)) {
        const childType = children.type as unknown as { __VALUE_PROP_NAME__?: 'value' | 'checked' };
        if (childType?.__VALUE_PROP_NAME__) return childType.__VALUE_PROP_NAME__;
    }
    return 'value';
};

/** 检测子组件的 onChange 是否直接返回值（而非 ChangeEvent）。 */
const isDirectValueChild = (children: ReactNode): boolean => {
    if (React.isValidElement(children)) {
        const childType = children.type as unknown as { __IS_DIRECT_VALUE__?: boolean };
        return childType?.__IS_DIRECT_VALUE__ === true;
    }
    return false;
};

const FormItemInner = <T extends FormValues = Record<string, unknown>>({
    name,
    label,
    required,
    rules = [],
    valuePropName: valuePropNameExplicit,
    children,
    className,
}: FormItemProps<T>): React.JSX.Element => {
    const valuePropName = resolveValuePropName(children, valuePropNameExplicit);
    const directValue = isDirectValueChild(children);
    const labelId = useId();
    const {
        registerField,
        unregisterField,
        getFieldError,
        getFieldValue,
        setFieldValue,
        subscribeField,
        requiredMark,
    } = useFormContext();

    useEffect(() => {
        registerField(name, rules);
    }, [name, registerField, rules]);

    useEffect(() => {
        return () => unregisterField(name);
    }, [name, unregisterField]);

    // ── 订阅该字段的变更，useSyncExternalStore 确保 concurrent 模式下撕裂安全 ──
    const subscribe = useCallback(
        (onStoreChange: () => void) => subscribeField(name as string, onStoreChange),
        [name, subscribeField],
    );

    /** 快照：每次字段变更时读取最新的 [value, error] 对，作为渲染依据。 */
    const getSnapshot = useCallback(
        () => JSON.stringify([getFieldValue(name as string), getFieldError(name as string)]),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [name],
    );

    // 用 useSyncExternalStore 触发精确重渲染（只在本字段数据变化时）
    useSyncExternalStore(subscribe, getSnapshot);

    const error = getFieldError(name as string);

    // 退出动画：error 消失时先保留上一条文案并播放退出动画，动画结束后再真正隐藏
    const [displayError, setDisplayError] = useState<string | null>(error ?? null);
    const [exiting, setExiting] = useState(false);
    const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (error) {
            // 新错误出现：取消退出中的定时器，直接显示
            if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
            setExiting(false);
            setDisplayError(error);
        } else if (displayError) {
            // 错误消失：先播退出动画，300ms 后清除文案
            setExiting(true);
            exitTimerRef.current = setTimeout(() => {
                setDisplayError(null);
                setExiting(false);
            }, 300);
        }
        return () => {
            if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [error]);

    /** 保存子元素原始 onChange，避免在 handleChange 闭包中捕获过期引用。 */
    const childOriginalOnChangeRef = useRef<((event: unknown) => void) | undefined>(undefined);
    const nameRef = useRef<string>(name as string);
    nameRef.current = name as string;

    // 提取并缓存子元素原始 onChange（在 render 阶段同步更新 ref）
    if (React.isValidElement<FormItemChildProps>(children)) {
        childOriginalOnChangeRef.current = children.props.onChange;
    }

    /** 稳定的 onChange 回调，避免每次渲染都产生新函数引用传给子组件。 */
    const handleChange = useCallback((event: unknown) => {
        childOriginalOnChangeRef.current?.(event);
        // BUG-1 修复：__IS_DIRECT_VALUE__ 标记的子组件（如 RadioGroup）onChange 直接返回值，
        // 无需经过 extractFieldValue 提取，避免含 target 属性的对象被误判为 ChangeEvent。
        const resolvedValue = directValue ? event : extractFieldValue(event);
        setFieldValue(nameRef.current, resolvedValue);
    }, [setFieldValue, directValue]);

    // BUG-5 修复：checked 模式回退到 false；value 模式下，对于 __IS_DIRECT_VALUE__ 子组件
    // （如 RadioGroup），未设值时注入 undefined 而非空字符串，避免误匹配 value='' 的选项。
    // 原生 input 等非 directValue 组件仍使用空字符串保持受控。
    const rawFieldValue = getFieldValue(name as string);
    const fieldValue = rawFieldValue === undefined
        ? (valuePropName === 'checked' ? false : directValue ? undefined : '')
        : rawFieldValue;
    const childStatus: 'error' | undefined = error ? 'error' : undefined;

    // BUG-4 修复：为 RadioGroup 等非原生表单子组件自动注入 aria-labelledby，
    // 使屏幕阅读器能关联 FormItem 的 label 文本。
    const ariaProps: Partial<FormItemChildProps> = directValue && label
        ? { 'aria-labelledby': labelId }
        : {};

    const childNode = React.isValidElement<FormItemChildProps>(children)
        ? React.cloneElement(children, {
              [valuePropName]: fieldValue,
              onChange: handleChange,
              status: childStatus,
              ...ariaProps,
          } as FormItemChildProps)
        : children;

    const isRequired = required ?? rules.some((rule) => rule.required);
    const showRequiredMark = label && requiredMark !== false && isRequired;
    const showOptionalMark = label && requiredMark === 'optional' && !isRequired;

    return (
        <div className={cx(styles.formItem, className)}>
            {label && (
                <label id={labelId} className={styles.itemLabel}>
                    {showRequiredMark && <span className={styles.requiredMark} aria-hidden="true">*</span>}
                    <span>{label}</span>
                    {showOptionalMark && <span className={styles.optionalMark}>Optional</span>}
                </label>
            )}
            <div className={cx(styles.itemControl, error && styles.hasError)}>
                {childNode}
                <ErrorMessage displayError={displayError} exiting={exiting} />
            </div>
        </div>
    );
};

export const FormItem = FormItemInner as typeof FormItemInner;
