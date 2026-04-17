// auth 系列页面共用的校验常量与工具函数。
// 替代 login.types / register.types / forgotPassword 各自重复定义的正则和 normalizeFieldValue。

/** 手机号正则校验规则（1 开头，第二位 3-9，共 11 位）。 */
export const PHONE_PATTERN: RegExp = /^1[3-9]\d{9}$/;

/** 短信验证码格式校验规则（6 位纯数字）。 */
export const CODE_PATTERN: RegExp = /^\d{6}$/;

/** 密码格式校验规则（至少 6 位任意字符）。 */
export const PASSWORD_PATTERN: RegExp = /^.{6,}$/;

/** 验证码倒计时总秒数。 */
export const COUNTDOWN_SECONDS = 60;

/**
 * 标准化字段值，去除首尾空格。
 * @param value - 表单字段原始值（来自 ValidatorRule validator 回调的 value 参数）。
 * @returns 字符串类型的字段值；非字符串返回空串。
 */
export const normalizeFieldValue = (value: unknown): string =>
    typeof value === 'string' ? value.trim() : '';
