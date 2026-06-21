// 设置类页面公共表单逻辑 Hook：封装 submitting 保护、handleBack、校验规则初始化。
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from '@components/form';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import type { FormErrorMap, FormInstance, ValidatorRule } from '@components/form/types';

/** useSettingsForm 配置项。 */
export interface UseSettingsFormOptions<T extends object> {
    /**
     * 构建校验规则的工厂函数。
     * 由调用方传入，保证 rules 引用仅初始化一次（通过 useRef 存储）。
     */
    buildRules: (form: FormInstance<T>) => Record<keyof T, ValidatorRule[]>;
    /**
     * 业务提交逻辑（已通过校验时调用）。
     * 无需在内部处理 submitting，useSettingsForm 已包裹 try/finally。
     */
    onSubmit: (values: T, form: FormInstance<T>) => Promise<void>;
    /** 校验失败时的额外回调（可选）。 */
    onFinishFailed?: (errors: FormErrorMap<T>) => void;
}

/** useSettingsForm 返回值。 */
export interface UseSettingsFormReturn<T extends object> {
    /** 表单实例。 */
    form: FormInstance<T>;
    /** 各字段校验规则（引用稳定，已通过 useRef 缓存）。 */
    rules: Record<keyof T, ValidatorRule[]>;
    /** 是否处于提交中。 */
    submitting: boolean;
    /** 返回上一页（navigate(-1)）。 */
    handleBack: () => void;
    /** 表单校验通过后的提交回调，带 submitting 保护与 try/finally 骨架。 */
    handleFinish: (values: T) => Promise<void>;
    /** 表单校验失败回调。 */
    handleFinishFailed: (errors: FormErrorMap<T>) => void;
}

/** 设置类页面公共表单逻辑 Hook。 */
export function useSettingsForm<T extends object>(
    options: UseSettingsFormOptions<T>,
): UseSettingsFormReturn<T> {
    const { buildRules, onSubmit, onFinishFailed: customOnFinishFailed } = options;

    const navigate = useAnimatedNavigate();
    const [form] = useForm<T>();
    const [submitting, setSubmitting] = useState(false);

    // 用 ref 保存最新 submitting，避免 handleFinish 依赖项引起重建
    const submittingRef = useRef(submitting);
    useEffect(() => {
        submittingRef.current = submitting;
    });

    // 校验规则仅初始化一次，引用稳定
    const rulesRef = useRef<Record<keyof T, ValidatorRule[]>>(buildRules(form));

    const handleBack = useCallback((): void => {
        navigate(-1);
    }, [navigate]);

    const handleFinish = useCallback(async (values: T): Promise<void> => {
        if (submittingRef.current) {
            return;
        }
        setSubmitting(true);
        try {
            await onSubmit(values, form);
        } finally {
            setSubmitting(false);
        }
    }, [form, onSubmit]);

    const handleFinishFailed = useCallback((errors: FormErrorMap<T>): void => {
        if (customOnFinishFailed != null) {
            customOnFinishFailed(errors);
        } else {
            console.log('Settings form validation failed:', errors);
        }
    }, [customOnFinishFailed]);

    return {
        form,
        rules: rulesRef.current,
        submitting,
        handleBack,
        handleFinish,
        handleFinishFailed,
    };
}
