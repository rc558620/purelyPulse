// 表单容器组件，负责上下文注入与提交流程管理。
import React, { useEffect, useRef, useMemo, useCallback, type FormEvent, type ReactNode } from 'react';
import { FormContext } from './context';
import { useForm } from './useForm';
import type { FormContextType, FormErrorMap, FormFieldName, FormInstance, FormRequiredMark, FormValues } from './types';
/** 表单组件属性。 */
export interface FormProps<T extends FormValues = FormValues> {
    /** 外部传入的表单实例。 */
    form?: FormInstance<T>;
    /** 表单校验通过后的提交回调，支持异步。 */
    onFinish?: (values: T) => void | Promise<void>;
    /** 表单校验失败后的回调。 */
    onFinishFailed?: (errors: FormErrorMap<T>) => void;
    /** 表单子节点。 */
    children: ReactNode;
    /** 自定义样式类名。 */
    className?: string;
    /** 全局必填标识策略，行为对齐 antd 5。 */
    requiredMark?: FormRequiredMark;
    /** 表单初始值。 */
    initialValues?: Partial<T>;
    /** 表单 DOM id，供外部 submit 按钮的 form 属性关联。 */
    id?: string;
}

/** 内部表单组件实现。 */
const InternalForm = <T extends FormValues = FormValues>({
    form,
    onFinish,
    onFinishFailed,
    children,
    className,
    requiredMark = true,
    initialValues,
    id,
}: FormProps<T>): React.JSX.Element => {
    const [internalForm] = useForm<T>();
    const formInstance = form ?? internalForm;

    /** 首次渲染时将 initialValues 写入表单 store，仅执行一次。 */
    const initialsAppliedRef = useRef(false);
    useEffect(() => {
        if (initialsAppliedRef.current || !initialValues) return;
        initialsAppliedRef.current = true;
        Object.entries(initialValues).forEach(([key, value]) => {
            formInstance.setFieldValue(key as FormFieldName<T>, value as T[FormFieldName<T>]);
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /** 用 ref 保存最新的回调，避免 handleSubmit 闭包过期。 */
    const onFinishRef = useRef(onFinish);
    const onFinishFailedRef = useRef(onFinishFailed);
    useEffect(() => { onFinishRef.current = onFinish; }, [onFinish]);
    useEffect(() => { onFinishFailedRef.current = onFinishFailed; }, [onFinishFailed]);

    /** 用 ref 存储 formInstance，确保 handleSubmitRef 内始终读到最新实例。 */
    const formInstanceRef = useRef(formInstance);
    useEffect(() => { formInstanceRef.current = formInstance; }, [formInstance]);

    /** 稳定的提交函数 ref：通过 ref 间接读取最新 formInstance / onFinish / onFinishFailed。 */
    const handleSubmitRef = useRef(async (e?: FormEvent): Promise<void> => {
        if (e) {
            e.preventDefault();
        }
        try {
            const values = await formInstanceRef.current.validateFields();
            await onFinishRef.current?.(values);
        } catch (errors) {
            onFinishFailedRef.current?.(errors as FormErrorMap<T>);
        }
    });
    const handleSubmit = handleSubmitRef.current;

    /** 将真实 submit 注入到 formInstance，使 form.submit() 能触发 onFinish。 */
    useEffect(() => {
        const fi = formInstance as unknown as { __setSubmit?: (fn: (e?: FormEvent) => Promise<void>) => void };
        fi.__setSubmit?.(handleSubmit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formInstance]);

    /** 稳定的 submit 函数，避免 contextValue 引用变化。 */
    const stableSubmit = useCallback((e?: FormEvent) => handleSubmitRef.current(e), []);

    /** useMemo 保持 contextValue 引用稳定，仅在 formInstance 变化时重新创建。
     *  这样所有消费 FormContext 的 FormItem 不会因父组件渲染而重新渲染。 */
    const contextValue: FormContextType = useMemo(
        () => ({
            ...(formInstance as unknown as FormContextType),
            submit: stableSubmit,
            requiredMark,
        }),
         
        [formInstance, requiredMark, stableSubmit],
    );

    return (
        <FormContext.Provider value={contextValue}>
            <form id={id} onSubmit={handleSubmit} className={className} noValidate>
                {children}
            </form>
        </FormContext.Provider>
    );
};

/** 表单组件导出类型。 */
type FormComponent = (<T extends FormValues = FormValues>(props: FormProps<T>) => React.JSX.Element) & {
    /** 创建表单实例 Hook。 */
    useForm: typeof useForm;
};

export const Form = Object.assign(InternalForm, { useForm }) as FormComponent;
