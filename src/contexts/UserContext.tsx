// 用户信息 Provider，保持旧 Context 接口，内部状态由 Zustand 管理。
import { useEffect, useMemo, type ReactNode } from 'react';
import { ApiError } from '@utils/http';
import { fetchAuthProfile } from '@pages/login/shared/auth.service';
import { clearAuthSession, getPersistedAccessToken, syncAuthProfileToSession } from '@pages/login/shared/authSession';
import { useUserStore } from '@stores';
import { UserContext } from './userContextDef';

interface UserProviderProps {
  children: ReactNode;
}

/** 用户信息 Provider。 */
export const UserProvider = ({ children }: UserProviderProps) => {
  const userInfo = useUserStore((s) => s.userInfo);
  const isInitializing = useUserStore((s) => s.isInitializing);
  const setAvatar = useUserStore((s) => s.setAvatar);
  const setName = useUserStore((s) => s.setName);
  const setVerified = useUserStore((s) => s.setVerified);
  const updateUserInfo = useUserStore((s) => s.updateUserInfo);
  const clearUserInfo = useUserStore((s) => s.clearUserInfo);

  const value = useMemo<UserContextType>(() => ({
    userInfo,
    isInitializing,
    setAvatar,
    setName,
    setVerified,
    updateUserInfo,
    clearUserInfo,
  }), [userInfo, isInitializing, setAvatar, setName, setVerified, updateUserInfo, clearUserInfo]);

  useEffect(() => {
    const accessToken = getPersistedAccessToken();
    const { setIsInitializing } = useUserStore.getState();

    if (!accessToken) {
      setIsInitializing(false);
      return;
    }

    let cancelled = false;
    setIsInitializing(true);

    /** 初始化超时兜底：防止网络异常导致用户永久白屏。 */
    const initTimeoutId = setTimeout(() => {
      if (!cancelled) {
        setIsInitializing(false);
      }
    }, 10_000);

    void (async () => {
      try {
        const profile = await fetchAuthProfile();
        if (cancelled) {
          return;
        }
        syncAuthProfileToSession(profile);
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof ApiError && (error.statusCode === 401 || error.statusCode === 403)) {
          clearAuthSession();
          return;
        }
      } finally {
        if (!cancelled) {
          clearTimeout(initTimeoutId);
          setIsInitializing(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(initTimeoutId);
    };
  }, []);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
