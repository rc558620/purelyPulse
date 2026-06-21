// 个人中心接口服务：统一封装头像更新请求。
import { http, resolveEnvPath } from '@utils/http';
import type { UserInfo } from '@contexts';
import { fetchAuthProfile } from '@pages/login/shared/auth.service';
import { syncAuthProfileToSession } from '@pages/login/shared/authSession';

const DEFAULT_PROFILE_AVATAR_UPLOAD_API_PATH = '/auth/profile/avatar';

/** 头像更新请求 DTO。 */
export interface UpdateProfileAvatarRequestDTO {
    /** 头像地址或 base64 数据。 */
    avatar: string;
}

/** 头像更新响应：返回最新 profile，由 mapAuthProfile 映射为 UserInfo。 */
type UpdateProfileAvatarResponseDTO = unknown;

/**
 * 解析头像更新接口路径。
 * @returns purelyprofit-server `PATCH /auth/profile/avatar` 的接口路径。
 */
export const resolveProfileAvatarUploadApiPath = (): string =>
    resolveEnvPath(
        import.meta.env.VITE_PROFILE_AVATAR_UPLOAD_API_PATH,
        DEFAULT_PROFILE_AVATAR_UPLOAD_API_PATH,
    );

const readBlobAsDataUrl = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
        if (typeof reader.result === 'string') {
            resolve(reader.result);
            return;
        }
        reject(new Error('头像文件读取失败，请重新选择'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('头像文件读取失败，请重新选择'));
    reader.readAsDataURL(blob);
});

/**
 * 将裁剪后的本地 blob URL 转成后端需要的 base64 数据。
 * @param imageUrl - 裁剪弹窗返回的本地图片地址。
 * @returns 可直接提交给 purelyprofit-server `PATCH /auth/profile/avatar` 的请求体。
 */
export const createProfileAvatarPayload = async (imageUrl: string): Promise<UpdateProfileAvatarRequestDTO> => {
    const response = await fetch(imageUrl);
    if (!response.ok) {
        throw new Error('头像文件读取失败，请重新选择');
    }

    const avatar = await readBlobAsDataUrl(await response.blob());
    return { avatar };
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
            errorMessage: '头像上传失败，请稍后重试',
        },
    );

    // 上传成功后刷新 profile，拿到后端最新数据（含新头像 URL）
    return fetchAuthProfile();
};

/**
 * 头像上传完整流程：blob URL → base64 payload → 上传 → 刷新 profile → 同步会话。
 * @param croppedImageUrl - 裁剪弹窗返回的 blob URL。
 * @param updateUserInfo - Zustand 更新回调。
 * @returns 更新后的最新用户信息。
 */
export const handleAvatarUpload = async (
    croppedImageUrl: string,
    updateUserInfo: (partial: Partial<UserInfo>) => void,
): Promise<UserInfo> => {
    try {
        const payload = await createProfileAvatarPayload(croppedImageUrl);
        const latestProfile = await uploadProfileAvatar(payload);
        syncAuthProfileToSession(latestProfile);
        updateUserInfo(latestProfile);
        return latestProfile;
    } finally {
        if (croppedImageUrl.startsWith('blob:')) {
            URL.revokeObjectURL(croppedImageUrl);
        }
    }
};
