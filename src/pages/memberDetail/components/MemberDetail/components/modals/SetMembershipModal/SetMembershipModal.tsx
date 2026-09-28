/**
 * SetMembershipModal —— 设置会员订阅级别弹窗
 *
 * 功能：
 *  - 选择会员类型：免费 / 月度 / 季度 / 年度 / 永久
 *  - 非永久 & 非免费会员：追加时间（多选期数）
 *  - 永久会员可降级回月度/季度/年度（设置具体时长）
 *  - 年度会员 / 永久会员支持自定义价格（默认取后端套餐配置）
 *  - 实时预览到期日期
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { IconClose, IconStarBadge } from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
import SetMembershipActionBar from './components/SetMembershipActionBar/SetMembershipActionBar';
import SetMembershipConfirmStep from './components/SetMembershipConfirmStep/SetMembershipConfirmStep';
import SetMembershipSelectStep from './components/SetMembershipSelectStep/SetMembershipSelectStep';
import type { MemberDetail, MemberLevel, MembershipDuration } from '@pages/memberList/memberList.types';
import {
  fetchMembershipPricingPreview,
  type MemberPricingPreview,
} from '@pages/memberList/memberList.service';
// fenToYuan 已删除：前端不做分转元转换。金额展示值由后端直接返回 xxxDisplay 字段。
import styles from './SetMembershipModal.module.less';

export interface SetMembershipModalProps {
  member: MemberDetail;
  currentLevel: MemberLevel;
  currentExpiry: number | null | undefined;
  lifetimeMembershipDays: number;
  lifetimeMembershipAmountDisplay: string;
  annualMembershipAmountDisplay: string;
  onClose: () => void;
  /** 会员 ID，用于向后端请求成交价预览 */
  memberId: string;
  onConfirm: (
    newLevel: MemberLevel,
    newExpiry: number | null,
    options?: {
      amountDisplay?: string;
      subAccountCount?: number;
      subAccountAmountDisplay?: string;
      confirmDowngradePlan?: boolean;
      countAsIncome?: boolean;
      /** 期数：追加时长与新客额度都按它叠加（年度 × 2 = 730 天 / 600 位新客） */
      multiplier?: number;
    },
  ) => Promise<void> | void;
}

/** 弹窗内部使用的选择类型，扩展了 free */
export type ModalMembershipSelection = MembershipDuration | 'free';

const BASE_DURATION_OPTIONS: {
  value: ModalMembershipSelection;
  label: string;
  shortLabel: string;
  desc: string;
  /** 新用户额度说明文案，展示在 desc（xxx 天订阅）下一行 */
  quotaText: string;
  /** 每期赠送的新客额度（位），与后端 PLAN_QUOTA_GRANT 对齐 */
  quotaPerPeriod: number;
  daysBase: number;
  color: string;
  gradientFrom: string;
  gradientTo: string;
}[] = [
  {
    value: 'free',
    label: '免费会员',
    shortLabel: '免费',
    desc: '基础权益',
    quotaText: '新用户额度清零',
    quotaPerPeriod: 0,
    daysBase: 0,
    color: '#94a3b8',
    gradientFrom: 'rgba(148,163,184,0.14)',
    gradientTo: 'rgba(203,213,225,0.07)',
  },
  {
    value: 'monthly',
    label: '月度会员',
    shortLabel: '月卡',
    desc: '30 天订阅',
    quotaText: '50 位新客',
    quotaPerPeriod: 50,
    daysBase: 30,
    color: '#3b82f6',
    gradientFrom: 'rgba(59,130,246,0.14)',
    gradientTo: 'rgba(96,165,250,0.07)',
  },
  {
    value: 'quarterly',
    label: '季度会员',
    shortLabel: '季卡',
    desc: '90 天订阅',
    quotaText: '100 位新客',
    quotaPerPeriod: 100,
    daysBase: 90,
    color: '#84cc16',
    gradientFrom: 'rgba(132,204,22,0.14)',
    gradientTo: 'rgba(74,222,128,0.07)',
  },
  {
    value: 'annual',
    label: '年度会员',
    shortLabel: '年卡',
    desc: '365 天订阅',
    quotaText: '300 位新客',
    quotaPerPeriod: 300,
    daysBase: 365,
    color: '#f59e0b',
    gradientFrom: 'rgba(245,158,11,0.14)',
    gradientTo: 'rgba(251,191,36,0.07)',
  },
  {
    value: 'lifetime',
    label: '永久会员',
    shortLabel: '永久',
    desc: '',
    quotaText: '300 位新客',
    quotaPerPeriod: 300,
    daysBase: 0,
    color: '#a855f7',
    gradientFrom: 'rgba(168,85,247,0.14)',
    gradientTo: 'rgba(192,132,252,0.07)',
  },
];

