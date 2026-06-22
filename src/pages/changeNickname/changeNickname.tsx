// 修改昵称页面：负责页面壳层布局与模块组合。
import React from 'react';
import SettingsPageLayout from '@pages/changePassword/shared/SettingsPageLayout/SettingsPageLayout';
import ChangeNicknameIntro from './components/ChangeNicknameIntro/ChangeNicknameIntro';
import ChangeNicknameForm from './components/ChangeNicknameForm/ChangeNicknameForm';
import { useChangeNicknameForm } from './hooks/useChangeNicknameForm';

/** 修改昵称页面 */
const ChangeNickname = (): React.JSX.Element => {
    const {
        form,
        rules,
        submitting,
        handleBack,
        handleFinish,
        handleFinishFailed,
    } = useChangeNicknameForm();

    return (
        <SettingsPageLayout title="修改昵称" onBack={handleBack}>
            {/* 图标说明区 */}
            <ChangeNicknameIntro />

            {/* 昵称表单区 */}
            <ChangeNicknameForm
                form={form}
                rules={rules}
                submitting={submitting}
                onFinish={handleFinish}
                onFinishFailed={handleFinishFailed}
            />
        </SettingsPageLayout>
    );
};

export default ChangeNickname;
