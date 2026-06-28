// 登录页表单逻辑 Hook：封装表单实例、密码可见性、真实登录提交与跳转逻辑。
import { useCallback, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useForm } from '@components/form';
import { showToast } from '@components/ui/feedback/Toast';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import { usePasswordVisibility } from '@hooks/usePasswordVisibility';
import { ROUTE_PATHS } from '@/router/paths';
import type { LoginFormDTO, LoginFormErrors } from '@pages/login/login.types';
import { PHONE_PATTERN, PASSWORD_PATTERN } from '@pages/login/shared/authValidation';
import { fetchAuthProfile, loginWithPassword } from '../shared/auth.service';
import { clearAuthSession, markAuthenticated, syncAuthProfileToSession } from '../shared/authSession';

/** useLoginForm 返回值类型。 */
export interface UseLoginFormReturn {
    /** 表单实例。 */
    form: ReturnType<typeof useForm<LoginFormDTO>>[0];
    /** 密码是否明文可见。 */
    showPassword: boolean;
    /** 当前是否处于登录提交中。 */
    isSubmitting: boolean;
    /** 手机号字段校验规则。 */
    phoneRules: import('@components/form').ValidatorRule[];
    /** 密码字段校验规则。 */
    passwordRules: import('@components/form').ValidatorRule[];
    /** 切换密码明/密文显示状态。 */
    togglePasswordVisibility: () => void;
    /** 表单校验通过后的提交回调。 */
    handleFinish: (values: LoginFormDTO) => void;
    /** 表单校验失败回调。 */
    handleFinishFailed: (errors: LoginFormErrors) => void;
}

const resolveLoginRedirectPath = (search: string): string => {
    const redirect = new URLSearchParams(search).get('redirect')?.trim() ?? '';
    // 防御 Open Redirect：必须以 / 开头且第二个字符不能是 /（避免 //evil.com 绕过）
    if (!redirect.startsWith('/') || redirect.startsWith('//')) {
        return ROUTE_PATHS.home;
    }
    return redirect;
};

/**
 * 登录页表单逻辑 Hook。
 *
 * 职责：
 * - 维护表单实例
 * - 管理密码可见性状态（showPassword），委托给 {@link usePasswordVisibility}
 * - 封装真实登录提交、token 持久化与用户信息初始化
 */

// 手机号字段校验规则（模块级常量，引用稳定）
const PHONE_RULES: import('@components/form').ValidatorRule[] = [
    { required: true, message: '请输入手机号' },
    { pattern: PHONE_PATTERN, message: '请输入正确的手机号' },
];

// 密码字段校验规则（模块级常量，引用稳定）
const PASSWORD_RULES: import('@components/form').ValidatorRule[] = [
    { required: true, message: '请输入密码' },
    { pattern: PASSWORD_PATTERN, message: '密码至少 6 位' },
];

/** 登录页表单逻辑 Hook。 */

export const useLoginForm = (): UseLoginFormReturn => {
    const navigate = useAnimatedNavigate();
    const location = useLocation();
    const [form] = useForm<LoginFormDTO>();
    const { visibility, toggle } = usePasswordVisibility(['password']);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    // 用 ref 追踪提交状态，避免闭包陈旧值导致重复提交
    const isSubmittingRef = useRef(false);

    /** 切换密码字段明文/密文显示状态。 */
    const togglePasswordVisibility = useCallback((): void => {
        toggle('password');
    }, [toggle]);

    const submitLogin = useCallback(async (values: LoginFormDTO): Promise<void> => {
        // 使用 ref 守卫，防止闭包陈旧值导致的重复提交
        if (isSubmittingRef.current) {
            return;
        }

        let shouldRollbackSession = false;
        isSubmittingRef.current = true;
        setIsSubmitting(true);

        try {
            const loginResult = await loginWithPassword({
                phone: values.phone.trim(),
                password: values.password,
            });
            markAuthenticated(loginResult.accessToken);
            shouldRollbackSession = true;

            const profile = await fetchAuthProfile();
            syncAuthProfileToSession(profile);

            showToast({ type: 'success', message: '登录成功' });
            navigate(resolveLoginRedirectPath(location.search), { replace: true });
        } catch (error) {
            if (shouldRollbackSession) {
                clearAuthSession();
            }

            if (error instanceof Error) {
                showToast({ type: 'error', message: error.message || '登录失败，请稍后重试' });
                return;
            }

            showToast({ type: 'error', message: '登录失败，请稍后重试' });
        } finally {
            isSubmittingRef.current = false;
            setIsSubmitting(false);
        }
    }, [location.search, navigate]);

    /** 表单校验通过后的提交回调。 */
    const handleFinish = useCallback((values: LoginFormDTO): void => {
        void submitLogin(values);
    }, [submitLogin]);

    /**
     * 表单校验失败时的回调，接收各字段错误映射。
     * @param errors - 各字段名对应的错误提示文案。
     */
    const handleFinishFailed = useCallback(// eslint-disable-next-line @typescript-eslint/no-unused-vars
        (_errors: LoginFormErrors): void => {
        showToast({ type: 'warning', message: '请先完善登录信息' });
    }, []);

    return {
        form,
        showPassword: visibility.password,
        isSubmitting,
        phoneRules: PHONE_RULES,
        passwordRules: PASSWORD_RULES,
        togglePasswordVisibility,
        handleFinish,
        handleFinishFailed,
    };
};
