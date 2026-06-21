// 个人中心页面：展示用户信息、修改密码入口及退出登录
import React, { useCallback, useEffect } from 'react';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import PageHeader from '@components/ui/layout/PageHeader';
import MenuRow from '@components/ui/layout/MenuRow';
import SectionCard from '@components/ui/layout/SectionCard';
import { useUser } from '@/contexts';
import { fetchAuthProfile } from '@pages/login/shared/auth.service';
import { clearAuthSession, syncAuthProfileToSession } from '@pages/login/shared/authSession';
import { handleAvatarUpload } from './profile.service';
import { ROUTE_PATHS } from '@router/paths';
import ProfileHero from './components/ProfileHero/ProfileHero';
import LogoutSection from './components/LogoutSection/LogoutSection';
import { IconLock } from './components/ProfileIcons/ProfileIcons';
import styles from './profile.module.less';

/** 修改密码菜单项配置（静态常量，无需 useMemo） */
const CHANGE_PASSWORD_MENU = {
    id: 'change-password',
    label: '修改密码',
    description: '定期修改密码保护账户安全',
    icon: <IconLock />,
    path: ROUTE_PATHS.changePassword,
} as const;

/** 个人中心页面 */
const Profile: React.FC = () => {
    const navigate = useAnimatedNavigate();
    const { userInfo, updateUserInfo, clearUserInfo } = useUser();
    const { avatar, name: userName, phone: userPhone } = userInfo;

    // 进入页面时刷新一次 profile 数据
    useEffect(() => {
        let cancelled = false;

        const loadProfile = async (): Promise<void> => {
            try {
                const profile = await fetchAuthProfile();
                if (cancelled) {
                    return;
                }
                syncAuthProfileToSession(profile);
                updateUserInfo(profile);
            } catch {
                // 请求失败时保留本地会话缓存兜底展示
            }
        };

        void loadProfile();

        return () => {
            cancelled = true;
        };
    }, [updateUserInfo]);

    const handleAvatarChange = useCallback(
        async (croppedImageUrl: string): Promise<void> => {
            await handleAvatarUpload(croppedImageUrl, updateUserInfo);
        },
        [updateUserInfo],
    );

    const handleMenuClick = useCallback(() => {
        navigate(CHANGE_PASSWORD_MENU.path);
    }, [navigate]);

    // 退出登录：清空会话后跳回登录页
    const handleLogout = useCallback(() => {
        clearAuthSession();
        clearUserInfo();
        window.location.href = ROUTE_PATHS.login;
    }, [clearUserInfo]);

    return (
        <div className={styles.profileContainer}>
            {/* 页面顶部返回导航 */}
            <PageHeader variant="relative" />

            <main className={styles.contentWrapper}>
                {/* 用户信息 Hero 区域 */}
                <ProfileHero
                    avatar={avatar}
                    userName={userName}
                    userPhone={userPhone}
                    onAvatarChange={handleAvatarChange}
                />

                {/* 功能菜单列表 */}
                <div className={styles.menuList}>
                    <SectionCard noPadding>
                        <SectionCard.DividedList
                            items={[CHANGE_PASSWORD_MENU]}
                            renderItem={() => (
                                <MenuRow
                                    label={CHANGE_PASSWORD_MENU.label}
                                    description={CHANGE_PASSWORD_MENU.description}
                                    icon={CHANGE_PASSWORD_MENU.icon}
                                    onClick={handleMenuClick}
                                />
                            )}
                        />
                    </SectionCard>

                    {/* 退出登录区域 */}
                    <LogoutSection onLogout={handleLogout} />
                </div>
            </main>
        </div>
    );
};

export default Profile;