const MULTIPLIER_OPTIONS = [
  { value: 1, label: '× 1' },
  { value: 2, label: '× 2' },
  { value: 3, label: '× 3' },
  { value: 6, label: '× 6' },
  { value: 12, label: '× 12' },
];

const DAY_MS = 86_400_000;

/** 会员档位高低，仅用于判断本次选择是否属于「降档」 */
const LEVEL_RANK: Record<string, number> = {
  free: 0,
  monthly: 1,
  quarterly: 2,
  annual: 3,
  lifetime: 4,
};

// formatAmountInputFromFen / parseAmountInputToFen 已删除：
// 前端不做分转元/元转分转换。金额展示值由后端直接返回 xxxDisplay 字段，
// 用户输入的价格直接作为字符串提交给后端。

/** 验证用户输入的价格字符串是否合法（最多 2 位小数的正数，与后端 DTO 校验保持一致） */
const isValidAmountInput = (value: string): boolean => {
  const normalizedValue = value.trim();
  if (!normalizedValue) return false;
  if (!/^\d+(\.\d{1,2})?$/.test(normalizedValue)) return false;
  const amount = Number(normalizedValue);
  return Number.isFinite(amount) && amount > 0;
};

/** 子账号数量上限，与后端 DTO 的 @Max(10) 保持一致 */
const SUB_ACCOUNT_COUNT_MAX = 10;

