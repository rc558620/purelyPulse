// 登录表单字段区：包含手机号、密码输入框及提交操作，纯展示组件。
import React, { memo, type MouseEvent } from 'react';
import { Form, FormItem, type FormInstance } from '@components/form';
import { Input } from '@components/form/Input/Input';
import Button from '@components/ui/action/Button';
import InputPrefixIcon from '@pages/login/shared/InputPrefixIcon/InputPrefixIcon';
import PasswordVisibilityToggle from '@pages/login/shared/PasswordVisibilityToggle/PasswordVisibilityToggle';
import type { LoginFormDTO, LoginFormErrors } from '@pages/login/login.types';
import styles from './LoginForm.module.less';

import icSmartphone from '@assets/image/Additional/smartphone.svg';
import icLock from '@assets/image/Additional/lock.svg';

const PREFIX_PHONE = <InputPrefixIcon icon={icSmartphone} alt="手机号图标" />;
const PREFIX_LOCK = <InputPrefixIcon icon={icLock} alt="密码图标" />;

export interface LoginFormProps {
    /** 表单实例（由 useLoginForm 提供）。 */
    form: FormInstance<LoginFormDTO>;
    /** 密码是否明文可见。 */
    showPassword: boolean;
    /** 当前是否处于登录提交中。 */
    isSubmitting: boolean;
    /** 切换密码明/密文显示状态。 */
    onTogglePassword: () => void;
    /** 表单校验通过后的提交回调。 */
    onFinish: (values: LoginFormDTO) => void;
    /** 表单校验失败回调。 */
    onFinishFailed: (errors: LoginFormErrors) => void;
    /** 跳转至注册页回调。 */
    onNavigateToRegister: (event: MouseEvent<HTMLAnchorElement>) => void;
    /** 跳转至找回密码页回调。 */
    onNavigateToForgotPassword: (event: MouseEvent<HTMLAnchorElement>) => void;
}

const LoginForm: React.FC<LoginFormProps> = memo(({
    form,
    showPassword,
    isSubmitting,
    onTogglePassword,
    onFinish,
    onFinishFailed,
}) => (
    <Form
        form={form}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        className={styles.formContainer}
    >
        <FormItem name="phone" label="账号">
            <Input
                type="tel"
                placeholder="请输入账号"
                autoComplete="username"
                prefix={PREFIX_PHONE}
                disabled={isSubmitting}
            />
        </FormItem>

        <FormItem name="password" label="密码">
            <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="请输入密码"
                autoComplete="current-password"
                prefix={PREFIX_LOCK}
                disabled={isSubmitting}
                suffix={
                    <PasswordVisibilityToggle
                        visible={showPassword}
                        onToggle={onTogglePassword}
                    />
                }
            />
        </FormItem>

        <Button type="submit" className={styles.submitButton} loading={isSubmitting}>
            立即登录
        </Button>
    </Form>
));

LoginForm.displayName = 'LoginForm';

export default LoginForm;
