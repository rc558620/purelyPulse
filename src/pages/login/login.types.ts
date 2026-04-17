// 登录页表单与视图类型定义。
import type { ValidatorRule } from '@components/form';
export { PHONE_PATTERN, PASSWORD_PATTERN } from '@pages/login/shared/authValidation';

/** 登录表单 DTO。 */
export interface LoginFormDTO {
    /** 手机号。 */
    phone: string;
    /** 登录密码。 */
    password: string;
}

/** 登录表单校验错误映射（每个字段可选）。 */
export type LoginFormErrors = Partial<Record<keyof LoginFormDTO, string>>;

/** 登录表单校验规则集合。 */
export type LoginFormRules = Record<keyof LoginFormDTO, ValidatorRule[]>;

/** 登录页面组件 Props（无外部 props）。 */
export type LoginProps = Record<string, never>;
