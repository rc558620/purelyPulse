// 用户信息 Provider，保持旧 Context 接口，内部状态由 Zustand 管理。
import { useEffect, type ReactNode } from 'react';
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
  const value = useUserStore();

  useEffect(() => {
    const accessToken = getPersistedAccessToken();
    const { setIsInitializing } = useUserStore.getState();

    if (!accessToken) {
      setIsInitializing(false);
      return;
    }

    let cancelled = false;
    setIsInitializing(true);

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
          setIsInitializing(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
