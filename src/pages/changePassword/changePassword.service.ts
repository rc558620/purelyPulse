// 修改密码接口服务：统一封装密码更新请求。
import { http, resolveEnvPath } from '@utils/http';
import type {
    ChangePasswordRequestDTO,
    ChangePasswordResponseDTO,
} from './changePassword.types';

const DEFAULT_CHANGE_PASSWORD_API_PATH = '/auth/change-password';

/**
 * 解析修改密码接口路径。
 * @returns purelyprofit-server `POST /auth/change-password` 的接口路径。
 */
export const resolveChangePasswordApiPath = (): string =>
    resolveEnvPath(import.meta.env.VITE_CHANGE_PASSWORD_API_PATH, DEFAULT_CHANGE_PASSWORD_API_PATH);

/**
 * 提交修改密码请求。
 * @param payload - 按 purelyprofit-server `POST /auth/change-password` 协议映射后的参数。
 */
export const changePassword = async (payload: ChangePasswordRequestDTO): Promise<void> => {
    await http.post<ChangePasswordResponseDTO, ChangePasswordRequestDTO>(
        resolveChangePasswordApiPath(),
        payload,
        {
            errorMessage: '修改密码失败，请稍后重试',
        },
    );
};
