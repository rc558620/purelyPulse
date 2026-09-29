// 会员模块取值与归一化：把不可信的后端响应收敛成前端可用的基础值（字符串 / 数字 / 布尔 / 时间戳 / 枚举）。
import { safeNum } from '@utils/utils';
import type { MemberPointsSource } from '../memberPoints/memberPoints.types';
import type { BeanRecord } from '../partnerBeans/partnerBeans.shared.types';
import type { MemberLevel, MemberStatus, RechargeRecord } from './memberList.types';

// maskPhone 已移除：purelyPulse 为商家管理后台，需完整展示用户手机号，不再脱敏。

/** 头像配色数量（与前端头像色表长度对齐）。 */
export const MEMBER_AVATAR_COLOR_COUNT = 6;
/** 一天的毫秒数。 */
export const DAY_MS = 86_400_000;

/** 是否为「普通对象」：排除 null 与数组，用于安全读取未知响应的字段。 */
export const isPlainObject = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

/** 是否为有限数字（过滤 NaN / Infinity）。 */
export const isFiniteNumber = (value: unknown): value is number => (
  typeof value === 'number' && Number.isFinite(value)
);

/** 按候选 key 取出第一层嵌套对象。 */
export const getNestedRecord = (value: unknown, keys: readonly string[]): Record<string, unknown> | null => {
  if (!isPlainObject(value)) {
    return null;
  }

  for (const key of keys) {
    const candidate = value[key];
    if (isPlainObject(candidate)) {
      return candidate;
    }
  }

  return null;
};

/** 按候选 key 取出第一层嵌套数组。 */
export const getNestedArray = (value: unknown, keys: readonly string[]): unknown[] => {
  if (!isPlainObject(value)) {
    return [];
  }

  for (const key of keys) {
    const candidate = value[key];
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
};

/** 把不可信值归一成数字：支持千分位字符串，无法解析时返回 0。 */
export const normalizeNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const sanitizedValue = value.replace(/,/g, '').trim();
    if (!sanitizedValue) {
      return 0;
    }
    const parsedValue = Number(sanitizedValue);
    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return 0;
};

/** 按候选 key 取数字：命中 0 也视为有效值（0 本身有业务语义）。 */
export const pickNumberField = (value: unknown, keys: readonly string[]): number => {
  if (!isPlainObject(value)) {
    return 0;
  }

  for (const key of keys) {
    const normalizedValue = normalizeNumber(value[key]);
    if (normalizedValue !== 0 || value[key] === 0 || value[key] === '0') {
      return safeNum(normalizedValue);
    }
  }

  return 0;
};

/** 按候选 key 取非空字符串。 */
export const pickStringField = (value: unknown, keys: readonly string[]): string => {
  if (!isPlainObject(value)) {
    return '';
  }

  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return '';
};

/** 直接从后端响应中读取金额展示字符串字段，前端不做转换。 */
export const pickDisplayField = (value: unknown, keys: readonly string[]): string => {
  if (!isPlainObject(value)) {
    return '';
  }

  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return '';
};

/** 按候选 key 取布尔值：兼容 1 / 0 / 'true' / 'false' 等松散下发。 */
export const pickBooleanField = (value: unknown, keys: readonly string[]): boolean => {
  if (!isPlainObject(value)) {
    return false;
  }

  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === 'boolean') {
      return candidate;
    }
    if (candidate === 1 || candidate === '1' || candidate === 'true') {
      return true;
    }
    if (candidate === 0 || candidate === '0' || candidate === 'false') {
      return false;
    }
  }

  return false;
};

/** 归一成毫秒时间戳：秒级时间戳自动换算，可解析字符串走 Date.parse，否则回落兜底值。 */
export const normalizeTimestamp = (value: unknown, fallbackValue: number): number => {
  if (value instanceof Date) {
    return value.getTime();
  }

  const numericValue = normalizeNumber(value);
  if (numericValue > 0) {
    return numericValue < 1_000_000_000_000 ? numericValue * 1000 : numericValue;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsedValue = Date.parse(value);
    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return fallbackValue;
};

/** 归一成「有值字符串」：空串 / 空白串 / 非字符串一律视为无值。 */
export const normalizeOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue || undefined;
};

/** 归一成「有值计数」：0 视为有效值（关闭 / 清零有业务语义），缺失时为 undefined。 */
export const normalizeOptionalCount = (value: unknown): number | undefined => {
  const normalizedValue = normalizeNumber(value);
  if (normalizedValue !== 0 || value === 0 || value === '0') {
    return safeNum(normalizedValue);
  }

  return undefined;
};

/** 头像首字：优先后端下发，缺失时取姓名首字，仍为空则回落到「会」。 */
export const resolveAvatarChar = (name: string, rawValue: unknown): string => {
  const providedAvatarChar = pickStringField(rawValue, ['avatarChar', 'avatarText', 'avatarInitial']);
  if (providedAvatarChar) {
    return providedAvatarChar.slice(0, 1);
  }

  const normalizedName = name.trim();
  return normalizedName ? normalizedName.slice(0, 1) : '会';
};

