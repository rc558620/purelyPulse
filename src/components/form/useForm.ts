// 表单 Hook，负责字段状态、规则注册与提交流程。
import { useCallback, useRef, type FormEvent } from 'react';
import type {
    FormContextType,
    FormFieldName,
    FormInstance,
    FormValues,
    ValidatorRule,
} from './types';

// ─── 外部订阅机制（Pub/Sub），用于按字段粒度通知更新 ────────────────────────

/** 每个字段的订阅 listener 集合。 */
type FieldListener = () => void;

/** 创建表单实例。 */
export const useForm = <T extends FormValues = FormValues>(): [FormInstance<T>] => {
    /** 供 Form 组件注入真正的 submit（含 onFinish 回调）。 */
    const submitRef = useRef<((e?: FormEvent) => Promise<void>) | undefined>(undefined);

    // ── 使用 ref 存储所有状态，避免 setState 触发大范围重渲染 ──
    const storeRef = useRef<T>({} as T);
    const errorsRef = useRef<Record<string, string>>({});
    const rulesRef = useRef<Record<string, ValidatorRule[]>>({});
    /** 已触发过校验的字段集合（dirty），onChange 时需实时重新校验。 */
    const dirtyFields = useRef<Set<string>>(new Set());

    // ── 订阅系统：按字段名存储更新回调 ──
    const fieldListeners = useRef<Map<string, Set<FieldListener>>>(new Map());

    /** 订阅某字段的更新，返回取消订阅函数。供 FormItem/外部消费。 */
    const subscribeField = useCallback((name: string, listener: FieldListener): (() => void) => {
        if (!fieldListeners.current.has(name)) {
            fieldListeners.current.set(name, new Set());
        }
        fieldListeners.current.get(name)!.add(listener);
        return () => {
            fieldListeners.current.get(name)?.delete(listener);
        };
    }, []);

    /** 触发指定字段的所有订阅 listener。 */
    const notifyField = useCallback((name: string) => {
        fieldListeners.current.get(name)?.forEach(fn => fn());
    }, []);

    /** 清理指定字段的错误信息（仅在有错误时才通知，避免无效更新）。 */
    const clearFieldError = useCallback((name: string): void => {
        if (errorsRef.current[name] !== undefined) {
            const nextErrors = { ...errorsRef.current };
            delete nextErrors[name];
            errorsRef.current = nextErrors;
            notifyField(name);
        }
    }, [notifyField]);

    /** 按强类型字段名读取字段值。 */
    function getFieldValue<K extends FormFieldName<T>>(name: K): T[K];
    /** 按动态字段名读取字段值。 */
    function getFieldValue(name: string): unknown;
    /** 读取字段值实现。 */
    function getFieldValue(name: string): unknown {
        return (storeRef.current as Record<string, unknown>)[name];
    }

    /** 校验单个字段并返回错误信息。 */
    const validateField = async (value: unknown, fieldRules: ValidatorRule[]): Promise<string | null> => {
        for (const rule of fieldRules) {
            if (
                rule.required &&
                (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0))
            ) {
                return rule.message || '该字段为必填项';
            }
            if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
                return rule.message || '字段格式不正确';
            }
            if (rule.validator) {
                try {
                    await rule.validator(value);
                } catch (error) {
                    if (error instanceof Error) {
                        return error.message;
                    }
                    if (typeof error === 'string') {
                        return error;
                    }
                    return rule.message || '字段校验失败';
                }
            }
        }
        return null;
    };

    /** 按强类型字段名写入字段值。 */
    function setFieldValue<K extends FormFieldName<T>>(name: K, value: T[K]): void;
    /** 按动态字段名写入字段值。 */
    function setFieldValue(name: string, value: unknown): void;
    /** 写入字段值实现。 */
    function setFieldValue(name: string, value: unknown): void {
        const next = { ...(storeRef.current as Record<string, unknown>), [name]: value } as T;
        storeRef.current = next;
        // 通知该字段的订阅者（仅涉及该字段的 FormItem 更新）
        notifyField(name);

        // 字段已触发过校验（dirty）：实时重新校验，让用户看到"输入正确后才消除红框"
        // 字段未触发过校验：直接清除错误（保持原有行为，不提前报错）
        if (dirtyFields.current.has(name)) {
            const fieldRules = rulesRef.current[name] ?? [];
            void validateField(value, fieldRules).then(fieldError => {
                if (fieldError) {
                    if (errorsRef.current[name] !== fieldError) {
                        errorsRef.current = { ...errorsRef.current, [name]: fieldError };
                        notifyField(name);
                    }
                } else {
                    clearFieldError(name);
                }
            });
        } else {
            clearFieldError(name);
        }
    }

    /** 执行所有已注册字段的校验。始终读 rulesRef，确保拿到最新注册的规则。 */
    const validateFields = async (): Promise<T> => {
        const currentStore = storeRef.current as Record<string, unknown>;
        const currentRules = rulesRef.current;
        const nextErrors: Record<string, string> = {};
        let isValid = true;

        for (const name of Object.keys(currentRules)) {
            // 标记字段为 dirty：后续 onChange 会实时重新校验
            dirtyFields.current.add(name);
            const fieldRules = currentRules[name] ?? [];
            const fieldValue = currentStore[name];
            const fieldError = await validateField(fieldValue, fieldRules);
            if (fieldError) {
                nextErrors[name] = fieldError;
                isValid = false;
            }
        }

        // 按字段差量通知，避免批量刷新时引发不必要渲染
        const prevErrors = errorsRef.current;
        errorsRef.current = nextErrors;
        const allFields = new Set([...Object.keys(prevErrors), ...Object.keys(nextErrors)]);
        allFields.forEach(name => {
            if (prevErrors[name] !== nextErrors[name]) {
                notifyField(name);
            }
        });

        if (!isValid) {
            throw nextErrors;
        }
        return storeRef.current;
    };

    /** 注册字段规则。 */
    const registerField = useCallback((name: string, fieldRules: ValidatorRule[]): void => {
        rulesRef.current = { ...rulesRef.current, [name]: fieldRules };
    }, []);

    /** 注销字段，清理规则/错误/dirty，但保留字段值，确保条件渲染字段 re-mount 后仍能读到已回填的值。 */
    const unregisterField = useCallback((name: string): void => {
        const nextRules = { ...rulesRef.current };
        delete nextRules[name];
        rulesRef.current = nextRules;

        // 注意：intentionally 不删除 storeRef 中的值，
        // 这样条件显示的字段（如 hourlyRate）在 unmount 后 re-mount 时仍能读到之前设置的值。
        clearFieldError(name);
        dirtyFields.current.delete(name);
        fieldListeners.current.delete(name);
    }, [clearFieldError]);

    /** 读取字段错误信息。 */
    const getFieldError = useCallback((name: string): string | undefined => errorsRef.current[name], []);

    /**
     * 单字段校验，校验完成后写回错误状态以触发 UI 反馈。
     * @param name - 字段名。
     * @returns 校验通过返回 true，失败返回 false。
     */
    const validateSingleField = useCallback(async (name: string): Promise<boolean> => {
        dirtyFields.current.add(name);
        const fieldRules = rulesRef.current[name] ?? [];
        const fieldValue = (storeRef.current as Record<string, unknown>)[name];
        const fieldError = await validateField(fieldValue, fieldRules);
        if (fieldError) {
            if (errorsRef.current[name] !== fieldError) {
                errorsRef.current = { ...errorsRef.current, [name]: fieldError };
                notifyField(name);
            }
            return false;
        }
        clearFieldError(name);
        return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clearFieldError, notifyField]);

    /** 提交方法：优先调用 Form 组件注入的真实 submit（含 onFinish），否则仅执行校验。 */
    const submit = useCallback(async (e?: FormEvent): Promise<void> => {
        if (submitRef.current) {
            return submitRef.current(e);
        }
        if (e) {
            e.preventDefault();
        }
        try {
            await validateFields();
        } catch {
            // 无 Form 容器时忽略校验异常。
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /** 供 Form 组件覆盖真实 submit 的方法。 */
    const __setSubmit = (fn: (e?: FormEvent) => Promise<void>): void => {
        submitRef.current = fn;
    };

    /** 重置表单，清空所有字段值和错误信息。 */
    const reset = useCallback((): void => {
        const prevStore = storeRef.current as Record<string, unknown>;
        const prevErrors = errorsRef.current;

        storeRef.current = {} as T;
        errorsRef.current = {};
        dirtyFields.current.clear();

        const changedFields = new Set([
            ...Object.keys(prevStore),
            ...Object.keys(prevErrors),
        ]);

        changedFields.forEach(name => notifyField(name));
    }, [notifyField]);

    /** 用 ref 保持 formInstance 对象引用稳定，避免每次渲染都创建新对象
     *  导致依赖 form 的 useEffect / useMemo 被误触发。 */
    const formInstanceRef2 = useRef<FormInstance<T> & FormContextType & {
        __setSubmit: (fn: (e?: FormEvent) => Promise<void>) => void;
        subscribeField: (name: string, listener: FieldListener) => () => void;
    } | null>(null);

    if (!formInstanceRef2.current) {
        formInstanceRef2.current = {
            getFieldValue,
            setFieldValue,
            validateFields,
            validateSingleField,
            submit,
            getFieldError,
            reset,
            registerField,
            unregisterField,
            requiredMark: true,
            __setSubmit,
            subscribeField,
        };
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    return [formInstanceRef2.current!];
};
