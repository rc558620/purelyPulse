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

/** 构建校验规则时注入的 form 实例方法子集。 */
export interface ChangePasswordFormHelper {
    /** 读取指定字段的当前值。 */
    getFieldValue: (name: keyof ChangePasswordFormDTO) => unknown;
    /** 触发指定字段的即时重校验（用于跨字段联动）。 */
    validateSingleField: (name: keyof ChangePasswordFormDTO) => Promise<boolean>;
}

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
 * @param helper - 表单实例方法子集，用于读取字段值与联动重校验。
 * @returns 各字段对应的 ValidatorRule 数组映射。
 */
export const buildChangePasswordRules = (
    helper: ChangePasswordFormHelper,
): ChangePasswordFormRules => {
    const { getFieldValue, validateSingleField } = helper;
    const requiredRule = (message: string): ValidatorRule => ({ required: true, message });

    return {
        oldPassword: [
            requiredRule('请输入当前密码'),
            {
                validator: (value: unknown): void => {
                    const trimmed = normalizeFieldValue(value);
                    if (trimmed.length === 0) {
                        throw new Error('请输入当前密码');
                    }
                    if (!PASSWORD_PATTERN.test(trimmed)) {
                        throw new Error('密码长度至少为6位');
                    }
                },
            },
        ],
        newPassword: [
            requiredRule('请设置新密码'),
            {
                validator: async (value: unknown): Promise<void> => {
                    const trimmed = normalizeFieldValue(value);
                    if (trimmed.length === 0) {
                        throw new Error('请设置新密码');
                    }
                    if (!PASSWORD_PATTERN.test(trimmed)) {
                        throw new Error('密码长度至少为6位');
                    }
                    // 新密码变更时，若确认密码已被校验过（dirty），则联动重校验
                    await validateSingleField('confirmPassword');
                },
            },
        ],
        confirmPassword: [
            requiredRule('请再次输入新密码'),
            {
                validator: (value: unknown): void => {
                    const newPassword = normalizeFieldValue(getFieldValue('newPassword'));
                    const confirm = normalizeFieldValue(value);
                    if (confirm.length === 0) {
                        throw new Error('请再次输入新密码');
                    }
                    if (newPassword !== confirm) {
                        throw new Error('两次输入的密码不一致');
                    }
                },
            },
        ],
    };
};
