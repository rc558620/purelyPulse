// 头像上传组件：整合文件选择、格式/大小校验、圆形裁剪的完整头像上传流程
import React from 'react';
import { cx } from '@utils/utils';
import ImageCropModal from '@components/overlay/ImageCropModal';
import AvatarTrigger from './AvatarTrigger';
import useAvatarUpload from './useAvatarUpload';
import styles from './AvatarUploader.module.less';

export interface AvatarUploaderProps {
    /** 当前头像 URL（base64 DataURL 或外部 URL），空时显示默认猫咪占位图 */
    avatar?: string;
    /** 用户昵称，用于 alt 文案，默认"用户" */
    name?: string;
    /** 头像变更回调，参数为裁剪后的 blob URL。 */
    onAvatarChange: (url: string) => void | Promise<void>;
    /** 自定义类名 */
    className?: string;
    /** 头像尺寸（rem），默认 10 */
    size?: number;
}

/** 头像上传组件：点击选图 → 格式/大小校验 → 圆形裁剪 → 回调通知 */
const AvatarUploader: React.FC<AvatarUploaderProps> = ({
    avatar,
    name,
    onAvatarChange,
    className,
    size,
}) => {
    const {
        fileInputRef,
        cropVisible,
        pendingCropSrc,
        openFilePicker,
        handleFileChange,
        handleCropConfirm,
        handleCropCancel,
    } = useAvatarUpload({ onAvatarChange });

    return (
        <div className={cx(styles.avatarUploader, className)}>
            {/* 圆形头像触发按钮 */}
            <AvatarTrigger
                avatar={avatar}
                name={name}
                size={size}
                onClick={openFilePicker}
            />

            {/* 隐藏文件 input，由 AvatarTrigger 点击后触发 */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                aria-hidden="true"
            />

            {/* 圆形裁剪弹窗 */}
            <ImageCropModal
                visible={cropVisible}
                imageSrc={pendingCropSrc}
                onCancel={handleCropCancel}
                onConfirm={handleCropConfirm}
                aspect={1}
                cropShape="round"
                title="裁剪头像"
            />
        </div>
    );
};

export default AvatarUploader;
