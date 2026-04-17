// 头像上传状态管理 hook：封装文件校验、FileReader 读取、裁剪弹窗生命周期
import { useRef, useState } from 'react';
import { showToast } from '@components/ui/feedback/Toast';
import { validateImageFile, readFileAsDataURL } from '@utils/imageValidation';

interface UseAvatarUploadOptions {
    /** 裁剪完成后的回调，参数为裁剪后的 blob URL */
    onAvatarChange: (url: string) => void;
}

interface UseAvatarUploadReturn {
    /** 隐藏文件 input 的 ref，绑定到 <input type="file" /> */
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    /** 是否显示裁剪弹窗 */
    cropVisible: boolean;
    /** 待裁剪的图片 DataURL */
    pendingCropSrc: string;
    /** 触发文件选择器打开 */
    openFilePicker: () => void;
    /** 文件 input onChange 处理函数 */
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    /** 裁剪确认回调 */
    handleCropConfirm: (croppedUrl: string) => void;
    /** 裁剪取消回调 */
    handleCropCancel: () => void;
}

/** 管理头像上传全流程：文件选择 → 校验 → DataURL 读取 → 裁剪弹窗 → 回调通知 */
const useAvatarUpload = ({ onAvatarChange }: UseAvatarUploadOptions): UseAvatarUploadReturn => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [cropVisible, setCropVisible] = useState(false);
    const [pendingCropSrc, setPendingCropSrc] = useState('');

    const openFilePicker = (): void => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0];
        // 清空 value，确保选择同一文件仍可再次触发 onChange
        e.target.value = '';
        if (!file) return;

        const validation = validateImageFile(file);
        if (!validation.ok) return;

        // FileReader 读取为 DataURL，成功后打开裁剪弹窗
        void readFileAsDataURL(file)
            .then((dataUrl) => {
                setPendingCropSrc(dataUrl);
                setCropVisible(true);
            })
            .catch(() => {
                showToast({ message: '图片读取失败，请重试', type: 'error' });
            });
    };

    const handleCropConfirm = (croppedUrl: string): void => {
        setCropVisible(false);
        setPendingCropSrc('');
        onAvatarChange(croppedUrl);
        showToast({ message: '头像更新成功', type: 'success' });
    };

    const handleCropCancel = (): void => {
        setCropVisible(false);
        setPendingCropSrc('');
    };

    return {
        fileInputRef,
        cropVisible,
        pendingCropSrc,
        openFilePicker,
        handleFileChange,
        handleCropConfirm,
        handleCropCancel,
    };
};

export default useAvatarUpload;
