// 用户信息 Provider，支持 sessionStorage 会话级持久化。
import React, { useState, useEffect, type ReactNode } from 'react';
import { UserContext } from './userContextDef';
import type { UserInfo, UserContextType } from './userContextDef';

/** sessionStorage 存储键 */
const STORAGE_KEY = 'purely_profit_user_info';

/** 默认用户信息 */
const DEFAULT_USER_INFO: UserInfo = {
    name: '张三',
    phone: '138****8888',
    avatar: '',
    verified: false,
};

/** 从 sessionStorage 读取用户信息 */
const loadUserInfo = (): UserInfo => {
    try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return { ...DEFAULT_USER_INFO, ...parsed };
        }
    } catch (error) {
        console.warn('加载用户信息失败:', error);
    }
    return DEFAULT_USER_INFO;
};

/** 保存用户信息到 sessionStorage */
const saveUserInfo = (info: UserInfo): void => {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(info));
    } catch (error) {
        console.warn('保存用户信息失败:', error);
    }
};

/** 用户信息 Provider */
export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [userInfo, setUserInfo] = useState<UserInfo>(loadUserInfo);

    /** 每次 userInfo 更新时自动持久化 */
    useEffect(() => {
        saveUserInfo(userInfo);
    }, [userInfo]);

    /** 更新头像 */
    const setAvatar = (avatar: string): void => {
        setUserInfo(prev => ({ ...prev, avatar }));
    };

    /** 更新昵称 */
    const setName = (name: string): void => {
        setUserInfo(prev => ({ ...prev, name }));
    };

    /** 更新实名认证状态 */
    const setVerified = (verified: boolean): void => {
        setUserInfo(prev => ({ ...prev, verified }));
    };

    /** 批量更新 */
    const updateUserInfo = (info: Partial<UserInfo>): void => {
        setUserInfo(prev => ({ ...prev, ...info }));
    };

    const value: UserContextType = {
        userInfo,
        setAvatar,
        setName,
        setVerified,
        updateUserInfo,
    };

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
