// 「设置会员等级」弹窗的草稿状态：档位 / 期数选择、价格与子账号输入，以及派生结果。
import { useCallback, useMemo, useState } from 'react';
import type { MemberLevel } from '@pages/memberList/memberList.types';
import { DAY_MS } from '../SetMembershipModal.constants';
import type { DurationOption, ModalMembershipSelection } from '../SetMembershipModal.types';
import {
  buildDurationOptions,
  clampSubAccountCountInput,
  isDowngradeSelection,
  isValidAmountInput,
  normalizeSubAccountAmountInput,
  resolveDefaultAmountDisplay,
  resolveSubAccountAmountError,
} from '../setMembershipModal.utils';

interface UseMembershipDraftParams {
  currentLevel: MemberLevel;
  currentExpiry: number | null | undefined;
  /** 弹窗打开时刻，作为已过期会员的续期起点 */
  now: number;
  lifetimeMembershipDays: number;
  lifetimeMembershipAmountDisplay: string;
  annualMembershipAmountDisplay: string;
}

export interface UseMembershipDraftReturn {
  selectedDuration: ModalMembershipSelection;
  multiplier: number;
  /** 永久档位天数按后端配置覆盖后的档位选项 */
  durationOptions: DurationOption[];
  selectedOption: DurationOption;
  setSelectedDuration: (value: ModalMembershipSelection) => void;
  setMultiplier: (value: number) => void;
  isFree: boolean;
  isLifetime: boolean;
  /** 年度 / 永久会员需在确认步骤填写自定义价格 */
  requiresAmountInput: boolean;
  amountFieldLabel: string;
  amountFieldPlaceholder: string;
  amountDefaultDisplay: string;
  amountInput: string;
  /** 价格格式错误文案；空串表示合法 */
  amountError: string;
  isAmountInputValid: boolean;
  handleAmountChange: (value: string) => void;
  /** 子账号数量草稿（字符串，不做数值运算） */
  subAccountCountInput: string;
  /** 子账号加价草稿（元字符串） */
  subAccountAmountInput: string;
  /** 子账号加价格式错误文案；空串表示合法 */
  subAccountAmountError: string;
  handleSubAccountCountChange: (value: string) => void;
  handleSubAccountAmountChange: (value: string) => void;
  /** 所选档位是否低于当前档位 */
  isDowngradePlan: boolean;
  /** 是否勾选「同时降级」；仅当所选档位低于当前档位时才有意义 */
  confirmDowngradePlan: boolean;
  setConfirmDowngradePlan: (value: boolean) => void;
  /** 是否勾选「计入收入」；不勾选即按赠送处理 */
  countAsIncome: boolean;
  setCountAsIncome: (value: boolean) => void;
  /** 本次写入 / 追加的天数 */
  addedDays: number;
  /** 操作后的到期时间；免费会员为 null */
  newExpiry: number | null;
  /** 所选档位与当前档位一致且都是免费，无需重复设置 */
  isSameAsNow: boolean;
  /** 确认页展示的赠送额度总额，与后端「每期额度 × 期数」口径一致 */
  confirmQuotaText: string;
}

/**
 * 会员设置草稿 hook。
 *
 * 价格草稿记录「属于哪个档位 + 该档位的默认值」，档位切换或后端配置刷新时自然回落默认值，
 * 无需副作用同步。
 */