function formatMembershipExpiry(ts: number): string {
  const date = new Date(ts);
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

function formatMembershipDaysLeft(ts: number): string {
  const diff = ts - Date.now();
  if (diff <= 0) return '已过期';
  const days = Math.ceil(diff / DAY_MS);
  if (days < 31) return `还有 ${days} 天`;
  if (days < 366) return `还有约 ${Math.round(days / 30)} 个月`;
  return `还有约 ${(days / 365).toFixed(1)} 年`;
}

const SetMembershipModal: React.FC<SetMembershipModalProps> = ({
  member,
  memberId,
  currentLevel,
  currentExpiry,
  lifetimeMembershipDays,
  lifetimeMembershipAmountDisplay,
  annualMembershipAmountDisplay,
  onClose,
  onConfirm,
}) => {
  const isCurrentLifetime = currentLevel === 'lifetime';

  // 记录弹窗首次打开的时间戳（useState 懒初始化，仅在首次渲染执行一次）
  const [now] = useState<number>(() => Date.now());

  const defaultDuration: ModalMembershipSelection =
    currentLevel === 'free' ? 'free' :
    currentLevel === 'lifetime' ? 'lifetime' :
    currentLevel;

  /** 读取指定档位的默认价格展示值；非自定义价格档位返回空串。 */
  const resolveDefaultAmountDisplay = useCallback((duration: ModalMembershipSelection): string => {
    if (duration === 'lifetime') return lifetimeMembershipAmountDisplay || '';
    if (duration === 'annual') return annualMembershipAmountDisplay || '';
    return '';
  }, [annualMembershipAmountDisplay, lifetimeMembershipAmountDisplay]);

  const [selectedDuration, setSelectedDuration] = useState<ModalMembershipSelection>(defaultDuration);
  const [multiplier, setMultiplier] = useState(1);
  const [step, setStep] = useState<'select' | 'confirm'>('select');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 价格草稿记录「属于哪个档位 + 该档位的默认值」，档位切换或后端配置刷新时自然回落默认值，无需副作用同步
  const [amountDraft, setAmountDraft] = useState<{ duration: ModalMembershipSelection; defaultValue: string; value: string }>(
    () => {
      const defaultValue = resolveDefaultAmountDisplay(defaultDuration);
      return { duration: defaultDuration, defaultValue, value: defaultValue };
    },
  );

  // 子账号：数量与加价由运营录入，后端据此拆出「子账号加价」参与续费定价。
  // 均为字符串草稿（与成交价一致不做任何数值运算），提交时原样回传后端。
  const [subAccountCountInput, setSubAccountCountInput] = useState('');
  const [subAccountAmountInput, setSubAccountAmountInput] = useState('');
  /**
   * 后端算好的成交价预览，与产生它的请求参数（requestKey）绑定。
   *
   * 参数一变旧结果立刻失效，因此不必在 effect 里 setState(null) 清空——
   * 既避免了级联渲染，也不会出现「改了输入还显示上一次价格」的脏展示。
   */
  const [pricingPreviewState, setPricingPreviewState] = useState<{
    requestKey: string;
    data: MemberPricingPreview;
  } | null>(null);
  /** 预览请求失败时的参数指纹；与当前 key 一致才认为「这一次失败了」 */
  const [previewFailureKey, setPreviewFailureKey] = useState<string | null>(null);
  /** 是否勾选「同时降级」；仅当所选档位低于当前档位时才有意义 */
  const [confirmDowngradePlan, setConfirmDowngradePlan] = useState(false);
  /** 是否勾选「计入收入」；不勾选即按赠送处理（不计入营收） */
  const [countAsIncome, setCountAsIncome] = useState(false);

  const isFree = selectedDuration === 'free';
  const isLifetime = selectedDuration === 'lifetime';
  const isAnnual = selectedDuration === 'annual';
  // 年度会员与永久会员一致：支持自定义价格，需在确认步骤填写
  const requiresAmountInput = isLifetime || isAnnual;

  const durationOptions = useMemo(() => BASE_DURATION_OPTIONS.map((option) => (
    option.value === 'lifetime'
      ? {
          ...option,
          daysBase: lifetimeMembershipDays,
          desc: `${lifetimeMembershipDays} 天订阅`,
        }
      : option
  )), [lifetimeMembershipDays]);

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

  const isSameAsNow = useMemo(() => {
    if (selectedDuration !== currentLevel) return false;
    if (selectedDuration === 'free') return true;
    return false;
  }, [currentLevel, selectedDuration]);

  const amountFieldLabel = isLifetime ? '永久会员价格' : '年度会员价格';
  const amountFieldPlaceholder = isLifetime ? '请输入永久会员价格' : '请输入年度会员价格';
  const amountDefaultDisplay = resolveDefaultAmountDisplay(selectedDuration);

  // 草稿与当前档位/默认值不一致时（切换档位、后端配置更新）直接读取默认值
  const amountInput = amountDraft.duration === selectedDuration && amountDraft.defaultValue === amountDefaultDisplay
    ? amountDraft.value
    : amountDefaultDisplay;

  const handleAmountChange = useCallback((value: string): void => {
    setAmountDraft({
      duration: selectedDuration,
      defaultValue: resolveDefaultAmountDisplay(selectedDuration),
      value,
    });
  }, [resolveDefaultAmountDisplay, selectedDuration]);

  const isAmountInputValid = useMemo(() => (
    requiresAmountInput ? isValidAmountInput(amountInput) : true
  ), [amountInput, requiresAmountInput]);

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

  // 子账号数量上限与后端 DTO 的 @Max(10) 对齐：不夹一次，输 99 就是一次必现的 400
  const handleSubAccountCountChange = useCallback((value: string): void => {
    const digits = value.replace(/[^\d]/g, '');
    if (!digits) {
      setSubAccountCountInput('');
      return;
    }

    setSubAccountCountInput(
      String(Math.min(SUB_ACCOUNT_COUNT_MAX, Number.parseInt(digits, 10))),
    );
  }, []);

  // 只保留「数字 + 最多一位小数点 + 两位小数」：过滤掉非法字符后仍可能拼出
  // "1.2.3"，直发后端就是 400，而且预览也会失败
  const handleSubAccountAmountChange = useCallback((value: string): void => {
    const digits = value.replace(/[^\d.]/g, '');
    const matched = digits.match(/^\d*(\.\d{0,2})?/);
    setSubAccountAmountInput(matched ? matched[0] : '');
  }, []);

  // 留空是合法的（本次不涉及子账号）；填了就必须与后端 DTO 的
  // `^\d+(\.\d{1,2})?$` 一致，否则提交 400
  const subAccountAmountError = useMemo(() => {
    if (!requiresAmountInput) {
      return '';
    }

    const trimmedAmount = subAccountAmountInput.trim();
    if (!trimmedAmount || /^\d+(\.\d{1,2})?$/.test(trimmedAmount)) {
      return '';
    }

    return '请输入有效加价，最多保留 2 位小数';
  }, [requiresAmountInput, subAccountAmountInput]);

  /**
   * 所选档位低于当前档位。
   *
   * 默认不降档——后端会把档位抬回原档、只按所选档位追加时长（等价于赠送时长）。
   * 对开了子账号的门店，真降档会造成「会员是月度、续费页只给年度、按月度下单又被拒」的死局，
   * 所以必须运营显式勾选才允许降。
   */
  // 排除「免费」：降为免费走的是 confirmDowngradeToFree 与它自己的红色警告，
  // 这里说的是「保持原档位、只追加时长」，对免费并不成立（免费没有时长可加），
  // 混在一起会让运营看到「默认保持原档位、仅追加 0 天」这种自相矛盾的提示
  const isDowngradePlan =
    !isFree &&
    (LEVEL_RANK[selectedDuration] ?? 0) < (LEVEL_RANK[currentLevel] ?? 0);

  // 预览请求的参数指纹：任何一项变化都视为「另一次预览」。
  // memberId 必须参与——结果归属某个会员，漏了会让上一位会员的价格被判为有效
  const previewRequestKey = [
    memberId,
    selectedDuration,
    amountInput.trim(),
    subAccountCountInput,
    subAccountAmountInput.trim(),
  ].join('|');

  // 成交价预览：输入变化后防抖请求后端。金额一律由后端算好下发，前端只展示
  useEffect(() => {
    if (!requiresAmountInput) {
      return undefined;
    }

    let cancelled = false;
    const parsedCount = Number.parseInt(subAccountCountInput, 10);

    const timer = setTimeout(() => {
      fetchMembershipPricingPreview(memberId, {
        level: selectedDuration,
        priceDisplay: amountInput.trim() || undefined,
        subAccountCount: Number.isFinite(parsedCount) ? parsedCount : undefined,
        subAccountAmountDisplay: subAccountAmountInput.trim() || undefined,
      })
        .then((result) => {
          if (!cancelled) {
            setPricingPreviewState({
              requestKey: previewRequestKey,
              data: result,
            });
          }
        })
        .catch(() => {
          // 预览失败保留上一次结果，不打断运营填写；只记下「这一次失败了」，
          // 让确认步骤把空白区分成「计算中」与「算不出来」
          if (!cancelled) {
            setPreviewFailureKey(previewRequestKey);
          }
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    amountInput,
    memberId,
    previewRequestKey,
    requiresAmountInput,
    selectedDuration,
    subAccountAmountInput,
    subAccountCountInput,
  ]);

  // 只有参数与当前输入完全一致时才认这份预览，否则视为尚未算出
  const pricingPreview =
    requiresAmountInput && pricingPreviewState?.requestKey === previewRequestKey
      ? pricingPreviewState.data
      : null;

  /**
   * 预览是否在途：还没算出结果、且这一次也没失败。
   *
   * 与结果一样按 requestKey 判定，因此不需要在 effect 里同步 setState 去维护
   * pending 标记——参数一变旧结果自然失效，pending 也随之恢复。
   */
  const isPreviewPending =
    requiresAmountInput &&
    pricingPreview === null &&
    previewFailureKey !== previewRequestKey;

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

  const handleFirstConfirm = useCallback(() => {
    setStep('confirm');
  }, []);

  const handleFinalConfirm = useCallback(async (): Promise<void> => {
    if (isSubmitting) {
      return;
    }

    // free 选择直接转换为 MemberLevel 'free'，expiry 为 null
    const newLevel: MemberLevel = selectedDuration === 'free' ? 'free' : selectedDuration;
    setIsSubmitting(true);
    try {
      const parsedSubAccountCount = Number.parseInt(subAccountCountInput, 10);
      const trimmedSubAccountAmount = subAccountAmountInput.trim();
      const options: {
        amountDisplay?: string;
        subAccountCount?: number;
        subAccountAmountDisplay?: string;
        confirmDowngradePlan?: boolean;
        countAsIncome?: boolean;
        multiplier?: number;
      } = {};

      // 设置为免费不是充值，无需计入收入
      if (!isFree) {
        options.countAsIncome = countAsIncome;
        // 期数：后端据此按「每期额度 × 期数」赠送新客额度，与追加天数同一口径。
        // 永久会员没有「期」的概念，固定 1 期
        options.multiplier = isLifetime ? 1 : multiplier;
      }

      if (requiresAmountInput && isAmountInputValid) {
        options.amountDisplay = amountInput.trim();
        if (trimmedSubAccountAmount) {
          options.subAccountAmountDisplay = trimmedSubAccountAmount;
        }
        if (Number.isFinite(parsedSubAccountCount)) {
          options.subAccountCount = parsedSubAccountCount;
        }
      }

      // 默认保持原档位；只有运营显式勾选才真的降档
      if (isDowngradePlan && confirmDowngradePlan) {
        options.confirmDowngradePlan = true;
      }

      await onConfirm(
        newLevel,
        selectedDuration === 'free' ? null : newExpiry,
        Object.keys(options).length > 0 ? options : undefined,
      );
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

  const selectedOption = durationOptions.find((option) => option.value === selectedDuration)!;

  /**
   * 确认页展示的赠送额度总额 = 每期额度 × 期数（年度 × 2 → 600 位新客），
   * 与后端「每期额度 × 期数」的发放口径一致；免费会员走清零文案。
   */
  const confirmQuotaText = useMemo(() => {
    if (isFree) return selectedOption.quotaText;
    return `${selectedOption.quotaPerPeriod * (isLifetime ? 1 : multiplier)} 位新客`;
  }, [isFree, isLifetime, multiplier, selectedOption]);

  const currentLevelLabel =
    currentLevel === 'free' ? '免费会员' :
    currentLevel === 'monthly' ? '月度会员' :
    currentLevel === 'quarterly' ? '季度会员' :
    currentLevel === 'annual' ? '年度会员' :
    '永久会员';

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="设置会员等级"
      onClick={(event) => {
        if (!isSubmitting && event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.sheet}>
        <div className={styles.dragHandle} aria-hidden="true" />

        <div className={styles.sheetHeader}>
          <div className={styles.sheetTitleWrap}>
            <div
              className={styles.sheetTitleIcon}
              style={{
                background: `linear-gradient(135deg, ${selectedOption.gradientFrom}, ${selectedOption.gradientTo})`,
                borderColor: `${selectedOption.color}40`,
                color: selectedOption.color,
              }}
              aria-hidden="true"
            >
              <IconStarBadge width={16} height={16} strokeWidth={2.2} />
            </div>
            <span className={styles.sheetTitle}>设置会员等级</span>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={step === 'confirm' ? () => setStep('select') : onClose}
            aria-label={step === 'confirm' ? '返回' : '关闭'}
            disabled={isSubmitting}
          >
            <IconClose />
          </button>
        </div>

        {step === 'select' ? (
          <SetMembershipSelectStep
            member={member}
            currentLevel={currentLevel}
            currentExpiry={currentExpiry}
            currentLevelLabel={currentLevelLabel}
            isCurrentLifetime={isCurrentLifetime}
            selectedDuration={selectedDuration}
            multiplier={multiplier}
            selectedOption={selectedOption}
            isLifetime={isLifetime}
            isFree={isFree}
            addedDays={addedDays}
            newExpiry={newExpiry}
            now={now}
            durationOptions={durationOptions}
            multiplierOptions={MULTIPLIER_OPTIONS}
            onDurationChange={setSelectedDuration}
            onMultiplierChange={setMultiplier}
            formatMembershipExpiry={formatMembershipExpiry}
            formatMembershipDaysLeft={formatMembershipDaysLeft}
            lifetimeMembershipDays={lifetimeMembershipDays}
          />
        ) : (
          <SetMembershipConfirmStep
            isLifetime={isLifetime}
            isFree={isFree}
            isCurrentLifetime={isCurrentLifetime}
            selectedOption={selectedOption}
            multiplier={multiplier}
            addedDays={addedDays}
            newExpiry={newExpiry}
            requiresAmountInput={requiresAmountInput}
            amountFieldLabel={amountFieldLabel}
            amountFieldPlaceholder={amountFieldPlaceholder}
            amountDefaultDisplay={amountDefaultDisplay}
            amountInput={amountInput}
            amountError={amountError}
            quotaText={confirmQuotaText}
            onAmountChange={handleAmountChange}
            formatMembershipExpiry={formatMembershipExpiry}
            subAccountCountInput={subAccountCountInput}
            subAccountAmountInput={subAccountAmountInput}
            subAccountAmountError={subAccountAmountError}
            onSubAccountCountChange={handleSubAccountCountChange}
            onSubAccountAmountChange={handleSubAccountAmountChange}
            pricingPreview={pricingPreview}
            isPreviewPending={isPreviewPending}
            isDowngradePlan={isDowngradePlan}
            confirmDowngradePlan={confirmDowngradePlan}
            onConfirmDowngradePlanChange={setConfirmDowngradePlan}
            countAsIncome={countAsIncome}
            onCountAsIncomeChange={setCountAsIncome}
          />
        )}

        <SetMembershipActionBar
          step={step}
          isSubmitting={isSubmitting}
          isSameAsNow={isSameAsNow}
          isLifetime={isLifetime}
          isFree={isFree}
          multiplier={multiplier}
          selectedOption={selectedOption}
          onCancel={step === 'confirm' ? () => setStep('select') : onClose}
          onConfirm={step === 'confirm' ? handleFinalConfirm : handleFirstConfirm}
          isConfirmDisabled={
            step === 'confirm' && requiresAmountInput
              ? Boolean(amountError || subAccountAmountError)
              : false
          }
        />
      </div>
    </div>
  );
};

export default SetMembershipModal;
