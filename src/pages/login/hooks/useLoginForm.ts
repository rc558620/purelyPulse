// 登录页表单逻辑 Hook：封装表单实例、密码可见性、真实登录提交与跳转逻辑。
import { useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useForm } from '@components/form';
import { showToast } from '@components/ui/feedback/Toast';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import { usePasswordVisibility } from '@hooks/usePasswordVisibility';
import { ROUTE_PATHS } from '@/router/paths';
import type { LoginFormDTO, LoginFormErrors } from '@pages/login/login.types';
import { fetchAuthProfile, loginWithPassword } from '../shared/auth.service';
import { clearAuthSession, persistAccessToken, syncAuthProfileToSession } from '../shared/authSession';

/** useLoginForm 返回值类型。 */
export interface UseLoginFormReturn {
    /** 表单实例。 */
    form: ReturnType<typeof useForm<LoginFormDTO>>[0];
    /** 密码是否明文可见。 */
    showPassword: boolean;
    /** 当前是否处于登录提交中。 */
    isSubmitting: boolean;
    /** 切换密码明/密文显示状态。 */
    togglePasswordVisibility: () => void;
    /** 表单校验通过后的提交回调。 */
    handleFinish: (values: LoginFormDTO) => void;
    /** 表单校验失败回调。 */
    handleFinishFailed: (errors: LoginFormErrors) => void;
    /** 跳转至注册页（用于锚点 onClick）。 */
    handleNavigateToRegister: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    /** 跳转至找回密码页（用于锚点 onClick）。 */
    handleNavigateToForgotPassword: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    /** 跳转至用户协议页（用于锚点 onClick）。 */
    handleNavigateToAgreement: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    /** 跳转至隐私政策页（用于锚点 onClick）。 */
    handleNavigateToPrivacy: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}

const resolveLoginRedirectPath = (search: string): string => {
    const redirect = new URLSearchParams(search).get('redirect')?.trim() ?? '';
    if (!redirect.startsWith('/')) {
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
 * - 封装各页面跳转处理，阻止默认锚点行为
 */
export const useLoginForm = (): UseLoginFormReturn => {
    const navigate = useAnimatedNavigate();
    const location = useLocation();
    const [form] = useForm<LoginFormDTO>();
    const { visibility, toggle } = usePasswordVisibility(['password']);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    /** 切换密码字段明文/密文显示状态。 */
    const togglePasswordVisibility = useCallback((): void => {
        toggle('password');
    }, [toggle]);

    const submitLogin = useCallback(async (values: LoginFormDTO): Promise<void> => {
        let shouldRollbackSession = false;
        setIsSubmitting(true);

        try {
            const loginResult = await loginWithPassword({
                phone: values.phone.trim(),
                password: values.password,
            });
            persistAccessToken(loginResult.accessToken);
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
            setIsSubmitting(false);
        }
    }, [location.search, navigate]);

    /**
     * 表单校验通过后的提交回调。
     * @param values - 已通过校验的表单字段值。
     */
    const handleFinish = useCallback((values: LoginFormDTO): void => {
        void submitLogin(values);
    }, [submitLogin]);

    /**
     * 表单校验失败时的回调，接收各字段错误映射。
     * @param errors - 各字段名对应的错误提示文案。
     */
    const handleFinishFailed = useCallback((_errors: LoginFormErrors): void => {
        showToast({ type: 'warning', message: '请先完善登录信息' });
    }, []);

    const handleNavigateToRegister = useCallback(
        (event: React.MouseEvent<HTMLAnchorElement>): void => {
            event.preventDefault();
            navigate('/register');
        },
        [navigate],
    );

    const handleNavigateToForgotPassword = useCallback(
        (event: React.MouseEvent<HTMLAnchorElement>): void => {
            event.preventDefault();
            navigate('/forgot-password');
        },
        [navigate],
    );

    const handleNavigateToAgreement = useCallback(
        (event: React.MouseEvent<HTMLAnchorElement>): void => {
            event.preventDefault();
            navigate('/user-agreement');
        },
        [navigate],
    );

    const handleNavigateToPrivacy = useCallback(
        (event: React.MouseEvent<HTMLAnchorElement>): void => {
            event.preventDefault();
            navigate('/privacy-policy');
        },
        [navigate],
    );

    return {
        form,
        showPassword: visibility.password,
        isSubmitting,
        togglePasswordVisibility,
        handleFinish,
        handleFinishFailed,
        handleNavigateToRegister,
        handleNavigateToForgotPassword,
        handleNavigateToAgreement,
        handleNavigateToPrivacy,
    };
};
