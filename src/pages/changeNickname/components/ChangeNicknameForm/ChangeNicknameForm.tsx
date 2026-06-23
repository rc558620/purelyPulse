// 修改昵称表单展示组件：负责字段渲染与提交按钮，纯展示。
import React, { memo } from 'react';
import { Form, FormItem, type FormInstance } from '@components/form';
import Button from '@components/ui/action/Button';
import { Input } from '@components/form/Input/Input';
import { NICKNAME_FIELD_CONFIG } from '../../changeNickname.types';
import type {
    ChangeNicknameFormDTO,
    ChangeNicknameFormErrors,
    ChangeNicknameFormRules,
} from '../../changeNickname.types';
import { IconUserPrefix } from '../ChangeNicknameIcons/ChangeNicknameIcons';
import styles from './ChangeNicknameForm.module.less';

// ─── 模块级常量：前缀图标（引用稳定，避免子树 re-render） ──────────────────

/** 昵称字段共用的前缀图标（引用稳定）。 */
const PREFIX_USER = (
    <div className={styles.iconWrapper}>
        <IconUserPrefix className={styles.inputIcon} />
        <span className={styles.separator} />
    </div>
);

// ─── Props ──────────────────────────────────────────────────────────────────

interface ChangeNicknameFormProps {
    /** 表单实例（由 useChangeNicknameForm 提供）。 */
    form: FormInstance<ChangeNicknameFormDTO>;
    /** 各字段校验规则集合。 */
    rules: ChangeNicknameFormRules;
    /** 是否处于提交中。 */
    submitting: boolean;
    /** 表单校验通过回调。 */
    onFinish: (values: ChangeNicknameFormDTO) => Promise<void>;
    /** 表单校验失败回调。 */
    onFinishFailed: (errors: ChangeNicknameFormErrors) => void;
}

// ─── 主组件 ─────────────────────────────────────────────────────────────────

const ChangeNicknameForm: React.FC<ChangeNicknameFormProps> = memo(({
    form,
    rules,
    submitting,
    onFinish,
    onFinishFailed,
}) => (
    <Form
        form={form}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        className={styles.formContainer}
    >
        <FormItem
            name={NICKNAME_FIELD_CONFIG.key}
            label={NICKNAME_FIELD_CONFIG.label}
            rules={rules[NICKNAME_FIELD_CONFIG.key]}
        >
            <Input
                type="text"
                placeholder={NICKNAME_FIELD_CONFIG.placeholder}
                maxLength={NICKNAME_FIELD_CONFIG.maxLength}
                autoComplete="nickname"
                prefix={PREFIX_USER}
            />
        </FormItem>

        <Button
            type="submit"
            loading={submitting}
            className={styles.submitButton}
        >
            {submitting ? '保存中…' : '确认修改'}
        </Button>
    </Form>
));

ChangeNicknameForm.displayName = 'ChangeNicknameForm';

export default ChangeNicknameForm;
