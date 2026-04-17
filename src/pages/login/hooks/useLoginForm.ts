// 登录页表单逻辑 Hook：封装表单实例、密码可见性及提交/跳转逻辑。
import { useCallback } from 'react';
import { useForm } from '@components/form';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import { usePasswordVisibility } from '@hooks/usePasswordVisibility';
import type { LoginFormDTO, LoginFormErrors } from '@pages/auth/login/login.types';

/** useLoginForm 返回值类型。 */
export interface UseLoginFormReturn {
    /** 表单实例。 */
    form: ReturnType<typeof useForm<LoginFormDTO>>[0];
    /** 密码是否明文可见。 */
    showPassword: boolean;
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

/**
 * 登录页表单逻辑 Hook。
 *
 * 职责：
 * - 维护表单实例
 * - 管理密码可见性状态（showPassword），委托给 {@link usePasswordVisibility}
 * - 封装提交成功/失败回调，成功后跳转至 /home
 * - 封装各页面跳转处理，阻止默认锚点行为
 */
export const useLoginForm = (): UseLoginFormReturn => {
    const navigate = useAnimatedNavigate();
    const [form] = useForm<LoginFormDTO>();
    const { visibility, toggle } = usePasswordVisibility(['password']);

    /** 切换密码字段明文/密文显示状态。 */
    const togglePasswordVisibility = useCallback((): void => {
        toggle('password');
    }, [toggle]);

    /**
     * 表单校验通过后的提交回调，跳转至首页。
     * @param values - 已通过校验的表单字段值。
     */
    const handleFinish = useCallback(
        (values: LoginFormDTO): void => {
            console.log('Login Success:', values);
            navigate('/home');
        },
        [navigate],
    );

    /**
     * 表单校验失败时的回调，接收各字段错误映射。
     * @param errors - 各字段名对应的错误提示文案。
     */
    const handleFinishFailed = useCallback((errors: LoginFormErrors): void => {
        console.log('Login Failed:', errors);
    }, []);

    /** 4 个页面跳转回调：各自内联箭头函数，阻止默认锚点行为。 */
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
        togglePasswordVisibility,
        handleFinish,
        handleFinishFailed,
        handleNavigateToRegister,
        handleNavigateToForgotPassword,
        handleNavigateToAgreement,
        handleNavigateToPrivacy,
    };
};
