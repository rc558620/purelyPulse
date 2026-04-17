// 表单上下文定义，统一管理表单项与表单实例通信。
import { createContext, useContext } from 'react';
import type { FormContextType } from './types';

export const FormContext = createContext<FormContextType | null>(null);

/** 获取表单上下文。 */
export const useFormContext = (): FormContextType => {
    const context = useContext(FormContext);
    if (!context) {
        throw new Error('Form 相关组件必须在 Form 容器内使用');
    }
    return context;
};
