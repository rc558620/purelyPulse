// auth 系列页面共用的发送验证码逻辑 Hook。
// 替代 useRegisterForm / useForgotPasswordForm 中重复的 handleSendCode 实现。
import { useCallback } from 'react';
import { useCountdown } from '@hooks/useCountdown';
import { showToast } from '@components/ui/feedback/Toast';
import { safeNum } from '@utils/utils';
import { COUNTDOWN_SECONDS } from '@pages/login/shared/authValidation';

export interface UseSendCodeOptions {
    /**
     * 发送前执行手机号校验的函数，返回校验是否通过。
     * 由调用方提供（通常是 `form.validateSingleField('phone')`），
     * 以解耦 Hook 对具体表单实例的依赖。
     */
    validatePhone: () => Promise<boolean>;
}

export interface UseSendCodeReturn {
    /** 倒计时中按钮禁用（true = 不可点击）。 */
    isCodeButtonDisabled: boolean;
    /** 按钮展示文案，如 "获取验证码" / "58s后重试"。 */
    codeButtonText: string;
    /** 点击发送按钮的回调，含手机号前置校验和倒计时防重。 */
    handleSendCode: () => Promise<void>;
}

/**
 * 验证码发送逻辑 Hook。
 *
 * 封装了 register / forgotPassword 两个页面完全相同的发码流程：
 * 1. 若倒计时激活则直接 return（防重复点击）
 * 2. 调用 validatePhone 校验手机号；不通过则 toast 并 return
 * 3. TODO: 接入真实发码接口
 * 4. 启动倒计时，toast 成功提示
 */
export const useSendCode = ({ validatePhone }: UseSendCodeOptions): UseSendCodeReturn => {
    const { countdown, isActive: isCodeButtonDisabled, start: startCountdown } = useCountdown();

    const handleSendCode = useCallback(async (): Promise<void> => {
        if (isCodeButtonDisabled) {
            return;
        }

        const isPhoneValid = await validatePhone();
        if (!isPhoneValid) {
            showToast({ message: '请先输入正确的手机号', type: 'warning' });
            return;
        }

        // TODO: 接入验证码发送接口。
        startCountdown(COUNTDOWN_SECONDS);
        showToast({ message: '验证码已发送，请注意查收', type: 'success' });
    }, [isCodeButtonDisabled, validatePhone, startCountdown]);

    const codeButtonText = isCodeButtonDisabled ? `${safeNum(countdown)}s后重试` : '获取验证码';

    return {
        isCodeButtonDisabled,
        codeButtonText,
        handleSendCode,
    };
};
