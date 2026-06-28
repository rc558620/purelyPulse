// 认证会话层：集中管理认证状态、用户缓存与 Zustand 用户态同步。
//
// 安全设计：
// - accessToken 由后端通过 HttpOnly + Secure + SameSite=Strict 的 Cookie 管理，
//   前端无法通过 JavaScript 读取，杜绝 XSS 窃取 token。
// - 前端仅维护认证标志（sessionStorage 布尔值）和 token 过期时间（用于提前感知过期）。
// - HTTP client 开启 withCredentials，浏览器自动携带 Cookie。
import type { UserInfo } from '@contexts';
import { STORAGE_KEYS } from '@constants/storageKeys';
import { DEFAULT_USER_INFO, readPersistedUserInfo, useUserStore } from '@stores';

/** 返回空用户信息对象。 */
export const createEmptyUserInfo = (): UserInfo => ({ ...DEFAULT_USER_INFO });

/** 判断用户信息是否包含可展示内容。 */
export const hasUserInfoContent = (value: UserInfo): boolean => (
  Boolean(value.id || value.name || value.phone || value.avatar || value.storeName)
);

/**
 * 判断当前是否处于已认证状态。
 *
 * 策略：
 * 1. 检查 sessionStorage 认证标志
 * 2. 检查 token 过期时间（如果已过期则视为未认证）
 */
export const isAuthenticated = (): boolean => {
  const authFlag = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  if (!authFlag) {
    return false;
  }

  // 前端过期校验：如果 token 已过期，清除认证状态
  const expiresAt = getTokenExpiresAt();
  if (expiresAt !== null && Date.now() / 1000 > expiresAt) {
    clearAuthFlag();
    return false;
  }

  return true;
};

/**
 * 获取 accessToken。
 *
 * 优先返回 sessionStorage 中存储的真实 JWT token，
 * 供 HTTP client 通过 Authorization header 发送。
 * 若未存储真实 token，则返回空字符串（未认证）。
 */
export const getPersistedAccessToken = (): string => {
  if (!isAuthenticated()) {
    return '';
  }

  return sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ?? '';
};

/** 持久化 accessToken 到 sessionStorage，供后续请求通过 Authorization header 发送。 */
export const persistAccessToken = (accessToken: string): void => {
  sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken || '1');
  useUserStore.getState().setIsInitializing(true);
};

/** 清除认证标志。 */
export const clearPersistedAccessToken = (): void => {
  sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
};

/** 获取 token 过期时间戳（秒），未设置则返回 null。 */
export const getTokenExpiresAt = (): number | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = sessionStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT)
    ?? localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);

  if (!raw) {
    return null;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

/**
 * 保存 token 过期时间戳。
 *
 * 优先从 JWT payload 的 exp 字段解析；如无法解析，则根据当前时间 + 默认有效期推算。
 * @param expiresAt 秒级时间戳
 */
export const persistTokenExpiresAt = (expiresAt: number): void => {
  sessionStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, String(expiresAt));
  localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
};

/**
 * 从 JWT token 中解析过期时间（exp 字段）。
 *
 * 不验证签名（前端无法验证），仅用于提前感知过期，
 * 真正的鉴权由后端完成。
 */
export const parseJwtExp = (token: string): number | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));
    const exp = payload?.exp;

    return typeof exp === 'number' && exp > 0 ? exp : null;
  } catch {
    return null;
  }
};

/**
 * 标记认证成功并保存过期时间。
 *
 * @param accessToken JWT token（用于解析 exp）或空字符串
 * @param fallbackTtlSeconds 默认有效期（秒），无法解析 exp 时使用，默认 2 小时
 */
export const markAuthenticated = (accessToken?: string, fallbackTtlSeconds = 7200): void => {
  const exp = accessToken ? parseJwtExp(accessToken) : null;
  const expiresAt = exp ?? (Math.floor(Date.now() / 1000) + fallbackTtlSeconds);

  persistAccessToken(accessToken ?? 'authenticated');
  persistTokenExpiresAt(expiresAt);
};

/** 清除认证标志的简写。 */
const clearAuthFlag = clearPersistedAccessToken;

/** 从 sessionStorage 读取用户信息缓存。 */
export { readPersistedUserInfo };

/** 持久化用户信息，返回规范化后的用户数据。 */
export const persistUserInfo = (value: UserInfo): UserInfo => {
  const normalized = { ...DEFAULT_USER_INFO, ...value };
  useUserStore.getState().updateUserInfo(normalized);
  return useUserStore.getState().userInfo;
};

/** 清理用户信息缓存。 */
export const clearPersistedUserInfo = (): void => {
  useUserStore.getState().clearUserInfo();
};

/** 把 profile 同步到会话层，并返回规范化后的用户信息。 */
export const syncAuthProfileToSession = (value: UserInfo): UserInfo => persistUserInfo(value);

/** 清空当前认证会话。 */
export const clearAuthSession = (): void => {
  clearPersistedAccessToken();
  clearPersistedUserInfo();
  useUserStore.getState().setIsInitializing(false);
};
