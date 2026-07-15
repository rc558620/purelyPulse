// 个人中心接口服务：统一封装头像更新请求。
import { http, resolveEnvPath } from '@utils/http';
import type { UserInfo } from '@contexts';
import { fetchAuthProfile } from '@pages/login/shared/auth.service';
import { syncAuthProfileToSession } from '@pages/login/shared/authSession';

const DEFAULT_PROFILE_AVATAR_UPLOAD_API_PATH = '/auth/profile/avatar';
const DEFAULT_IMAGE_UPLOAD_API_PATH = '/upload/image';

/** 头像更新请求 DTO。 */
export interface UpdateProfileAvatarRequestDTO {
    /** 头像 URL 地址。 */
    avatar: string;
}

/** 头像更新响应：返回最新 profile，由 mapAuthProfile 映射为 UserInfo。 */
type UpdateProfileAvatarResponseDTO = unknown;

/** 图片上传响应。 */
interface UploadImageResponse {
    url: string;
    key: string;
}

/**
 * 解析头像更新接口路径。
 * @returns purelyprofit-server `PATCH /auth/profile/avatar` 的接口路径。
 */
export const resolveProfileAvatarUploadApiPath = (): string =>
    resolveEnvPath(
        import.meta.env.VITE_PROFILE_AVATAR_UPLOAD_API_PATH,
        DEFAULT_PROFILE_AVATAR_UPLOAD_API_PATH,
    );

/**
 * 解析图片上传接口路径。
 * @returns purelyprofit-server `POST /upload/image` 的接口路径。
 */
export const resolveImageUploadApiPath = (): string =>
    resolveEnvPath(
        import.meta.env.VITE_IMAGE_UPLOAD_API_PATH,
        DEFAULT_IMAGE_UPLOAD_API_PATH,
    );

/**
 * 将裁剪后的图片 blob 上传到 COS 对象存储。
 * @param imageUrl - 裁剪弹窗返回的本地 blob URL。
 * @returns COS 返回的文件访问 URL。
 */
export const uploadImageToCos = async (imageUrl: string): Promise<string> => {
    const response = await fetch(imageUrl);
    if (!response.ok) {
        throw new Error('头像文件读取失败，请重新选择');
    }

    const blob = await response.blob();
    const formData = new FormData();
    formData.append('file', blob, 'avatar.jpg');

    const uploadResult = await http.post<UploadImageResponse>(
        resolveImageUploadApiPath(),
        formData,
        {
            headers: { 'Content-Type': 'multipart/form-data' },
            errorMessage: '头像上传失败，请稍后重试',
        },
    );

    return uploadResult.url;
};

/**
 * 更新个人头像，并返回最新的 UserInfo。
 * @param payload - 按 purelyprofit-server `PATCH /auth/profile/avatar` 协议映射后的参数。
 * @returns 更新后的最新用户信息。
 */
export const uploadProfileAvatar = async (
    payload: UpdateProfileAvatarRequestDTO,
): Promise<UserInfo> => {
    await http.patch<UpdateProfileAvatarResponseDTO, UpdateProfileAvatarRequestDTO>(
        resolveProfileAvatarUploadApiPath(),
        payload,
        {
            errorMessage: '头像更新失败，请稍后重试',
        },
    );

    // 上传成功后刷新 profile，拿到后端最新数据（含新头像 URL）
    return fetchAuthProfile();
};

/**
 * 头像上传完整流程：blob URL → COS 上传 → 获取 URL → 更新头像 → 刷新 profile → 同步会话。
 * @param croppedImageUrl - 裁剪弹窗返回的 blob URL。
 * @param updateUserInfo - Zustand 更新回调。
 * @returns 更新后的最新用户信息。
 */
export const handleAvatarUpload = async (
    croppedImageUrl: string,
    updateUserInfo: (partial: Partial<UserInfo>) => void,
): Promise<UserInfo> => {
    try {
        // 1. 上传图片到 COS，获取 URL
        const avatarUrl = await uploadImageToCos(croppedImageUrl);
        // 2. 用 URL 更新头像
        const latestProfile = await uploadProfileAvatar({ avatar: avatarUrl });
        syncAuthProfileToSession(latestProfile);
        updateUserInfo(latestProfile);
        return latestProfile;
    } finally {
        if (croppedImageUrl.startsWith('blob:')) {
            URL.revokeObjectURL(croppedImageUrl);
        }
    }
};
