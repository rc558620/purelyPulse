// 表单模块核心类型定义。
import type { FormEvent } from 'react';

/** 表单值基础类型，仅限制为对象，避免 DTO 被索引签名约束。 */
export type FormValues = object;

/** 表单字段名类型，仅提取字符串键。 */
export type FormFieldName<T extends FormValues> = Extract<keyof T, string>;

/** 表单错误映射。 */
export type FormErrorMap<T extends FormValues = FormValues> = Partial<Record<FormFieldName<T>, string>>;

/** 表单字段读取函数，兼容强类型键与动态字符串键。 */
export type FormFieldGetter<T extends FormValues = FormValues> = {
    /** 按强类型字段名读取字段值。 */
    <K extends FormFieldName<T>>(name: K): T[K];
    /** 按动态字段名读取字段值。 */
    (name: string): unknown;
};

/** 表单字段写入函数，兼容强类型键与动态字符串键。 */
export type FormFieldSetter<T extends FormValues = FormValues> = {
    /** 按强类型字段名写入字段值。 */
    <K extends FormFieldName<T>>(name: K, value: T[K]): void;
    /** 按动态字段名写入字段值。 */
    (name: string, value: unknown): void;
};

/** 字段校验规则。 */
export interface ValidatorRule {
    /** 是否必填。 */
    required?: boolean;
    /** 校验失败提示文案。 */
    message?: string;
    /** 正则校验模式。 */
    pattern?: RegExp;
    /** 自定义校验器，抛错或返回 rejected 即视为失败。 */
    validator?: (value: unknown) => Promise<void> | void;
}

/** 对外暴露的表单实例能力。 */
export interface FormInstance<T extends FormValues = FormValues> {
    /** 读取字段值。 */
    getFieldValue: FormFieldGetter<T>;
    /** 写入字段值。 */
    setFieldValue: FormFieldSetter<T>;
    /** 执行全量校验并返回表单值。 */
    validateFields: () => Promise<T>;
    /** 触发表单提交。 */
    submit: (e?: FormEvent) => Promise<void>;
    /** 读取字段错误信息。 */
    getFieldError: (name: string) => string | undefined;
    /** 单字段校验，校验通过返回 true，失败返回 false 并设置错误信息。 */
    validateSingleField: (name: string) => Promise<boolean>;
    /** 重置表单，清空所有字段值和错误信息。 */
    reset: () => void;
}

export type FormRequiredMark = boolean | 'optional';

/** 表单上下文能力。 */
export interface FormContextType {
    /** 全局必填标识展示策略。 */
    requiredMark: FormRequiredMark;
    /** 注册字段及其校验规则。 */
    registerField: (name: string, rules: ValidatorRule[]) => void;
    /** 注销字段。 */
    unregisterField: (name: string) => void;
    /** 写入字段值。 */
    setFieldValue: (name: string, value: unknown) => void;
    /** 读取字段值。 */
    getFieldValue: (name: string) => unknown;
    /** 读取字段错误信息。 */
    getFieldError: (name: string) => string | undefined;
    /** 触发表单提交。 */
    submit: (e?: FormEvent) => Promise<void>;
    /**
     * 按字段名订阅该字段的值/错误变更通知（精细化更新，避免全量重渲染）。
     * 返回取消订阅的函数。
     */
    subscribeField: (name: string, listener: () => void) => () => void;
}
