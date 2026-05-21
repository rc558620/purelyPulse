// 登录页面：账号密码登录入口，包含品牌 Logo 区、表单区及底部协议链接。
import React, { memo } from 'react';
import AuthPageLayout from './shared/AuthPageLayout/AuthPageLayout';
import LoginHeader from './components/LoginHeader/LoginHeader';
import LoginForm from './components/LoginForm/LoginForm';
import { useLoginForm } from './hooks/useLoginForm';

/** 登录页面组件。 */
const Login: React.FC = memo(() => {
    const {
        form,
        showPassword,
        isSubmitting,
        togglePasswordVisibility,
        handleFinish,
        handleFinishFailed,
        handleNavigateToRegister,
        handleNavigateToForgotPassword,
    } = useLoginForm();

    return (
        <AuthPageLayout contentAlign="center">
            {/* 品牌 Logo 区 */}
            <LoginHeader />

            {/* 登录表单区 */}
            <LoginForm
                form={form}
                showPassword={showPassword}
                isSubmitting={isSubmitting}
                onTogglePassword={togglePasswordVisibility}
                onFinish={handleFinish}
                onFinishFailed={handleFinishFailed}
                onNavigateToRegister={handleNavigateToRegister}
                onNavigateToForgotPassword={handleNavigateToForgotPassword}
            />
        </AuthPageLayout>
    );
});

Login.displayName = 'Login';

export default Login;
