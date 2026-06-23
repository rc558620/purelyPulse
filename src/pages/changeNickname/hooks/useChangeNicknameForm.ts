// 修改昵称页面表单逻辑 Hook：管理表单实例、校验规则与提交流程。
import { useCallback, useEffect, useRef } from 'react';
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

    // 用 ref 保存当前昵称原始值，供 buildRules 同值校验使用
    const currentNicknameRef = useRef(userInfo.name);

    // Bug 5 修复：用 useCallback + 稳定依赖 稳定 onSubmit 引用，避免 handleFinish 频繁重建
    // Bug 8 修复：提交成功后用 navigate(-1) 统一返回，与 handleBack 职责清晰分离
    const onSubmit = useCallback(async (values: ChangeNicknameFormDTO) => {
        const payload = normalizeChangeNicknamePayload(values);
        const latestProfile = await changeNickname(payload);

        // 同步更新会话与 UserContext 中的最新资料
        syncAuthProfileToSession(latestProfile);
        updateUserInfo(latestProfile);

        showToast({ message: '昵称修改成功', type: 'success' });
        // 提交成功后自动返回上一页
        navigate(-1);
    }, [updateUserInfo, navigate]);

    const {
        form,
        rules,
        submitting,
        handleBack,
        handleFinish,
        handleFinishFailed,
    } = useSettingsForm<ChangeNicknameFormDTO>({
        // Bug 1 修复：buildRules 签名对齐 useSettingsForm，接收 form 实例
        // Bug 2 修复：传入当前昵称用于同值校验
        buildRules: (currentForm) => buildChangeNicknameRules(
            currentForm,
            currentNicknameRef.current,
        ),
        onSubmit,
        onFinishFailed: (errors) => {
            console.log('Change Nickname Failed:', errors);
        },
    });

    // Bug 6 修复：仅在组件挂载时回填当前昵称，避免提交成功后 userInfo 更新触发二次回填
    useEffect(() => {
        currentNicknameRef.current = userInfo.name;
        form.setFieldValue('nickname', userInfo.name);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        form,
        rules,
        submitting,
        handleBack,
        handleFinish,
        handleFinishFailed,
    };
};
