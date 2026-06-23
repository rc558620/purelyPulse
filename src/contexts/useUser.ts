// useUser Hook，直接从 Zustand 全局状态获取用户信息。
// 不再通过 Context 回退，避免 Provider 外使用时数据源不一致。
import { useUserStore } from '@stores';
import type { UserContextType } from './userContextDef';

/** 获取用户状态 Hook，统一从 Zustand store 读取。 */
export const useUser = (): UserContextType => useUserStore();
