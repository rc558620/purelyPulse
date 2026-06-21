// 修改密码表单展示组件：负责所有字段渲染与提交按钮，纯展示。
import React, { memo, useCallback } from 'react';
import { Form, FormItem, type FormInstance } from '@components/form';
import Button from '@components/ui/action/Button';
import { Input } from '@components/form/Input/Input';
import PasswordVisibilityToggle from '@pages/login/shared/PasswordVisibilityToggle/PasswordVisibilityToggle';
import { CHANGE_PASSWORD_FIELDS } from '../../changePassword.types';
import type {
    ChangePasswordFormDTO,
    ChangePasswordFormErrors,
    ChangePasswordFormRules,
    PasswordFieldKey,
} from '../../changePassword.types';
import styles from './ChangePasswordForm.module.less';
import icLock from '@assets/image/Additional/lock.svg';

// 所有密码字段共用的前缀图标（引用稳定，避免子树 re-render）
const PREFIX_LOCK = (
    <div className={styles.iconWrapper}>
        <img src={icLock} alt="密码图标" className={styles.inputIcon} />
        <span className={styles.separator} />
    </div>
);

interface ChangePasswordFormProps {
    /** 表单实例（由 useChangePasswordForm 提供）。 */
    form: FormInstance<ChangePasswordFormDTO>;
    /** 各字段校验规则集合。 */
    rules: ChangePasswordFormRules;
    /** 是否处于提交中。 */
    submitting: boolean;
    /** 各密码字段明/密文可见性映射。 */
    passwordVisibility: Record<PasswordFieldKey, boolean>;
    /** 切换密码字段可见性。 */
    onTogglePasswordVisibility: (field: PasswordFieldKey) => void;
    /** 表单校验通过回调。 */
    onFinish: (values: ChangePasswordFormDTO) => Promise<void>;
    /** 表单校验失败回调。 */
    onFinishFailed: (errors: ChangePasswordFormErrors) => void;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = memo(({
    form,
    rules,
    submitting,
    passwordVisibility,
    onTogglePasswordVisibility,
    onFinish,
    onFinishFailed,
}) => {
    // 为每个字段生成稳定的切换回调，防止 PasswordVisibilityToggle memo 因 onClick 变化触发无效 re-render
    const handleToggleOld = useCallback(
        () => onTogglePasswordVisibility('oldPassword'),
        [onTogglePasswordVisibility],
    );
    const handleToggleNew = useCallback(
        () => onTogglePasswordVisibility('newPassword'),
        [onTogglePasswordVisibility],
    );
    const handleToggleConfirm = useCallback(
        () => onTogglePasswordVisibility('confirmPassword'),
        [onTogglePasswordVisibility],
    );

    /** 各字段对应的稳定切换回调映射（顺序与 CHANGE_PASSWORD_FIELDS 对齐）。 */
    const toggleHandlers: Record<PasswordFieldKey, () => void> = {
        oldPassword: handleToggleOld,
        newPassword: handleToggleNew,
        confirmPassword: handleToggleConfirm,
    };

    return (
        <Form
            form={form}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            className={styles.formContainer}
        >
            {CHANGE_PASSWORD_FIELDS.map(fieldConfig => (
                <FormItem
                    key={fieldConfig.key}
                    name={fieldConfig.key}
                    label={fieldConfig.label}
                    rules={rules[fieldConfig.key]}
                >
                    <Input
                        type={passwordVisibility[fieldConfig.key] ? 'text' : 'password'}
                        placeholder={fieldConfig.placeholder}
                        autoComplete={fieldConfig.autoComplete}
                        prefix={PREFIX_LOCK}
                        suffix={
                            <PasswordVisibilityToggle
                                visible={passwordVisibility[fieldConfig.key]}
                                ariaLabel={
                                    passwordVisibility[fieldConfig.key]
                                        ? `隐藏${fieldConfig.label}`
                                        : `显示${fieldConfig.label}`
                                }
                                onToggle={toggleHandlers[fieldConfig.key]}
                            />
                        }
                    />
                </FormItem>
            ))}

            <Button
                type="submit"
                loading={submitting}
                className={styles.submitButton}
            >
                {submitting ? '修改中…' : '确认修改'}
            </Button>
        </Form>
    );
});

ChangePasswordForm.displayName = 'ChangePasswordForm';

export default ChangePasswordForm;
