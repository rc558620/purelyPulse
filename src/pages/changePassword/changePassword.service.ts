// 修改密码接口服务：统一封装密码更新请求。
import { http, resolveEnvPath } from '@utils/http';
import type {
    ChangePasswordRequestDTO,
    ChangePasswordResponseDTO,
} from './changePassword.types';
import { rsaEncrypt } from '@utils/rsaEncrypt';

const DEFAULT_CHANGE_PASSWORD_API_PATH = '/auth/change-password';

/**
 * 解析修改密码接口路径。
 * @returns purelyprofit-server `POST /auth/change-password` 的接口路径。
 */
export const resolveChangePasswordApiPath = (): string =>
    resolveEnvPath(import.meta.env.VITE_CHANGE_PASSWORD_API_PATH, DEFAULT_CHANGE_PASSWORD_API_PATH);

/**
 * 提交修改密码请求。
 * 密码字段 RSA 加密后提交。
 * @param payload - 按 purelyprofit-server `POST /auth/change-password` 协议映射后的参数。
 */
export const changePassword = async (payload: ChangePasswordRequestDTO): Promise<void> => {
    const encryptedPayload = {
        ...payload,
        currentPassword: await rsaEncrypt(payload.currentPassword),
        newPassword: await rsaEncrypt(payload.newPassword),
    };

    await http.post<ChangePasswordResponseDTO, typeof encryptedPayload>(
        resolveChangePasswordApiPath(),
        encryptedPayload,
        {
            errorMessage: '修改密码失败，请稍后重试',
        },
    );
};
