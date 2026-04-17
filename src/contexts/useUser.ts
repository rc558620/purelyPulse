// useUser Hook，从 UserContext 获取用户信息。
import { useContext } from 'react';
import { UserContext } from './userContextDef';
import type { UserContextType } from './userContextDef';

/** 获取用户上下文 Hook，必须在 UserProvider 内使用 */
export const useUser = (): UserContextType => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser 必须在 UserProvider 内使用');
    }
    return context;
};
