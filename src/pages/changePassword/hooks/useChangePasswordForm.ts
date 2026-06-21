// 修改密码页面表单逻辑 Hook：管理表单实例、校验规则、密码可见性与提交流程。
import { useCallback, useState } from 'react';
import { showToast } from '@components/ui/feedback/Toast';
import { useUser } from '@/contexts';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import { ROUTE_PATHS } from '@router/paths';
import { clearAuthSession } from '@pages/login/shared/authSession';
import { useSettingsForm } from '../shared/useSettingsForm';
import { changePassword } from '../changePassword.service';
import {
    buildChangePasswordRules,
    normalizeChangePasswordPayload,
} from '../changePassword.types';
import type {
    ChangePasswordFormDTO,
    ChangePasswordFormErrors,
    ChangePasswordFormRules,
    PasswordFieldKey,
} from '../changePassword.types';

/** useChangePasswordForm 返回值。 */
export interface UseChangePasswordFormReturn {
    /** 表单实例。 */
    form: ReturnType<typeof useSettingsForm<ChangePasswordFormDTO>>['form'];
    /** 各字段校验规则集合。 */
    rules: ChangePasswordFormRules;
    /** 是否处于提交中。 */
    submitting: boolean;
    /** 各密码字段明/密文可见性映射。 */
    passwordVisibility: Record<PasswordFieldKey, boolean>;
    /** 切换指定字段明/密文可见性。 */
    togglePasswordVisibility: (field: PasswordFieldKey) => void;
    /** 返回上一页。 */
    handleBack: () => void;
    /** 表单校验通过回调。 */
    handleFinish: (values: ChangePasswordFormDTO) => Promise<void>;
    /** 表单校验失败回调。 */
    handleFinishFailed: (errors: ChangePasswordFormErrors) => void;
}

/** 修改密码表单逻辑 Hook。 */
export const useChangePasswordForm = (): UseChangePasswordFormReturn => {
    const navigate = useAnimatedNavigate();
    const { clearUserInfo } = useUser();

    const [passwordVisibility, setPasswordVisibility] = useState<Record<PasswordFieldKey, boolean>>({
        oldPassword: false,
        newPassword: false,
        confirmPassword: false,
    });

    const {
        form,
        rules,
        submitting,
        handleBack,
        handleFinish,
        handleFinishFailed,
    } = useSettingsForm<ChangePasswordFormDTO>({
        buildRules: (currentForm) => buildChangePasswordRules(
            (name) => currentForm.getFieldValue(name),
        ),
        onSubmit: async (values) => {
            const payload = normalizeChangePasswordPayload(values);
            await changePassword(payload);
            clearAuthSession();
            clearUserInfo();
            showToast({ message: '密码修改成功，请重新登录', type: 'success' });
            navigate(ROUTE_PATHS.login, { replace: true });
        },
        onFinishFailed: (errors) => {
            console.log('Change Password Failed:', errors);
        },
    });

    /** 切换指定密码字段的明文/密文显示状态。 */
    const togglePasswordVisibility = useCallback((field: PasswordFieldKey): void => {
        setPasswordVisibility(prev => ({ ...prev, [field]: !prev[field] }));
    }, []);

    return {
        form,
        rules,
        submitting,
        passwordVisibility,
        togglePasswordVisibility,
        handleBack,
        handleFinish,
        handleFinishFailed,
    };
};
