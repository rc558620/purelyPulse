// 修改昵称页面类型、字段配置与校验规则。
import type { FormErrorMap, FormInstance, ValidatorRule } from '@components/form';
import { normalizeFieldValue } from '@pages/login/shared/authValidation';

/** 修改昵称表单 DTO。 */
export interface ChangeNicknameFormDTO {
    /** 新昵称。 */
    nickname: string;
}

/** 修改昵称表单错误映射。 */
export type ChangeNicknameFormErrors = FormErrorMap<ChangeNicknameFormDTO>;

/** 修改昵称表单校验规则集合。 */
export type ChangeNicknameFormRules = Record<keyof ChangeNicknameFormDTO, ValidatorRule[]>;

/** 昵称字段展示配置。 */
export interface NicknameFieldConfig {
    /** 字段名。 */
    key: keyof ChangeNicknameFormDTO;
    /** 展示标签。 */
    label: string;
    /** 占位文案。 */
    placeholder: string;
    /** 最大长度。 */
    maxLength: number;
}

/** 昵称最大字符数：非 UI 数字展示，无需 safeNum。 */
export const NICKNAME_MAX_LENGTH = 20;

/** 昵称字段配置。 */
export const NICKNAME_FIELD_CONFIG: NicknameFieldConfig = {
    key: 'nickname',
    label: '新昵称',
    placeholder: '请输入新昵称',
    maxLength: NICKNAME_MAX_LENGTH,
};

/** 修改昵称接口请求 DTO。 */
export interface ChangeNicknameRequestDTO {
    /** 后端协议中的昵称字段。 */
    name: string;
}

/**
 * 规范化修改昵称提交数据，并映射到后端字段。
 * @param values - 原始表单值。
 * @returns 去除空白后的接口请求参数。
 */
export const normalizeChangeNicknamePayload = (
    values: ChangeNicknameFormDTO,
): ChangeNicknameRequestDTO => ({
    name: normalizeFieldValue(values.nickname),
});

/**
 * 构建修改昵称表单校验规则，支持注入 form 实例与当前昵称。
 * @param form - 表单实例（由 useSettingsForm 传入，保持签名一致）。
 * @param currentNickname - 用户当前昵称（用于同值校验）。
 * @returns 各字段对应的 ValidatorRule 数组映射。
 */
export const buildChangeNicknameRules = (
    form: FormInstance<ChangeNicknameFormDTO>,
    currentNickname: string,
): ChangeNicknameFormRules => ({
    nickname: [
        {
            required: true,
            message: '请输入新昵称',
        },
        {
            validator: (value: unknown): void => {
                const trimmed = normalizeFieldValue(value);
                // 仅空格输入时 required 不会拦截（原始值非空串），此处兜底
                if (trimmed.length === 0) {
                    throw new Error('请输入新昵称');
                }
                if (trimmed.length > NICKNAME_FIELD_CONFIG.maxLength) {
                    throw new Error(`昵称长度不能超过${NICKNAME_FIELD_CONFIG.maxLength}个字符`);
                }
                // 新昵称与当前昵称相同时无需修改
                if (trimmed === currentNickname.trim()) {
                    throw new Error('新昵称与当前昵称相同');
                }
            },
        },
    ],
});
