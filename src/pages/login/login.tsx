// 登录页面：账号密码登录入口，包含品牌 Logo 区、表单区及底部协议链接。
import React, { memo } from 'react';
import AuthPageLayout from './shared/AuthPageLayout/AuthPageLayout';
import AuthFooter from './shared/AuthFooter/AuthFooter';
import LoginHeader from './components/LoginHeader/LoginHeader';
import LoginForm from './components/LoginForm/LoginForm';
import { useLoginForm } from './hooks/useLoginForm';

/**
 * 登录页面组件。
 *
 * 业务逻辑全部委托给 {@link useLoginForm} Hook，组件层只负责布局与渲染。
 * 背景/布局由 {@link AuthPageLayout} 统一提供。
 * 品牌 Logo 区由 {@link LoginHeader} 负责。
 * 表单字段渲染由 {@link LoginForm} 负责。
 */
const Login: React.FC = memo(() => {
    const {
        form,
        showPassword,
        togglePasswordVisibility,
        handleFinish,
        handleFinishFailed,
        handleNavigateToRegister,
        handleNavigateToForgotPassword,
        handleNavigateToAgreement,
        handleNavigateToPrivacy,
    } = useLoginForm();

    return (
        <AuthPageLayout contentAlign="center">
            {/* ── 品牌 Logo 区 ─────────────────────────────── */}
            <LoginHeader />

            {/* ── 登录表单区 ───────────────────────────────── */}
            <LoginForm
                form={form}
                showPassword={showPassword}
                onTogglePassword={togglePasswordVisibility}
                onFinish={handleFinish}
                onFinishFailed={handleFinishFailed}
                onNavigateToRegister={handleNavigateToRegister}
                onNavigateToForgotPassword={handleNavigateToForgotPassword}
            />

            {/* ── 底部协议区 ───────────────────────────────── */}
            <AuthFooter
                action="登录"
                onAgreementClick={handleNavigateToAgreement}
                onPrivacyClick={handleNavigateToPrivacy}
            />
        </AuthPageLayout>
    );
});

Login.displayName = 'Login';

export default Login;
