// 个人中心 Hero 区：头像上传 + 用户昵称 + 手机号
import React from 'react';
import AvatarUploader from '@components/business/AvatarUploader';
import { safeStr } from '@utils/utils';
import styles from './ProfileHero.module.less';

interface ProfileHeroProps {
    /** 头像 URL，空时显示默认占位头像 */
    avatar: string;
    /** 用户昵称 */
    userName: string;
    /** 手机号（脱敏） */
    userPhone: string;
    /** 头像变更回调 */
    onAvatarChange: (avatar: string) => void | Promise<void>;
}

/** 个人中心顶部信息区：头像 + 昵称 + 手机号 */
const ProfileHero: React.FC<ProfileHeroProps> = ({
    avatar,
    userName,
    userPhone,
    onAvatarChange,
}) => (
    <div className={styles.profileHero}>
        {/* 头像上传器 */}
        <AvatarUploader
            avatar={avatar}
            name={userName}
            onAvatarChange={onAvatarChange}
        />

        {/* 用户文字信息 */}
        <div className={styles.userMeta}>
            <h2 className={styles.userName}>{safeStr(userName, '未设置昵称')}</h2>
            <p className={styles.userPhone}>{safeStr(userPhone, '未绑定手机号')}</p>
        </div>
    </div>
);

export default ProfileHero;
