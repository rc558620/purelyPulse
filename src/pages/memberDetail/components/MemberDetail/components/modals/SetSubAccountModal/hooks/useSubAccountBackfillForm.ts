// useSubAccountBackfillForm：管理成交价快照的内联补录表单（同一时刻只展开一个档位）。
import { useCallback, useState } from 'react';
import { safeNum } from '@utils/utils';
import { QUOTA_MAX, SUB_ACCOUNT_AMOUNT_PATTERN } from '../SetSubAccountModal.constants';
import type { SetSubAccountModalProps } from '../SetSubAccountModal.types';
import type { MemberLockedPrice } from '@pages/memberList/memberList.pricing.types';

/** 补录提交器：缺失时表示当前弹窗未提供补录入口。 */
type BackfillSubmitter = NonNullable<SetSubAccountModalProps['onBackfillSubAccountAmount']>;

/** 内联补录表单的受控状态与操作集合，由列表向下分发给各档位条目。 */
export interface SubAccountBackfillForm {
  /** 当前展开补录表单的档位 planId；null 表示未展开 */
  expandedPlanId: string | null;
  countValue: string;
  amountValue: string;
  /** 金额留空提交 = 撤销补录（后端据此把子账号两列置空），按钮文案要如实反映 */
  isAmountEmpty: boolean;
  /** 金额是否通过后端 `^\d+(\.\d{1,2})?$` 校验；留空合法，属于撤销操作 */
  isAmountValid: boolean;
  onCountChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onStart: (item: MemberLockedPrice) => void;
  onCancel: () => void;
  onSubmit: (item: MemberLockedPrice) => void;
}

interface UseSubAccountBackfillFormParams {
  /** 未提供时不抛错：表单入口整体隐藏 */
  onBackfillSubAccountAmount?: BackfillSubmitter;
}

/** 数量解析失败的兜底值：负数是非法数量，据此判定「本次不动数量」。 */
const EMPTY_COUNT = -1;

export const useSubAccountBackfillForm = ({
  onBackfillSubAccountAmount,
}: UseSubAccountBackfillFormParams): SubAccountBackfillForm => {
  // 一次只展开一个档位，避免运营同时改两行看串
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [countValue, setCountValue] = useState<string>('');
  const [amountValue, setAmountValue] = useState<string>('');

  const onCountChange = useCallback((value: string): void => {
    const digits = value.replace(/[^\d]/g, '');
    if (!digits) {
      setCountValue('');
      return;
    }

    // 数量上限与后端 DTO 的 @Max(10) 对齐
    setCountValue(String(Math.min(QUOTA_MAX, Number.parseInt(digits, 10))));
  }, []);

  const onAmountChange = useCallback((value: string): void => {
    const matched = value.replace(/[^\d.]/g, '').match(/^\d*(\.\d{0,2})?/);
    setAmountValue(matched ? matched[0] : '');
  }, []);

  const onStart = useCallback((item: MemberLockedPrice): void => {
    setExpandedPlanId(item.planId);
    setCountValue(item.subAccountCount === null ? '' : String(item.subAccountCount));
    setAmountValue(item.subAccountAmountDisplay ?? '');
  }, []);

  const onCancel = useCallback((): void => {
    setExpandedPlanId(null);
    setCountValue('');
    setAmountValue('');
  }, []);

  const onSubmit = useCallback(
    async (item: MemberLockedPrice): Promise<void> => {
      if (!onBackfillSubAccountAmount) {
        return;
      }

      const trimmedAmount = amountValue.trim();
      const parsedCount = safeNum(Number.parseInt(countValue, 10), EMPTY_COUNT);

      // 数量留空 = 本次不动数量（只想改加价），绝不能补成 0：
      // 后端把「未传」与「0」区分开，0 会覆盖掉已录入的数量
      const didSucceed = await onBackfillSubAccountAmount(item, {
        ...(parsedCount >= 0 ? { subAccountCount: parsedCount } : {}),
        subAccountAmountDisplay: trimmedAmount,
      });

      // 提交失败时保留表单：清掉会让运营刚填的数量 / 加价白填一遍
      if (didSucceed) {
        onCancel();
      }
    },
    [amountValue, countValue, onBackfillSubAccountAmount, onCancel],
  );

  const trimmedAmount = amountValue.trim();

  return {
    expandedPlanId,
    countValue,
    amountValue,
    isAmountEmpty: trimmedAmount === '',
    isAmountValid: trimmedAmount === '' || SUB_ACCOUNT_AMOUNT_PATTERN.test(trimmedAmount),
    onCountChange,
    onAmountChange,
    onStart,
    onCancel,
    onSubmit,
  };
};
