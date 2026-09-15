// 会员详情请求 hook：负责详情拉取、竞态保护、错误态与跨页状态同步。
import { useCallback, useEffect, useRef, useState } from 'react';
import { MEMBER_STATUS_SYNC_EVENT } from '../../memberList/memberList.constants';
import { fetchMemberDetail } from '../../memberList/memberList.service';
import type {
  MemberDetail,
  MemberStatusSyncPayload,
} from '../../memberList/memberList.types';

export interface UseMemberDetailRequestReturn {
  /** 当前会员详情。 */
  member: MemberDetail | null;
  /** 是否为首屏加载中。 */
  isLoading: boolean;
  /** 是否是接口未返回详情。 */
  isNotFound: boolean;
  /** 当前错误文案。 */
  errorMessage: string;
  /** 拉取会员详情，silent 时不切换首屏加载态。 */
  loadMember: (options?: { silent?: boolean }) => Promise<void>;
  /** 局部同步会员字段，用于封禁 / 解封 / 注销等操作的乐观更新。 */
  patchMember: (updater: (prev: MemberDetail) => MemberDetail) => void;
  /** 重试拉取详情。 */
  retryLoadMember: () => void;
}

/** 会员详情请求状态 hook。 */
export const useMemberDetailRequest = (
  memberId: string | undefined,
): UseMemberDetailRequestReturn => {
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const requestIdRef = useRef<number>(0);

  const loadMember = useCallback(async (options?: { silent?: boolean }): Promise<void> => {
    const normalizedMemberId = memberId?.trim() ?? '';
    if (!normalizedMemberId) {
      setMember(null);
      setIsNotFound(true);
      setErrorMessage('');
      setIsLoading(false);
      return;
    }

    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;
    const isSilent = options?.silent ?? false;

    if (!isSilent) {
      setIsLoading(true);
    }
    setIsNotFound(false);

    try {
      const response = await fetchMemberDetail(normalizedMemberId);
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      if (!response) {
        if (isSilent) {
          return;
        }

        setMember(null);
        setIsNotFound(true);
        setErrorMessage('');
        return;
      }

      setMember(response);
      setErrorMessage('');
      setIsNotFound(false);
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      if (isSilent) {
        return;
      }

      setMember(null);
      setErrorMessage(error instanceof Error ? error.message : '获取会员详情失败');
      setIsNotFound(false);
    } finally {
      if (currentRequestId === requestIdRef.current && !isSilent) {
        setIsLoading(false);
      }
    }
  }, [memberId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 数据加载的惯用模式，与项目其他 hook 保持一致
    void loadMember();
  }, [loadMember]);

  useEffect(() => {
    const handleStatusSync = (event: Event): void => {
      const customEvent = event as CustomEvent<MemberStatusSyncPayload>;
      const payload = customEvent.detail;
      if (!payload || payload.memberId !== memberId) {
        return;
      }

      setMember((prev) => {
        if (!prev) {
          return prev;
        }

        return {
          ...prev,
          status: payload.status,
          remark: payload.remark,
        };
      });
      void loadMember({ silent: true });
    };

    window.addEventListener(MEMBER_STATUS_SYNC_EVENT, handleStatusSync);
    return () => {
      window.removeEventListener(MEMBER_STATUS_SYNC_EVENT, handleStatusSync);
    };
  }, [loadMember, memberId]);

  const patchMember = useCallback((updater: (prev: MemberDetail) => MemberDetail): void => {
    setMember((prev) => (prev ? updater(prev) : prev));
  }, []);

  const retryLoadMember = useCallback((): void => {
    void loadMember();
  }, [loadMember]);

  return {
    member,
    isLoading,
    isNotFound,
    errorMessage,
    loadMember,
    patchMember,
    retryLoadMember,
  };
};
