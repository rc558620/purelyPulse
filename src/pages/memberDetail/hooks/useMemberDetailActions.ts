// 会员详情提交动作 hook：负责六类后台操作的提交、提交中互斥与结果提示。
import { useCallback, useState } from 'react';
import { safeNum } from '@utils/utils';
import { showToast } from '@components/ui/feedback/Toast';
import {
  emitMemberCancelSync,
  emitMemberStatusSync,
  submitMemberBan,
  submitMemberBeansAdjustment,
  submitMemberCancelAccount,
  submitMemberMembership,
  submitMemberPointsAdjustment,
  submitMemberUnban,
  submitSubAccountQuota,
} from '../../memberList/memberList.service';
import type {
  MemberDetail,
  MemberLevel,
} from '../../memberList/memberList.types';

/** 会员详情页可提交的动作标识。 */
export type MemberSubmitAction = 'points' | 'beans' | 'membership' | 'ban' | 'subAccount' | 'cancel';

export interface UseMemberDetailActionsParams {
  /** 当前会员详情，为 null 时不执行任何提交。 */
  member: MemberDetail | null;
  /** 静默刷新会员详情。 */
  loadMember: (options?: { silent?: boolean }) => Promise<void>;
  /** 局部同步会员字段。 */
  patchMember: (updater: (prev: MemberDetail) => MemberDetail) => void;
}

export interface UseMemberDetailActionsReturn {
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
  /** 是否正在提交注销账号。 */
  isSubmittingCancel: boolean;
  /** 是否有任一提交动作进行中。 */
  isSubmittingAction: boolean;
  /** 调整积分并提交。 */
  handleAdjustPoints: (delta: number, reason: string) => Promise<void>;
  /** 调整纯利豆并提交。 */
  handleAdjustBeans: (delta: number, reason: string) => Promise<void>;
  /** 设置会员等级并提交。 */
  handleSetMembership: (newLevel: MemberLevel, newExpiry: number | null, options?: { amountDisplay?: string }) => Promise<void>;
  /** 封禁当前会员。 */
  handleBanMember: (reason: string) => Promise<boolean>;
  /** 解封当前会员。 */
  handleUnbanMember: () => Promise<boolean>;
  /** 设置子账号配额并提交（平台侧）。角色分配由商家在 purelyProfit 端操作。 */
  handleSetSubAccountQuota: (quota: number) => Promise<boolean>;
  /** 注销当前会员账号（不可逆）。 */
  handleCancelAccount: () => Promise<boolean>;
}

/** 会员详情提交动作 hook。 */
export const useMemberDetailActions = ({
  member,
  loadMember,
  patchMember,
}: UseMemberDetailActionsParams): UseMemberDetailActionsReturn => {
  const [submittingAction, setSubmittingAction] = useState<MemberSubmitAction | null>(null);

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
      throw error;
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
      throw error;
    } finally {
      setSubmittingAction(null);
    }
  }, [loadMember, member, submittingAction]);

  const handleSetMembership = useCallback(async (
    newLevel: MemberLevel,
    newExpiry: number | null,
    options?: { amountDisplay?: string },
  ): Promise<void> => {
    if (!member || submittingAction) {
      return;
    }

    setSubmittingAction('membership');
    try {
      await submitMemberMembership(member.id, newLevel, newExpiry, {
        memberName: member.name,
        amountDisplay: options?.amountDisplay,
      });
      showToast({ type: 'success', message: '会员等级设置成功' });
      void loadMember({ silent: true });
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : '会员等级设置失败，请稍后重试',
      });
      throw error;
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
      patchMember((prev) => ({ ...prev, status: 'banned', remark: normalizedReason }));
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
  }, [loadMember, member, patchMember, submittingAction]);

  const handleUnbanMember = useCallback(async (): Promise<boolean> => {
    if (!member || submittingAction) {
      return false;
    }

    setSubmittingAction('ban');
    try {
      await submitMemberUnban(member.id);
      patchMember((prev) => ({ ...prev, status: 'active', remark: undefined }));
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
  }, [loadMember, member, patchMember, submittingAction]);

  const handleCancelAccount = useCallback(async (): Promise<boolean> => {
    if (!member || submittingAction) {
      return false;
    }

    setSubmittingAction('cancel');
    try {
      await submitMemberCancelAccount(member.id);
      patchMember((prev) => ({ ...prev, status: 'cancelled' }));
      emitMemberCancelSync(member.id);
      showToast({ type: 'success', message: '账号已注销，该用户已无任何记录' });
      return true;
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : '注销账号失败，请稍后重试',
      });
      return false;
    } finally {
      setSubmittingAction(null);
    }
  }, [member, patchMember, submittingAction]);

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

  return {
    isSubmittingPoints: submittingAction === 'points',
    isSubmittingBeans: submittingAction === 'beans',
    isSubmittingMembership: submittingAction === 'membership',
    isSubmittingBan: submittingAction === 'ban',
    isSubmittingSubAccount: submittingAction === 'subAccount',
    isSubmittingCancel: submittingAction === 'cancel',
    isSubmittingAction: submittingAction !== null,
    handleAdjustPoints,
    handleAdjustBeans,
    handleSetMembership,
    handleBanMember,
    handleUnbanMember,
    handleSetSubAccountQuota,
    handleCancelAccount,
  };
};
