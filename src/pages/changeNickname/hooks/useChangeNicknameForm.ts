// 修改昵称页面表单逻辑 Hook：管理表单实例、校验规则与提交流程。
import { useEffect } from 'react';
import { showToast } from '@components/ui/feedback/Toast';
import { useUser } from '@/contexts';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import { changeNickname } from '@pages/changeNickname/changeNickname.service';
import { syncAuthProfileToSession } from '@pages/login/shared/authSession';
import { useSettingsForm } from '@pages/changePassword/shared/useSettingsForm';
import type {
    ChangeNicknameFormDTO,
    ChangeNicknameFormErrors,
    ChangeNicknameFormRules,
} from '@pages/changeNickname/changeNickname.types';
import {
    buildChangeNicknameRules,
    normalizeChangeNicknamePayload,
} from '@pages/changeNickname/changeNickname.types';

/** useChangeNicknameForm 返回值。 */
export interface UseChangeNicknameFormReturn {
    /** 表单实例。 */
    form: ReturnType<typeof useSettingsForm<ChangeNicknameFormDTO>>['form'];
    /** 各字段校验规则集合。 */
    rules: ChangeNicknameFormRules;
    /** 是否处于提交中。 */
    submitting: boolean;
    /** 返回上一页。 */
    handleBack: () => void;
    /** 表单校验通过回调。 */
    handleFinish: (values: ChangeNicknameFormDTO) => Promise<void>;
    /** 表单校验失败回调。 */
    handleFinishFailed: (errors: ChangeNicknameFormErrors) => void;
}

/** 修改昵称表单逻辑 Hook。 */
export const useChangeNicknameForm = (): UseChangeNicknameFormReturn => {
    const navigate = useAnimatedNavigate();
    const { userInfo, updateUserInfo } = useUser();

    const {
        form,
        rules,
        submitting,
        handleBack,
        handleFinish,
        handleFinishFailed,
    } = useSettingsForm<ChangeNicknameFormDTO>({
        buildRules: buildChangeNicknameRules,
        onSubmit: async (values) => {
            const payload = normalizeChangeNicknamePayload(values);
            const latestProfile = await changeNickname(payload);

            // 同步更新会话与 UserContext 中的最新资料
            syncAuthProfileToSession(latestProfile);
            updateUserInfo(latestProfile);

            showToast({ message: '昵称修改成功', type: 'success' });
            navigate(-1);
        },
        onFinishFailed: (errors) => {
            console.log('Change Nickname Failed:', errors);
        },
    });

    // 页面加载时回填当前昵称
    useEffect(() => {
        if (userInfo.name) {
            form.setFieldValue('nickname', userInfo.name);
        }
    }, [form, userInfo.name]);

    return {
        form,
        rules,
        submitting,
        handleBack,
        handleFinish,
        handleFinishFailed,
    };
};
