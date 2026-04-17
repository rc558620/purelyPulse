// 头像触发按钮：圆形头像展示区 + hover 编辑遮罩，纯渲染组件
import React from 'react';
import { cx } from '@utils/utils';
import { IconAvatarPlaceholder, IconAvatarEdit } from './AvatarUploaderIcons';
import styles from './AvatarTrigger.module.less';

interface AvatarTriggerProps {
    /** 当前头像 URL，空时显示猫咪占位图 */
    avatar?: string;
    /** 用户昵称，用于图片 alt 文案，默认"用户" */
    name?: string;
    /** 头像尺寸（rem），默认 10 */
    size?: number;
    /** 点击回调，触发文件选择 */
    onClick: () => void;
    /** 自定义类名 */
    className?: string;
}

/** 头像按钮：圆形区域 + 悬停编辑遮罩（纯渲染，无内部状态） */
const AvatarTrigger: React.FC<AvatarTriggerProps> = ({
    avatar,
    name = '用户',
    size = 10,
    onClick,
    className,
}) => (
    <button
        className={cx(styles.avatarBtn, className)}
        onClick={onClick}
        aria-label="点击更换头像"
        type="button"
        // size 为动态数值，无法通过 CSS class 表达，inline style 是唯一合规方案
        style={{ width: `${size}rem`, height: `${size}rem` }}
    >
        {avatar ? (
            <img src={avatar} alt={`${name}的头像`} className={styles.avatarImage} />
        ) : (
            <div className={styles.avatarPlaceholder}>
                <IconAvatarPlaceholder className={styles.placeholderIcon} />
            </div>
        )}

        {/* 编辑遮罩：hover 时淡入，aria-hidden 防止屏幕阅读器重复读取 */}
        <div className={styles.editOverlay} aria-hidden="true">
            <IconAvatarEdit />
        </div>
    </button>
);

export default AvatarTrigger;
