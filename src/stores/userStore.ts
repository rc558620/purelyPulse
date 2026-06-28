import { create } from 'zustand';
import { devtools, persist, type PersistStorage } from 'zustand/middleware';
import { STORAGE_KEYS } from '@constants/storageKeys';
import type { UserContextType, UserInfo } from '@contexts/userContextDef';

/** 默认用户信息。 */
export const DEFAULT_USER_INFO: UserInfo = {
  id: '',
  name: '',
  phone: '',
  avatar: '',
  verified: false,
  storeName: '',
};

export interface UserStore extends UserContextType {
  /** 设置用户态初始化中标记。 */
  setIsInitializing: (isInitializing: boolean) => void;
}

type PersistedUserStore = Pick<UserStore, 'userInfo'>;

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null
);

const normalizeUserInfo = (value: unknown): UserInfo => {
  if (!isRecord(value)) {
    return DEFAULT_USER_INFO;
  }

  return {
    id: typeof value.id === 'string' ? value.id.trim() : DEFAULT_USER_INFO.id,
    name: typeof value.name === 'string' ? value.name.trim() : DEFAULT_USER_INFO.name,
    phone: typeof value.phone === 'string' ? value.phone.trim() : DEFAULT_USER_INFO.phone,
    avatar: typeof value.avatar === 'string' ? value.avatar.trim() : DEFAULT_USER_INFO.avatar,
    verified: typeof value.verified === 'boolean' ? value.verified : DEFAULT_USER_INFO.verified,
    storeName: typeof value.storeName === 'string' ? value.storeName.trim() : DEFAULT_USER_INFO.storeName,
  };
};

const isPersistedUserStore = (value: unknown): value is { state: PersistedUserStore; version?: number } => (
  isRecord(value) && isRecord(value.state) && isRecord(value.state.userInfo)
);

const hasPersistedAccessToken = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  const authFlag = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    ?? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  if (!authFlag) {
    return false;
  }

  // 前端过期校验：token 已过期则视为无认证
  const expiresRaw = sessionStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT)
    ?? localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
  if (expiresRaw) {
    const expiresAt = Number(expiresRaw);
    if (Number.isFinite(expiresAt) && Date.now() / 1000 > expiresAt) {
      sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
      return false;
    }
  }

  return true;
};

const userSessionStorage: PersistStorage<PersistedUserStore> = {
  getItem: (name) => {
    const raw = sessionStorage.getItem(name);
    if (!raw) {
      return null;
    }

    try {
      const parsed: unknown = JSON.parse(raw);

      if (isPersistedUserStore(parsed)) {
        return {
          ...parsed,
          state: {
            userInfo: normalizeUserInfo(parsed.state.userInfo),
          },
        };
      }

      return {
        state: {
          userInfo: normalizeUserInfo(parsed),
        },
        version: 0,
      };
    } catch {
      sessionStorage.removeItem(name);
      return null;
    }
  },
  setItem: (name, value) => {
    sessionStorage.setItem(name, JSON.stringify(value));
  },
  removeItem: (name) => {
    sessionStorage.removeItem(name);
  },
};

/** 读取会话缓存的用户信息，兼容旧 raw JSON 与 Zustand persist 包装结构。 */
export const readPersistedUserInfo = (): UserInfo => {
  if (typeof window === 'undefined') {
    return DEFAULT_USER_INFO;
  }

  /** 优先从已初始化的 store 读取，避免重复解析 sessionStorage 导致与 merge 逻辑不同步。 */
  const storeState = useUserStore.getState();
  if (storeState.userInfo.id || storeState.userInfo.name || storeState.userInfo.phone) {
    return storeState.userInfo;
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.USER_INFO);
    if (!raw) {
      return DEFAULT_USER_INFO;
    }

    const parsed: unknown = JSON.parse(raw);
    if (isPersistedUserStore(parsed)) {
      return normalizeUserInfo(parsed.state.userInfo);
    }

    return normalizeUserInfo(parsed);
  } catch {
    sessionStorage.removeItem(STORAGE_KEYS.USER_INFO);
    return DEFAULT_USER_INFO;
  }
};

/** 全局用户状态。会话级持久化到 sessionStorage。 */
export const useUserStore = create<UserStore>()(
  devtools(
    persist<UserStore, [], [], PersistedUserStore>(
      (set) => ({
        userInfo: DEFAULT_USER_INFO,
        isInitializing: hasPersistedAccessToken(),
        setAvatar: (avatar) => {
          set((state) => ({
            userInfo: { ...state.userInfo, avatar },
          }));
        },
        setName: (name) => {
          set((state) => ({
            userInfo: { ...state.userInfo, name },
          }));
        },
        setVerified: (verified) => {
          set((state) => ({
            userInfo: { ...state.userInfo, verified },
          }));
        },
        updateUserInfo: (info) => {
          set((state) => ({
            userInfo: normalizeUserInfo({
              ...state.userInfo,
              ...info,
            }),
          }));
        },
        clearUserInfo: () => {
          set({ userInfo: DEFAULT_USER_INFO, isInitializing: false });
          useUserStore.persist.clearStorage();
          sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          sessionStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
        },
        setIsInitializing: (isInitializing) => {
          set({ isInitializing });
        },
      }),
      {
        name: STORAGE_KEYS.USER_INFO,
        storage: userSessionStorage,
        partialize: (state) => ({ userInfo: state.userInfo }),
        merge: (persistedState, currentState) => ({
          ...currentState,
          userInfo: normalizeUserInfo(
            isRecord(persistedState) ? persistedState.userInfo : undefined,
          ),
        }),
      },
    ),
    { name: 'UserStore' },
  ),
);
