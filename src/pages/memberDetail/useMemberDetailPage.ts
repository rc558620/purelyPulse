// 会员详情页 Hook：管理详情请求、提交动作与本地展示态同步。
import { useCallback, useEffect, useRef, useState } from 'react';
import { safeNum } from '@utils/utils';
import { showToast } from '@components/ui/feedback/Toast';
import { MEMBERSHIP_TIER_DEFAULT_VALUES } from '../membershipSettings/membershipSettings.constants';
import { fetchMembershipSettings } from '../membershipSettings/membershipSettings.service';
import { MEMBER_STATUS_SYNC_EVENT } from '../memberList/memberList.constants';
import {
  emitMemberStatusSync,
  fetchMemberDetail,
  submitMemberBan,
  submitMemberBeansAdjustment,
  submitMemberMembership,
  submitMemberPointsAdjustment,
  submitMemberUnban,
  submitSubAccountQuota,
} from '../memberList/memberList.service';
import type {
  MemberDetail,
  MemberLevel,
  MemberStatusSyncPayload,
} from '../memberList/memberList.types';

interface UseMemberDetailPageReturn {
  /** 当前会员详情。 */
  member: MemberDetail | null;
  /** 是否为首屏加载中。 */
  isLoading: boolean;
  /** 是否是接口未返回详情。 */
  isNotFound: boolean;
  /** 当前错误文案。 */
  errorMessage: string;
  /** 当前积分。 */
  points: number;
  /** 当前纯利豆。 */
  beans: number;
  /** 当前会员等级。 */
  memberLevel: MemberLevel;
  /** 当前会员到期时间。 */
  memberExpiry: number | null | undefined;
  /** 永久会员当前有效天数配置。 */
  lifetimeMembershipDays: number;
  /** 永久会员当前价格配置，单位分。 */
  lifetimeMembershipAmountFen: number;
  /** 是否正在提交积分调整。 */
  isSubmittingPoints: boolean;
  /** 是否正在提交纯利豆调整。 */
  isSubmittingBeans: boolean;
  /** 是否正在提交会员等级设置。 */
  isSubmittingMembership: boolean;
  /** 是否正在提交封禁或解封。 */
  isSubmittingBan: boolean;
  /** 是否正在提交子账号配额设置。 */
  isSubmittingSubAccount: boolean;
  /** 是否有任一提交动作进行中。 */
  isSubmittingAction: boolean;
  /** 调整积分并提交。 */
  handleAdjustPoints: (delta: number, reason: string) => Promise<void>;
  /** 调整纯利豆并提交。 */
  handleAdjustBeans: (delta: number, reason: string) => Promise<void>;
  /** 设置会员等级并提交。 */
  handleSetMembership: (newLevel: MemberLevel, newExpiry: number | null, options?: { amountFen?: number }) => Promise<void>;
  /** 封禁当前会员。 */
  handleBanMember: (reason: string) => Promise<boolean>;
  /** 解封当前会员。 */
  handleUnbanMember: () => Promise<boolean>;
  /** 设置子账号配额并提交（平台侧）。角色分配由商家在 purelyProfit 端操作。 */
  handleSetSubAccountQuota: (quota: number) => Promise<boolean>;
  /** 重试拉取详情。 */
  retryLoadMember: () => void;
}

type MemberSubmitAction = 'points' | 'beans' | 'membership' | 'ban' | 'subAccount' | null;

const DEFAULT_LIFETIME_MEMBERSHIP_DAYS = Number.parseInt(MEMBERSHIP_TIER_DEFAULT_VALUES.lifetime.lifetimeDays ?? '730', 10);
const DEFAULT_LIFETIME_MEMBERSHIP_AMOUNT_FEN = Math.round(Number(MEMBERSHIP_TIER_DEFAULT_VALUES.lifetime.price) * 100);

const normalizeLifetimeMembershipDays = (value: string | undefined): number => {
  const parsedValue = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return DEFAULT_LIFETIME_MEMBERSHIP_DAYS;
  }

  return parsedValue;
};

const normalizeLifetimeMembershipAmountFen = (value: string): number => {
  const parsedValue = Number.parseFloat(value);
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return DEFAULT_LIFETIME_MEMBERSHIP_AMOUNT_FEN;
  }

  return Math.round(parsedValue * 100);
};

