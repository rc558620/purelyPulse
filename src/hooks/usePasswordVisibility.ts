// 密码显示/隐藏状态 Hook，统一替代 useLoginForm / useRegisterForm / forgotPassword 中重复的 state 逻辑。
import { useCallback, useState } from 'react';

export interface UsePasswordVisibilityReturn<K extends string> {
    /** 各密码字段的明文可见性映射。 */
    visibility: Record<K, boolean>;
    /** 切换指定字段的明/密文显示状态。 */
    toggle: (field: K) => void;
}

/**
 * 密码显示/隐藏状态管理 Hook。
 *
 * 统一替代以下三处重复逻辑：
 * - `useLoginForm`：`showPassword` state + `togglePasswordVisibility`
 * - `useRegisterForm`：`passwordVisibility` state + `togglePasswordVisibility`
 * - `forgotPassword`：`passwordVisibility` state + `togglePasswordVisibility`
 *
 * @param initialFields - 需要管理可见性的字段名数组，所有字段初始为 `false`（隐藏）。
 *
 * @example
 * // 单字段（登录页）
 * const { visibility, toggle } = usePasswordVisibility(['password']);
 * const showPassword = visibility.password;
 * const togglePasswordVisibility = useCallback(() => toggle('password'), [toggle]);
 *
 * @example
 * // 多字段（注册/找回密码）
 * const { visibility, toggle } = usePasswordVisibility(['password', 'confirmPassword']);
 */
export const usePasswordVisibility = <K extends string>(
    initialFields: K[],
): UsePasswordVisibilityReturn<K> => {
    const [visibility, setVisibility] = useState<Record<K, boolean>>(
        () => Object.fromEntries(initialFields.map(field => [field, false])) as Record<K, boolean>,
    );

    const toggle = useCallback((field: K): void => {
        setVisibility(prev => ({ ...prev, [field]: !prev[field] }));
    }, []);

    return { visibility, toggle };
};
