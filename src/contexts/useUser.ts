// useUser Hook，优先读取旧 Context 注入值，否则回退到 Zustand 全局状态。
import { useContext } from 'react';
import { useUserStore } from '@stores';
import { UserContext } from './userContextDef';
import type { UserContextType } from './userContextDef';

/** 获取用户状态 Hook，兼容测试和历史 Context 包装。 */
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  const store = useUserStore();

  return context ?? store;
};
