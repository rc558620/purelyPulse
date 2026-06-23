// 登录页表单类型定义。

/** 登录表单 DTO。 */
export interface LoginFormDTO {
    /** 手机号。 */
    phone: string;
    /** 登录密码。 */
    password: string;
}

/** 登录表单校验错误映射（每个字段可选）。 */
export type LoginFormErrors = Partial<Record<keyof LoginFormDTO, string>>;
