// 用户 Context 实例与类型定义，纯数据层（不含 React 组件）。
import { createContext } from 'react';

/** 用户信息数据结构。 */
export interface UserInfo {
  /** 用户 id。 */
  id: string;
  /** 用户昵称。 */
  name: string;
  /** 手机号（脱敏）。 */
  phone: string;
  /** 头像 URL。 */
  avatar: string;
  /** 实名认证状态。 */
  verified: boolean;
  /** 当前门店名称。 */
  storeName: string;
}

/** 用户上下文能力。 */
export interface UserContextType {
  /** 当前用户信息。 */
  userInfo: UserInfo;
  /** 当前是否处于用户态初始化阶段。 */
  isInitializing: boolean;
  /** 更新用户头像。 */
  setAvatar: (avatar: string) => void;
  /** 更新用户昵称。 */
  setName: (name: string) => void;
  /** 更新实名认证状态。 */
  setVerified: (verified: boolean) => void;
  /** 批量更新用户信息。 */
  updateUserInfo: (info: Partial<UserInfo>) => void;
}

export const UserContext = createContext<UserContextType | null>(null);
