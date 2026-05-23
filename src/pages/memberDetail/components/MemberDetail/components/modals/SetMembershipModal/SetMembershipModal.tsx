/**
 * SetMembershipModal —— 设置会员订阅级别弹窗
 *
 * 功能：
 *  - 选择会员类型：免费 / 月度 / 季度 / 年度 / 永久
 *  - 非永久 & 非免费会员：追加时间（多选期数）
 *  - 永久会员可降级回月度/季度/年度（设置具体时长）
 *  - 实时预览到期日期
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { IconClose, IconStarBadge } from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
import SetMembershipActionBar from './components/SetMembershipActionBar/SetMembershipActionBar';
import SetMembershipConfirmStep from './components/SetMembershipConfirmStep/SetMembershipConfirmStep';
import SetMembershipSelectStep from './components/SetMembershipSelectStep/SetMembershipSelectStep';
import type { MemberDetail, MemberLevel, MembershipDuration } from '@pages/memberList/memberList.types';
import styles from './SetMembershipModal.module.less';

export interface SetMembershipModalProps {
  member: MemberDetail;
  currentLevel: MemberLevel;
  currentExpiry: number | null | undefined;
  lifetimeMembershipDays: number;
  lifetimeMembershipAmountFen: number;
  onClose: () => void;
  onConfirm: (newLevel: MemberLevel, newExpiry: number | null, options?: { amountFen?: number }) => Promise<void> | void;
}

/** 弹窗内部使用的选择类型，扩展了 free */
export type ModalMembershipSelection = MembershipDuration | 'free';

const BASE_DURATION_OPTIONS: {
  value: ModalMembershipSelection;
  label: string;
  shortLabel: string;
  desc: string;
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

const formatAmountInputFromFen = (amountFen: number): string => {
  const amountYuan = amountFen / 100;
  return Number.isInteger(amountYuan) ? String(amountYuan) : amountYuan.toFixed(2);
};

const parseAmountInputToFen = (value: string): number | null => {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return null;
  }

  if (!/^\d+(\.\d{0,2})?$/.test(normalizedValue)) {
    return null;
  }

  const amountYuan = Number(normalizedValue);
  if (!Number.isFinite(amountYuan) || amountYuan <= 0) {
    return null;
  }

  return Math.round(amountYuan * 100);
};

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
  currentLevel,
  currentExpiry,
  lifetimeMembershipDays,
  lifetimeMembershipAmountFen,
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

  const [selectedDuration, setSelectedDuration] = useState<ModalMembershipSelection>(defaultDuration);
  const [multiplier, setMultiplier] = useState(1);
  const [step, setStep] = useState<'select' | 'confirm'>('select');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lifetimeAmountInput, setLifetimeAmountInput] = useState<string>(() => formatAmountInputFromFen(lifetimeMembershipAmountFen));

  const isFree = selectedDuration === 'free';
  const isLifetime = selectedDuration === 'lifetime';

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

  const lifetimeAmountFen = useMemo(() => (
    selectedDuration === 'lifetime' ? parseAmountInputToFen(lifetimeAmountInput) : null
  ), [lifetimeAmountInput, selectedDuration]);

  const lifetimeAmountError = useMemo(() => {
    if (selectedDuration !== 'lifetime') {
      return '';
    }
    if (!lifetimeAmountInput.trim()) {
      return '请输入永久会员价格';
    }
    if (lifetimeAmountFen === null) {
      return '请输入有效价格，最多保留 2 位小数';
    }
    return '';
  }, [lifetimeAmountFen, lifetimeAmountInput, selectedDuration]);

  useEffect(() => {
    setLifetimeAmountInput(formatAmountInputFromFen(lifetimeMembershipAmountFen));
  }, [lifetimeMembershipAmountFen]);

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
      await Promise.resolve(onConfirm(
        newLevel,
        selectedDuration === 'free' ? null : newExpiry,
        selectedDuration === 'lifetime' && lifetimeAmountFen !== null ? { amountFen: lifetimeAmountFen } : undefined,
      ));
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, lifetimeAmountFen, newExpiry, onClose, onConfirm, selectedDuration]);

  const selectedOption = durationOptions.find((option) => option.value === selectedDuration)!;

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
            lifetimeAmountInput={lifetimeAmountInput}
            lifetimeAmountError={lifetimeAmountError}
            onLifetimeAmountChange={setLifetimeAmountInput}
            formatMembershipExpiry={formatMembershipExpiry}
            lifetimeMembershipAmountFen={lifetimeMembershipAmountFen}
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
          isConfirmDisabled={step === 'confirm' && isLifetime ? Boolean(lifetimeAmountError) : false}
        />
      </div>
    </div>
  );
};

export default SetMembershipModal;
