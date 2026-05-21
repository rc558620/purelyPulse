import { safeNum } from '@utils/utils';

export const DEFAULT_HTTP_TIMEOUT = 15000;
export const DEFAULT_HTTP_ERROR_MESSAGE = '请求失败，请稍后重试';
export const DEFAULT_UNAUTHORIZED_MESSAGE = '登录状态已失效，请重新登录';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export const resolveEnvPath = (value: string | undefined, fallbackPath: string): string => {
  const resolvedPath = value?.trim();
  return resolvedPath || fallbackPath;
};

const readPositiveNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return safeNum(Number.isFinite(parsed) && parsed > 0 ? parsed : fallback, fallback);
};

export const resolveApiBaseUrl = (): string => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  if (!baseUrl) {
    return '/api';
  }

  if (baseUrl === '/') {
    return '/';
  }

  return trimTrailingSlash(baseUrl);
};

export const HTTP_CONFIG = {
  baseURL: resolveApiBaseUrl(),
  timeout: readPositiveNumber(import.meta.env.VITE_API_TIMEOUT, DEFAULT_HTTP_TIMEOUT),
  successCodes: new Set<number | string>([0, 200, '0', '200']),
} as const;