/** 会员详情页数据 Hook。 */
export const useMemberDetailPage = (memberId: string | undefined): UseMemberDetailPageReturn => {
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState<MemberSubmitAction>(null);
  const [lifetimeMembershipDays, setLifetimeMembershipDays] = useState<number>(DEFAULT_LIFETIME_MEMBERSHIP_DAYS);
  const [lifetimeMembershipAmountFen, setLifetimeMembershipAmountFen] = useState<number>(DEFAULT_LIFETIME_MEMBERSHIP_AMOUNT_FEN);

  // 从 member 直接派生展示态，避免 useEffect 同步 setState 产生的级联渲染
  const points = member?.availablePoints ?? 0;
  const beans = member?.beanBalance ?? 0;
  const memberLevel: MemberLevel = member?.level ?? 'free';
  const memberExpiry: number | null | undefined = member ? member.membershipExpiry : undefined;

  const requestIdRef = useRef<number>(0);
  const membershipSettingsRequestIdRef = useRef<number>(0);

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
    const loadMembershipSettings = async (): Promise<void> => {
      membershipSettingsRequestIdRef.current += 1;
      const currentRequestId = membershipSettingsRequestIdRef.current;

      try {
        const response = await fetchMembershipSettings();
        if (currentRequestId !== membershipSettingsRequestIdRef.current) {
          return;
        }

        setLifetimeMembershipDays(normalizeLifetimeMembershipDays(response.lifetime.lifetimeDays));
        setLifetimeMembershipAmountFen(normalizeLifetimeMembershipAmountFen(response.lifetime.price));
      } catch {
        if (currentRequestId !== membershipSettingsRequestIdRef.current) {
          return;
        }

        setLifetimeMembershipDays(DEFAULT_LIFETIME_MEMBERSHIP_DAYS);
        setLifetimeMembershipAmountFen(DEFAULT_LIFETIME_MEMBERSHIP_AMOUNT_FEN);
      }
    };

    void loadMembershipSettings();
  }, []);

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

  const handleAdjustPoints = useCallback(async (delta: number, reason: string): Promise<void> => {
    if (!member || submittingAction) {
      return;
    }

    setSubmittingAction('points');
    try {
      await submitMemberPointsAdjustment(member.id, delta, reason);
      showToast({ type: 'success', message: delta >= 0 ? '积分调整成功' : '积分扣减成功' });
      void loadMember({ silent: true });
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : '积分调整失败，请稍后重试',
      });
    } finally {
      setSubmittingAction(null);
    }
  }, [loadMember, member, submittingAction]);

  const handleAdjustBeans = useCallback(async (delta: number, reason: string): Promise<void> => {
    if (!member || submittingAction) {
      return;
    }

    setSubmittingAction('beans');
    try {
      await submitMemberBeansAdjustment(member.id, delta, reason);
      showToast({ type: 'success', message: delta >= 0 ? '纯利豆调整成功' : '纯利豆扣减成功' });
      void loadMember({ silent: true });
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : '纯利豆调整失败，请稍后重试',
      });
    } finally {
      setSubmittingAction(null);
    }
  }, [loadMember, member, submittingAction]);

  const handleSetMembership = useCallback(async (
    newLevel: MemberLevel,
    newExpiry: number | null,
    options?: { amountFen?: number },
  ): Promise<void> => {
    if (!member || submittingAction) {
      return;
    }

    setSubmittingAction('membership');
    try {
      await submitMemberMembership(member.id, newLevel, newExpiry, {
        memberName: member.name,
        amountFen: options?.amountFen,
      });
      showToast({ type: 'success', message: '会员等级设置成功' });
      void loadMember({ silent: true });
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : '会员等级设置失败，请稍后重试',
      });
    } finally {
      setSubmittingAction(null);
    }
  }, [loadMember, member, submittingAction]);

  const handleBanMember = useCallback(async (reason: string): Promise<boolean> => {
    if (!member || submittingAction) {
      return false;
    }

    const normalizedReason = reason.trim();
    if (!normalizedReason) {
      showToast({ type: 'error', message: '请选择或填写封禁原因' });
      return false;
    }

    setSubmittingAction('ban');
    try {
      await submitMemberBan(member.id, normalizedReason);
      setMember((prev) => (prev ? { ...prev, status: 'banned', remark: normalizedReason } : prev));
      emitMemberStatusSync({ memberId: member.id, status: 'banned', remark: normalizedReason });
      showToast({ type: 'success', message: '会员已封禁' });
      void loadMember({ silent: true });
      return true;
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : '封禁会员失败，请稍后重试',
      });
      return false;
    } finally {
      setSubmittingAction(null);
    }
  }, [loadMember, member, submittingAction]);

  const handleUnbanMember = useCallback(async (): Promise<boolean> => {
    if (!member || submittingAction) {
      return false;
    }

    setSubmittingAction('ban');
    try {
      await submitMemberUnban(member.id);
      setMember((prev) => (prev ? { ...prev, status: 'active', remark: undefined } : prev));
      emitMemberStatusSync({ memberId: member.id, status: 'active', remark: undefined });
      showToast({ type: 'success', message: '会员已解封' });
      void loadMember({ silent: true });
      return true;
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : '解封会员失败，请稍后重试',
      });
      return false;
    } finally {
      setSubmittingAction(null);
    }
  }, [loadMember, member, submittingAction]);

  const handleSetSubAccountQuota = useCallback(async (
    quota: number,
  ): Promise<boolean> => {
    if (!member || submittingAction) {
      return false;
    }

    setSubmittingAction('subAccount');
    try {
      await submitSubAccountQuota(member.id, quota);
      showToast({ type: 'success', message: quota > 0 ? `子账号配额已更新，共 ${safeNum(quota)} 个槽位` : '子账号能力已关闭' });
      void loadMember({ silent: true });
      return true;
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : '子账号配置失败，请稍后重试',
      });
      return false;
    } finally {
      setSubmittingAction(null);
    }
  }, [loadMember, member, submittingAction]);

  const retryLoadMember = useCallback((): void => {
    void loadMember();
  }, [loadMember]);

  return {
    member,
    isLoading,
    isNotFound,
    errorMessage,
    points,
    beans,
    memberLevel,
    memberExpiry,
    lifetimeMembershipDays,
    lifetimeMembershipAmountFen,
    isSubmittingPoints: submittingAction === 'points',
    isSubmittingBeans: submittingAction === 'beans',
    isSubmittingMembership: submittingAction === 'membership',
    isSubmittingBan: submittingAction === 'ban',
    isSubmittingSubAccount: submittingAction === 'subAccount',
    isSubmittingAction: submittingAction !== null,
    handleAdjustPoints,
    handleAdjustBeans,
    handleSetMembership,
    handleBanMember,
    handleUnbanMember,
    handleSetSubAccountQuota,
    retryLoadMember,
  };
};
