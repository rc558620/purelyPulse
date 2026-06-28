/**
 * CSRF Token 管理。
 *
 * 流程：
 * 1. 登录成功后从后端响应（Set-Cookie 或响应体）获取 CSRF Token
 * 2. 存入 sessionStorage，前端每次写操作请求时通过 X-CSRF-Token 头携带
 * 3. 后端校验 Cookie 中的 CSRF 值与 Header 中的值是否一致（Double Submit Cookie 模式）
 *
 * 注意：后端需同步实现 CSRF 校验逻辑，此模块仅负责前端的 Token 存取。
 */
import { STORAGE_KEYS } from '@constants/storageKeys';

/** 从 sessionStorage 读取 CSRF Token。 */
export const getCsrfToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return sessionStorage.getItem(STORAGE_KEYS.CSRF_TOKEN);
};

/** 持久化 CSRF Token 到 sessionStorage。 */
export const persistCsrfToken = (token: string): void => {
  const normalized = token.trim();
  if (!normalized) {
    return;
  }

  sessionStorage.setItem(STORAGE_KEYS.CSRF_TOKEN, normalized);
};

/** 清除 CSRF Token。 */
export const clearCsrfToken = (): void => {
  sessionStorage.removeItem(STORAGE_KEYS.CSRF_TOKEN);
};

/**
 * 从响应中提取 CSRF Token。
 *
 * 支持从以下位置获取：
 * - 响应头 X-CSRF-Token
 * - 响应体中的 csrfToken / csrf_token / _csrf 字段
 */
export const extractCsrfTokenFromResponse = (response: unknown): string | null => {
  // 从 Axios 响应头中提取
  if (response && typeof response === 'object' && 'headers' in response) {
    const headers = (response as { headers: Record<string, unknown> }).headers;
    const headerToken = headers['x-csrf-token'];
    if (typeof headerToken === 'string' && headerToken.trim()) {
      return headerToken.trim();
    }
  }

  // 从响应体中提取
  if (response && typeof response === 'object' && 'data' in response) {
    const data = (response as { data: unknown }).data;
    if (data && typeof data === 'object') {
      const record = data as Record<string, unknown>;
      for (const key of ['csrfToken', 'csrf_token', '_csrf'] as const) {
        const value = record[key];
        if (typeof value === 'string' && value.trim()) {
          return value.trim();
        }
      }
    }
  }

  return null;
};
