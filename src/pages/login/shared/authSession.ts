// 认证会话层：集中管理 accessToken、用户缓存与 Zustand 用户态同步。
import type { UserInfo } from '@contexts';
import { STORAGE_KEYS } from '@constants/storageKeys';
import { DEFAULT_USER_INFO, readPersistedUserInfo, useUserStore } from '@stores';

/** 返回空用户信息对象。 */
export const createEmptyUserInfo = (): UserInfo => ({ ...DEFAULT_USER_INFO });

/** 判断用户信息是否包含可展示内容。 */
export const hasUserInfoContent = (value: UserInfo): boolean => (
  Boolean(value.id || value.name || value.phone || value.avatar || value.storeName)
);

/** 读取 accessToken：优先 sessionStorage，降级 localStorage。 */
export const getPersistedAccessToken = (): string => (
  sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  ?? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  ?? ''
);

/** 持久化 accessToken，当前统一保存在 sessionStorage。 */
export const persistAccessToken = (accessToken: string): void => {
  const normalizedToken = accessToken.trim();
  sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, normalizedToken);
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  useUserStore.getState().setIsInitializing(Boolean(normalizedToken));
};

/** 清理 accessToken。 */
export const clearPersistedAccessToken = (): void => {
  sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
};

/** 从 sessionStorage 读取用户信息缓存。 */
export { readPersistedUserInfo };

/** 持久化用户信息。 */
export const persistUserInfo = (value: UserInfo): UserInfo => {
  useUserStore.getState().updateUserInfo(value);
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
