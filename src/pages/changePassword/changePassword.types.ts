// 修改密码页面类型、字段配置与校验规则。
import type { FormErrorMap, ValidatorRule } from '@components/form';
import { PASSWORD_PATTERN, normalizeFieldValue } from '@pages/login/shared/authValidation';

export {
    PASSWORD_PATTERN,
    normalizeFieldValue,
} from '@pages/login/shared/authValidation';

/** 修改密码表单 DTO。 */
export interface ChangePasswordFormDTO {
    /** 当前密码。 */
    oldPassword: string;
    /** 新密码。 */
    newPassword: string;
    /** 确认新密码。 */
    confirmPassword: string;
}

/** 修改密码表单错误映射。 */
export type ChangePasswordFormErrors = FormErrorMap<ChangePasswordFormDTO>;

/** 密码字段可见性键。 */
export type PasswordFieldKey = keyof ChangePasswordFormDTO;

/** 修改密码表单校验规则集合。 */
export type ChangePasswordFormRules = Record<keyof ChangePasswordFormDTO, ValidatorRule[]>;

/** 密码字段展示配置。 */
export interface PasswordFieldConfig {
    /** 字段名。 */
    key: PasswordFieldKey;
    /** 展示标签。 */
    label: string;
    /** 占位文案。 */
    placeholder: string;
    /** 浏览器自动填充语义。 */
    autoComplete: string;
}

/** 修改密码表单字段配置数组（按顺序渲染）。 */
export const CHANGE_PASSWORD_FIELDS: PasswordFieldConfig[] = [
    {
        key: 'oldPassword',
        label: '当前密码',
        placeholder: '请输入当前密码',
        autoComplete: 'current-password',
    },
    {
        key: 'newPassword',
        label: '新密码',
        placeholder: '请设置新密码 (至少6位)',
        autoComplete: 'new-password',
    },
    {
        key: 'confirmPassword',
        label: '确认新密码',
        placeholder: '请再次输入新密码',
        autoComplete: 'new-password',
    },
];

/** 修改密码接口请求 DTO。 */
export interface ChangePasswordRequestDTO {
    /** 后端协议中的当前密码字段。 */
    currentPassword: string;
    /** 后端协议中的新密码字段。 */
    newPassword: string;
}

/** 修改密码接口响应 DTO。 */
export type ChangePasswordResponseDTO = {
    /** 是否更新成功。 */
    success?: boolean;
    /** 提示文案。 */
    message?: string;
} | void;

/**
 * 规范化修改密码提交数据，并映射到后端字段。
 * @param values - 原始表单值。
 * @returns 去除空白后的接口请求参数。
 */
export const normalizeChangePasswordPayload = (
    values: ChangePasswordFormDTO,
): ChangePasswordRequestDTO => ({
    currentPassword: normalizeFieldValue(values.oldPassword),
    newPassword: normalizeFieldValue(values.newPassword),
});

/**
 * 构建修改密码表单校验规则，支持注入 form 实例实现跨字段校验。
 * @param getFieldValue - 从 form 实例获取字段值的函数。
 * @returns 各字段对应的 ValidatorRule 数组映射。
 */
export const buildChangePasswordRules = (
    getFieldValue: (name: keyof ChangePasswordFormDTO) => unknown,
): ChangePasswordFormRules => {
    const requiredRule = (message: string): ValidatorRule => ({ required: true, message });

    return {
        oldPassword: [
            requiredRule('请输入当前密码'),
        ],
        newPassword: [
            requiredRule('请设置新密码'),
            { pattern: PASSWORD_PATTERN, message: '密码长度至少为6位' },
        ],
        confirmPassword: [
            requiredRule('请再次输入新密码'),
            {
                validator: (value: unknown): void => {
                    const newPassword = normalizeFieldValue(getFieldValue('newPassword'));
                    const confirm = normalizeFieldValue(value);
                    if (newPassword !== confirm) {
                        throw new Error('两次输入的密码不一致');
                    }
                },
            },
        ],
    };
};
