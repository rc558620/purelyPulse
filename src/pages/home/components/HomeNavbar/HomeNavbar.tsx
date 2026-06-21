// 首页顶部导航栏：展示门店图标、门店名称、通知及设置入口与用户头像
import { memo } from 'react';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import { ROUTE_PATHS } from '@router/paths';
import { useUser } from '@/contexts';
import { IconAvatarPlaceholder } from '@components/business/AvatarUploader/AvatarUploaderIcons';
import styles from './HomeNavbar.module.less';
import notificationsIcon from '@assets/image/Home/notifications.svg';
import settingsIcon from '@assets/image/Home/settings.svg';
import icSavings from '@assets/image/Additional/savings.svg';

const HomeNavbar: React.FC = memo(() => {
    const navigate = useAnimatedNavigate();
    const { userInfo } = useUser();
    const { avatar, storeName } = userInfo;

    return (
        <header className={styles.header}>
            <div className={styles.logoSection}>
                <div className={styles.logoIcon}>
                    <img src={icSavings} alt="门店图标" className={styles.storeFallbackIcon} />
                </div>
                <h1 className={styles.appTitle}>{storeName || 'PurelyPulse'}</h1>
            </div>
            <div className={styles.actionSection}>
                <button className={styles.iconButton} aria-label="通知">
                    <img src={notificationsIcon} alt="Notifications" className={styles.iconImage} />
                </button>
                <button
                    className={styles.iconButton}
                    onClick={() => navigate(ROUTE_PATHS.profile)}
                    aria-label="个人中心"
                >
                    <img src={settingsIcon} alt="Settings" className={styles.iconImage} />
                </button>
                <div className={styles.userAvatar}>
                    {avatar ? (
                        <img alt="用户头像" src={avatar} />
                    ) : (
                        <div className={styles.avatarPlaceholderIconDiv}>
                            <IconAvatarPlaceholder className={styles.avatarPlaceholderIcon} />
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
});

HomeNavbar.displayName = 'HomeNavbar';

export default HomeNavbar;
