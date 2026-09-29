// 「设置会员等级」弹窗的容器 hook：把草稿、成交价预览与提交流程串成一份视图状态，
// 弹窗组件只负责按步骤组合渲染。
import { useState } from 'react';
import type { MemberLevel } from '@pages/memberList/memberList.types';
import type { MembershipConfirmOptions } from '../SetMembershipModal.types';
import { resolveLevelLabel } from '../setMembershipModal.utils';
import { useMembershipDraft, type UseMembershipDraftReturn } from './useMembershipDraft';
import {
  useMembershipPricingPreview,
  type UseMembershipPricingPreviewReturn,
} from './useMembershipPricingPreview';
import { useMembershipSubmit, type UseMembershipSubmitReturn } from './useMembershipSubmit';

interface UseSetMembershipModalParams {
  /** 会员 ID，用于向后端请求成交价预览 */
  memberId: string;
  currentLevel: MemberLevel;
  currentExpiry: number | null | undefined;
  lifetimeMembershipDays: number;
  lifetimeMembershipAmountDisplay: string;
  annualMembershipAmountDisplay: string;
  onClose: () => void;
  onConfirm: (
    newLevel: MemberLevel,
    newExpiry: number | null,
    options?: MembershipConfirmOptions,
  ) => Promise<void> | void;
}

export interface UseSetMembershipModalReturn {
  /** 弹窗打开时刻（首次渲染固定），作为已过期会员的续期起点 */
  now: number;
  isCurrentLifetime: boolean;
  currentLevelLabel: string;
  isConfirmStep: boolean;
  /** 档位 / 期数 / 价格与子账号输入等草稿状态 */
  draft: UseMembershipDraftReturn;
  /** 后端算好的成交价预览 */
  pricing: UseMembershipPricingPreviewReturn;
  /** 步骤切换与提交流程 */
  flow: UseMembershipSubmitReturn;
  /** 确认步骤存在价格 / 子账号加价格式错误时禁用提交 */
  isConfirmDisabled: boolean;
}

/**
 * 弹窗状态编排 hook。
 *
 * 三个子 hook 各管一段：草稿（useMembershipDraft）、预览（useMembershipPricingPreview）、
 * 提交（useMembershipSubmit）；这里只做组装与派生，不新增状态。
 */
export const useSetMembershipModal = ({
  memberId,
  currentLevel,
  currentExpiry,
  lifetimeMembershipDays,
  lifetimeMembershipAmountDisplay,
  annualMembershipAmountDisplay,
  onClose,
  onConfirm,
}: UseSetMembershipModalParams): UseSetMembershipModalReturn => {
  // 记录弹窗首次打开的时间戳（useState 懒初始化，仅在首次渲染执行一次）
  const [now] = useState<number>(() => Date.now());

  const draft = useMembershipDraft({
    currentLevel,
    currentExpiry,
    now,
    lifetimeMembershipDays,
    lifetimeMembershipAmountDisplay,
    annualMembershipAmountDisplay,
  });

  const pricing = useMembershipPricingPreview({
    memberId,
    selectedDuration: draft.selectedDuration,
    amountInput: draft.amountInput,
    subAccountCountInput: draft.subAccountCountInput,
    subAccountAmountInput: draft.subAccountAmountInput,
    enabled: draft.requiresAmountInput,
  });

  const flow = useMembershipSubmit({
    selectedDuration: draft.selectedDuration,
    newExpiry: draft.newExpiry,
    isFree: draft.isFree,
    isLifetime: draft.isLifetime,
    requiresAmountInput: draft.requiresAmountInput,
    isAmountInputValid: draft.isAmountInputValid,
    amountInput: draft.amountInput,
    multiplier: draft.multiplier,
    subAccountCountInput: draft.subAccountCountInput,
    subAccountAmountInput: draft.subAccountAmountInput,
    isDowngradePlan: draft.isDowngradePlan,
    confirmDowngradePlan: draft.confirmDowngradePlan,
    countAsIncome: draft.countAsIncome,
    onClose,
    onConfirm,
  });

  const isConfirmStep = flow.step === 'confirm';

  return {
    now,
    isCurrentLifetime: currentLevel === 'lifetime',
    currentLevelLabel: resolveLevelLabel(currentLevel),
    isConfirmStep,
    draft,
    pricing,
    flow,
    isConfirmDisabled:
      isConfirmStep && draft.requiresAmountInput
        ? Boolean(draft.amountError || draft.subAccountAmountError)
        : false,
  };
};
