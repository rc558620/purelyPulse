// 修改昵称接口服务：封装昵称更新请求。
import { http, resolveEnvPath } from '@utils/http';
import type { UserInfo } from '@contexts';
import type { ChangeNicknameRequestDTO } from './changeNickname.types';

const DEFAULT_CHANGE_NICKNAME_API_PATH = '/auth/profile/name';

/**
 * 解析修改昵称接口路径。
 * @returns purelyprofit-server `PATCH /auth/profile/name` 的接口路径。
 */
export const resolveChangeNicknameApiPath = (): string =>
    resolveEnvPath(
        import.meta.env.VITE_CHANGE_NICKNAME_API_PATH,
        DEFAULT_CHANGE_NICKNAME_API_PATH,
    );

/**
 * 修改用户昵称。
 * @param payload - 按 purelyprofit-server `PATCH /auth/profile/name` 协议映射后的参数。
 * @returns 更新后的最新用户信息。
 */
export const changeNickname = async (
    payload: ChangeNicknameRequestDTO,
): Promise<UserInfo> => http.patch<UserInfo, ChangeNicknameRequestDTO>(
    resolveChangeNicknameApiPath(),
    payload,
    {
        errorMessage: '昵称修改失败，请稍后重试',
    },
);