export const useMembershipDraft = ({
  currentLevel,
  currentExpiry,
  now,
  lifetimeMembershipDays,
  lifetimeMembershipAmountDisplay,
  annualMembershipAmountDisplay,
}: UseMembershipDraftParams): UseMembershipDraftReturn => {
  // 弹窗打开时默认选中当前档位
  const defaultDuration: ModalMembershipSelection = currentLevel;

  const resolveDefaultAmount = useCallback(
    (duration: ModalMembershipSelection): string => resolveDefaultAmountDisplay({
      duration,
      lifetimeMembershipAmountDisplay,
      annualMembershipAmountDisplay,
    }),
    [annualMembershipAmountDisplay, lifetimeMembershipAmountDisplay],
  );

  const [selectedDuration, setSelectedDuration] = useState<ModalMembershipSelection>(defaultDuration);
  const [multiplier, setMultiplier] = useState(1);
  const [
    amountDraft,
    setAmountDraft,
  ] = useState<{ duration: ModalMembershipSelection; defaultValue: string; value: string }>(
    () => {
      const defaultValue = resolveDefaultAmount(defaultDuration);
      return { duration: defaultDuration, defaultValue, value: defaultValue };
    },
  );

  // 子账号：数量与加价由运营录入，后端据此拆出「子账号加价」参与续费定价。
  // 均为字符串草稿（与成交价一致不做任何数值运算），提交时原样回传后端。
  const [subAccountCountInput, setSubAccountCountInput] = useState('');
  const [subAccountAmountInput, setSubAccountAmountInput] = useState('');
  /** 是否勾选「同时降级」；仅当所选档位低于当前档位时才有意义 */
  const [confirmDowngradePlan, setConfirmDowngradePlan] = useState(false);
  /** 是否勾选「计入收入」；不勾选即按赠送处理（不计入营收） */
  const [countAsIncome, setCountAsIncome] = useState(false);

  const isFree = selectedDuration === 'free';
  const isLifetime = selectedDuration === 'lifetime';
  const isAnnual = selectedDuration === 'annual';
  // 年度会员与永久会员一致：支持自定义价格，需在确认步骤填写
  const requiresAmountInput = isLifetime || isAnnual;

  const durationOptions = useMemo(
    () => buildDurationOptions(lifetimeMembershipDays),
    [lifetimeMembershipDays],
  );

  const baseExpiry: number | null = useMemo(() => {
    if (selectedDuration === 'free') return null;
    if (currentExpiry && currentExpiry > now) {
      return currentExpiry;
    }
    return now;
  }, [currentExpiry, now, selectedDuration]);

  const addedDays = useMemo(() => {
    if (selectedDuration === 'free') return 0;
    const selectedOption = durationOptions.find((option) => option.value === selectedDuration)!;
    return selectedOption.daysBase * (selectedDuration === 'lifetime' ? 1 : multiplier);
  }, [durationOptions, multiplier, selectedDuration]);

  const newExpiry: number | null = useMemo(() => {
    if (selectedDuration === 'free') return null;
    return (baseExpiry ?? now) + addedDays * DAY_MS;
  }, [addedDays, baseExpiry, now, selectedDuration]);

  const isSameAsNow = selectedDuration === currentLevel && isFree;

  const amountFieldLabel = isLifetime ? '永久会员价格' : '年度会员价格';
  const amountFieldPlaceholder = isLifetime ? '请输入永久会员价格' : '请输入年度会员价格';
  const amountDefaultDisplay = resolveDefaultAmount(selectedDuration);

  // 草稿与当前档位/默认值不一致时（切换档位、后端配置更新）直接读取默认值
  const amountInput = amountDraft.duration === selectedDuration && amountDraft.defaultValue === amountDefaultDisplay
    ? amountDraft.value
    : amountDefaultDisplay;

  const handleAmountChange = useCallback((value: string): void => {
    setAmountDraft({
      duration: selectedDuration,
      defaultValue: resolveDefaultAmount(selectedDuration),
      value,
    });
  }, [resolveDefaultAmount, selectedDuration]);

  const isAmountInputValid = useMemo(
    () => (requiresAmountInput ? isValidAmountInput(amountInput) : true),
    [amountInput, requiresAmountInput],
  );

  const amountError = useMemo(() => {
    if (!requiresAmountInput) {
      return '';
    }
    if (!amountInput.trim()) {
      return `请输入${amountFieldLabel}`;
    }
    if (!isAmountInputValid) {
      return '请输入有效价格，最多保留 2 位小数';
    }
    return '';
  }, [amountFieldLabel, amountInput, isAmountInputValid, requiresAmountInput]);

  const handleSubAccountCountChange = useCallback((value: string): void => {
    setSubAccountCountInput(clampSubAccountCountInput(value));
  }, []);

  const handleSubAccountAmountChange = useCallback((value: string): void => {
    setSubAccountAmountInput(normalizeSubAccountAmountInput(value));
  }, []);

  const subAccountAmountError = useMemo(
    () => resolveSubAccountAmountError(subAccountAmountInput, requiresAmountInput),
    [requiresAmountInput, subAccountAmountInput],
  );

  const isDowngradePlan = isDowngradeSelection(selectedDuration, currentLevel);

  const selectedOption = durationOptions.find((option) => option.value === selectedDuration)!;

  /**
   * 确认页展示的赠送额度总额 = 每期额度 × 期数（年度 × 2 → 600 位新客），
   * 与后端「每期额度 × 期数」的发放口径一致；免费会员走清零文案。
   */
  const confirmQuotaText = useMemo(() => {
    if (isFree) return selectedOption.quotaText;
    return `${selectedOption.quotaPerPeriod * (isLifetime ? 1 : multiplier)} 位新客`;
  }, [isFree, isLifetime, multiplier, selectedOption]);

  return {
    selectedDuration,
    multiplier,
    durationOptions,
    selectedOption,
    setSelectedDuration,
    setMultiplier,
    isFree,
    isLifetime,
    requiresAmountInput,
    amountFieldLabel,
    amountFieldPlaceholder,
    amountDefaultDisplay,
    amountInput,
    amountError,
    isAmountInputValid,
    handleAmountChange,
    subAccountCountInput,
    subAccountAmountInput,
    subAccountAmountError,
    handleSubAccountCountChange,
    handleSubAccountAmountChange,
    isDowngradePlan,
    confirmDowngradePlan,
    setConfirmDowngradePlan,
    countAsIncome,
    setCountAsIncome,
    addedDays,
    newExpiry,
    isSameAsNow,
    confirmQuotaText,
  };
};