/** 头像配色下标：优先后端下发，缺失时按 id / 姓名哈希，保证同一会员配色稳定。 */
export const resolveAvatarColorIndex = (seedValue: string, rawValue: unknown): number => {
  const providedIndex = pickNumberField(rawValue, ['avatarColorIdx', 'avatarColorIndex']);
  if (providedIndex > 0 || providedIndex === 0) {
    return Math.abs(Math.round(providedIndex)) % MEMBER_AVATAR_COLOR_COUNT;
  }

  if (!seedValue) {
    return 0;
  }

  const hashValue = seedValue.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return hashValue % MEMBER_AVATAR_COLOR_COUNT;
};

/**
 * 从多个候选字段中解析会员到期时间。
 * 逻辑：依次尝试 membershipExpiry / expireAt / membershipExpireAt，
 * 仅当最终采纳的字段值为 null 时才返回 null（表示"明确无到期"），
 * 未提供的字段不参与 null 判定，避免误丢有效值。
 */
export const resolveMembershipExpiry = (
  rawValue: Record<string, unknown>,
): number | null | undefined => {
  const candidates = ['membershipExpiry', 'expireAt', 'membershipExpireAt'] as const;

  // 找到第一个非 undefined 的候选字段
  for (const key of candidates) {
    const fieldValue = rawValue[key];
    if (fieldValue !== undefined) {
      if (fieldValue === null) {
        return null;
      }
      const normalized = normalizeTimestamp(fieldValue, 0);
      return normalized > 0 ? normalized : undefined;
    }
  }

  return undefined;
};

/**
 * 是否在线：以后端下发的 `isOnline` 为准（服务端时钟与写入方一致，避免客户端时钟/时区误差）。
 * 字段缺失（旧后端）时按离线处理，不做本地推算，避免误标在线。
 */
export const resolveMemberOnline = (value: unknown): boolean =>
  isPlainObject(value) ? pickBooleanField(value, ['isOnline']) : false;

/** 会员状态归一：未知状态按正常处理，避免脏枚举把会员卡在异常态。 */
export const normalizeMemberStatus = (value: string): MemberStatus => {
  switch (value.toLowerCase()) {
    case 'active':
    case 'normal':
    case 'enabled':
      return 'active';
    case 'inactive':
    case 'sleep':
    case 'dormant':
      return 'inactive';
    case 'banned':
    case 'disabled':
    case 'blocked':
    case 'forbidden':
      return 'banned';
    default:
      return 'active';
  }
};

/** 会员等级归一：未知等级按免费处理。 */
export const normalizeMemberLevel = (value: string): MemberLevel => {
  switch (value.toLowerCase()) {
    case 'monthly':
    case 'month':
      return 'monthly';
    case 'quarterly':
    case 'quarter':
    case 'season':
      return 'quarterly';
    case 'annual':
    case 'yearly':
    case 'year':
      return 'annual';
    case 'lifetime':
    case 'forever':
    case 'permanent':
      return 'lifetime';
    case 'free':
    default:
      return 'free';
  }
};

/** 充值渠道归一：管理端设置等级落的两类订单（admin / gift）必须走专属分支，落到 default 会被误判为微信支付。 */
export const normalizeRechargeChannel = (value: string): RechargeRecord['channel'] => {
  switch (value.toLowerCase()) {
    case 'alipay':
    case 'ali':
      return 'alipay';
    case 'card':
    case 'giftcard':
    case 'gift_card':
      return 'card';
    case 'manual':
    case 'manual_set':
    case 'system':
      return 'manual';
    // 管理端设置会员等级落的两类订单：admin=计入收入，gift=赠送。
    // 必须走专属分支——落到 default 会被当成微信支付，详情页「设置记录」
    // 就会出现「¥赠送」「微信支付」这类自相矛盾的文案
    case 'admin':
    case 'admin_grant':
      return 'admin';
    case 'gift':
      return 'gift';
    case 'wechat':
    case 'wx':
    case 'wechatpay':
    default:
      return 'wechat';
  }
};

/** 积分流水来源归一。 */
export const normalizePointsSource = (value: string): MemberPointsSource => {
  switch (value.toLowerCase()) {
    case 'purchase_bonus':
    case 'purchasebonus':
    case 'purchase':
    case 'recharge_bonus':
      return 'purchase_bonus';
    case 'deduct_payment':
    case 'deductpayment':
    case 'payment_deduction':
    case 'consume':
      return 'deduct_payment';
    case 'expire':
    case 'expired':
      return 'expire';
    case 'admin_adjust':
    case 'adminadjust':
    case 'manual_adjust':
    default:
      return 'admin_adjust';
  }
};

/** 纯利豆流水来源归一。 */
export const normalizeBeanSource = (value: string): BeanRecord['source'] => {
  switch (value.toLowerCase()) {
    case 'promo_reward':
    case 'promoreward':
    case 'promotion_reward':
      return 'promo_reward';
    case 'deduct_payment':
    case 'deductpayment':
    case 'payment_deduction':
      return 'deduct_payment';
    case 'withdrawal':
    case 'withdraw':
      return 'withdrawal';
    case 'admin_adjust':
    case 'adminadjust':
    case 'manual_adjust':
    default:
      return 'admin_adjust';
  }
};
