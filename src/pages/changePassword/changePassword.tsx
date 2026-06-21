// 修改密码页面：负责页面壳层布局与模块组合。
import React from 'react';
import SettingsPageLayout from './shared/SettingsPageLayout/SettingsPageLayout';
import ChangePasswordIntro from './components/ChangePasswordIntro/ChangePasswordIntro';
import ChangePasswordForm from './components/ChangePasswordForm/ChangePasswordForm';
import { useChangePasswordForm } from './hooks/useChangePasswordForm';

const ChangePassword = (): React.JSX.Element => {
    const {
        form,
        rules,
        submitting,
        passwordVisibility,
        togglePasswordVisibility,
        handleBack,
        handleFinish,
        handleFinishFailed,
    } = useChangePasswordForm();

    return (
        <SettingsPageLayout title="修改密码" onBack={handleBack}>
            {/* 图标说明区 */}
            <ChangePasswordIntro />

            {/* 表单区 */}
            <ChangePasswordForm
                form={form}
                rules={rules}
                submitting={submitting}
                passwordVisibility={passwordVisibility}
                onTogglePasswordVisibility={togglePasswordVisibility}
                onFinish={handleFinish}
                onFinishFailed={handleFinishFailed}
            />
        </SettingsPageLayout>
    );
};

export default ChangePassword;
