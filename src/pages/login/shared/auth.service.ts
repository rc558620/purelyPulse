// 认证服务层：封装登录请求、当前用户信息拉取与响应字段映射。
import { ApiError, createSingletonInFlightRequest, http, resolveEnvPath } from '@utils/http';
import type { UserInfo } from '@contexts';

const LOGIN_API_PATH = resolveEnvPath(import.meta.env.VITE_LOGIN_API_PATH, '/auth/login');
const AUTH_PROFILE_API_PATH = resolveEnvPath(import.meta.env.VITE_AUTH_PROFILE_API_PATH, '/auth/me');

const TOKEN_FIELD_CANDIDATES = [
  'accessToken',
  'access_token',
  'token',
  'authToken',
  'authorization',
  'authorizationToken',
  'jwtToken',
] as const;

const USER_SOURCE_CANDIDATES = ['user', 'profile', 'currentUser', 'account'] as const;
const STORE_SOURCE_CANDIDATES = ['store', 'shop', 'merchant', 'storeInfo'] as const;
const USER_ID_CANDIDATES = ['id', 'userId', 'uid'] as const;
const USER_NAME_CANDIDATES = ['name', 'nickname', 'nickName', 'username', 'userName', 'realName'] as const;
const PHONE_CANDIDATES = ['phone', 'mobile', 'mobilePhone', 'phoneNumber', 'tel'] as const;
const AVATAR_CANDIDATES = ['avatar', 'avatarUrl', 'avatarURL', 'headImg', 'headImgUrl', 'headUrl'] as const;
const VERIFIED_CANDIDATES = ['verified', 'isVerified', 'realNameVerified', 'hasRealName'] as const;
const STORE_NAME_CANDIDATES = ['storeName', 'shopName', 'merchantName', 'name'] as const;

/** 登录表单提交 DTO。 */
export interface LoginSubmitDTO {
  /** 前端语义字段：手机号。 */
  phone: string;
  /** 登录密码。 */
  password: string;
}

/** 登录成功后提取出的鉴权结果。 */
export interface LoginSuccessResult {
  /** accessToken，统一交给会话层持久化。 */
  accessToken: string;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const getNestedRecord = (value: unknown, keys: readonly string[]): Record<string, unknown> | null => {
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

const pickStringField = (value: unknown, keys: readonly string[]): string => {
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

const pickBooleanField = (value: unknown, keys: readonly string[]): boolean => {
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

const maskPhone = (value: string): string => {
  const digits = value.replace(/\s+/g, '');
  if (!/^1\d{10}$/.test(digits)) {
    return digits;
  }
  return `${digits.slice(0, 3)}****${digits.slice(-4)}`;
};

const extractAccessToken = (payload: unknown): string => {
  const directToken = pickStringField(payload, TOKEN_FIELD_CANDIDATES);
  if (directToken) {
    return directToken;
  }

  const nestedSources = [
    getNestedRecord(payload, ['tokenInfo', 'tokenData', 'tokens']),
    getNestedRecord(payload, ['auth', 'session', 'data']),
  ];

  for (const source of nestedSources) {
    const nestedToken = pickStringField(source, TOKEN_FIELD_CANDIDATES);
    if (nestedToken) {
      return nestedToken;
    }
  }

  throw new ApiError('登录成功，但未获取到登录凭证');
};

const mapAuthProfile = (payload: unknown): UserInfo => {
  const userSource = getNestedRecord(payload, USER_SOURCE_CANDIDATES) ?? (isPlainObject(payload) ? payload : {});
  const storeSource = getNestedRecord(payload, STORE_SOURCE_CANDIDATES);

  return {
    id: pickStringField(userSource, USER_ID_CANDIDATES),
    name: pickStringField(userSource, USER_NAME_CANDIDATES),
    phone: maskPhone(pickStringField(userSource, PHONE_CANDIDATES)),
    avatar: pickStringField(userSource, AVATAR_CANDIDATES),
    verified: pickBooleanField(userSource, VERIFIED_CANDIDATES),
    storeName: pickStringField(storeSource, STORE_NAME_CANDIDATES),
  };
};

/** 账号密码登录，并提取统一 accessToken。 */
export const loginWithPassword = async (payload: LoginSubmitDTO): Promise<LoginSuccessResult> => {
  const response = await http.post<unknown, Record<string, string>>(
    LOGIN_API_PATH,
    {
      phone: payload.phone,
      account: payload.phone,
      password: payload.password,
    },
    {
      skipAuth: true,
      skipGlobalErrorHandler: true,
      errorMessage: '登录失败，请检查账号或密码',
    },
  );

  return {
    accessToken: extractAccessToken(response),
  };
};

const requestAuthProfile = async (): Promise<UserInfo> => {
  const response = await http.get<unknown>(AUTH_PROFILE_API_PATH, {
    errorMessage: '获取当前用户信息失败',
  });

  return mapAuthProfile(response);
};

/** 拉取当前登录用户信息，并做单请求去重。 */
export const fetchAuthProfile = createSingletonInFlightRequest(async (): Promise<UserInfo> => requestAuthProfile());
