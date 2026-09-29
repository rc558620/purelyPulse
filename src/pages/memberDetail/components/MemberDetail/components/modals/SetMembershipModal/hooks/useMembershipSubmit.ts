// 「设置会员等级」弹窗的提交流程：步骤切换、ESC 返回与提交参数组装。
import { useCallback, useEffect, useState } from 'react';
import type { MemberLevel } from '@pages/memberList/memberList.types';
import type {
  MembershipConfirmOptions,
  ModalMembershipSelection,
  SetMembershipStep,
} from '../SetMembershipModal.types';
import { buildConfirmOptions } from '../setMembershipModal.utils';

interface UseMembershipSubmitParams {
  selectedDuration: ModalMembershipSelection;
  newExpiry: number | null;
  isFree: boolean;
  isLifetime: boolean;
  requiresAmountInput: boolean;
  isAmountInputValid: boolean;
  amountInput: string;
  multiplier: number;
  subAccountCountInput: string;
  subAccountAmountInput: string;
  isDowngradePlan: boolean;
  confirmDowngradePlan: boolean;
  countAsIncome: boolean;
  onClose: () => void;
  onConfirm: (
    newLevel: MemberLevel,
    newExpiry: number | null,
    options?: MembershipConfirmOptions,
  ) => Promise<void> | void;
}

export interface UseMembershipSubmitReturn {
  step: SetMembershipStep;
  isSubmitting: boolean;
  /** 确认步骤返回上一步，选择步骤直接关闭弹窗 */
  handleBack: () => void;
  /** 选择步骤进入确认，确认步骤提交 */
  handlePrimaryAction: () => void;
}

/**
 * 提交流程 hook。
 *
 * 提交失败时不关闭弹窗（外部已处理 toast 提示），草稿原样保留。
 */
export const useMembershipSubmit = ({
  selectedDuration,
  newExpiry,
  isFree,
  isLifetime,
  requiresAmountInput,
  isAmountInputValid,
  amountInput,
  multiplier,
  subAccountCountInput,
  subAccountAmountInput,
  isDowngradePlan,
  confirmDowngradePlan,
  countAsIncome,
  onClose,
  onConfirm,
}: UseMembershipSubmitParams): UseMembershipSubmitReturn => {
  const [step, setStep] = useState<SetMembershipStep>('select');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBack = useCallback((): void => {
    if (step === 'confirm') {
      setStep('select');
      return;
    }
    onClose();
  }, [onClose, step]);

  const handleFinalConfirm = useCallback(async (): Promise<void> => {
    if (isSubmitting) {
      return;
    }

    // free 选择直接转换为 MemberLevel 'free'，expiry 为 null
    const newLevel: MemberLevel = isFree ? 'free' : selectedDuration;
    setIsSubmitting(true);
    try {
      const options = buildConfirmOptions({
        isFree,
        isLifetime,
        requiresAmountInput,
        isAmountInputValid,
        amountInput,
        subAccountCountInput,
        subAccountAmountInput,
        multiplier,
        countAsIncome,
        isDowngradePlan,
        confirmDowngradePlan,
      });

      await onConfirm(newLevel, isFree ? null : newExpiry, options);
      onClose();
    } catch {
      // onConfirm 失败时不关闭弹窗，外部已处理 toast 提示
    } finally {
      setIsSubmitting(false);
    }
  }, [
    amountInput,
    confirmDowngradePlan,
    countAsIncome,
    isAmountInputValid,
    isDowngradePlan,
    isFree,
    isLifetime,
    isSubmitting,
    multiplier,
    newExpiry,
    onClose,
    onConfirm,
    requiresAmountInput,
    selectedDuration,
    subAccountAmountInput,
    subAccountCountInput,
  ]);

  const handlePrimaryAction = useCallback((): void => {
    if (step === 'confirm') {
      void handleFinalConfirm();
      return;
    }
    setStep('confirm');
  }, [handleFinalConfirm, step]);

  // ESC：确认步骤退回选择，选择步骤关闭弹窗；提交中不接受退出
  useEffect(() => {
    const handler = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !isSubmitting) {
        if (step === 'confirm') setStep('select');
        else onClose();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isSubmitting, onClose, step]);

  return { step, isSubmitting, handleBack, handlePrimaryAction };
};
