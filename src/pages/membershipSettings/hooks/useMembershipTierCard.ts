// 会员套餐卡片 Hook：收敛输入清洗、校验与保存状态管理。
import { useCallback, useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { showToast } from '@components/ui/feedback/Toast';
import { safeNum } from '@utils/utils';
import type {
  MembershipTierConfig,
  TierValue,
  UseMembershipTierCardResult,
} from '../membershipSettings.types';

const sanitizePriceInput = (value: string): string => {
  const cleanedValue = value.replace(/[^\d.]/g, '');
  const parts = cleanedValue.split('.');

  if (parts.length > 2) {
    return `${parts[0]}.${parts.slice(1).join('')}`;
  }

  if (parts[1] !== undefined && parts[1].length > 2) {
    return `${parts[0]}.${parts[1].slice(0, 2)}`;
  }

  return cleanedValue;
};

const sanitizeDaysInput = (value: string): string => value.replace(/\D/g, '').slice(0, 5);

const validateTierValue = (
  config: MembershipTierConfig,
  value: TierValue,
): string | null => {
  const priceText = value.price.trim();
  const priceValue = safeNum(Number.parseFloat(priceText), -1);

  if (!priceText) {
    return `请输入${config.label}价格`;
  }

  if (priceValue < 0) {
    return `${config.label}价格格式不正确`;
  }

  if (config.id !== 'lifetime') {
    return null;
  }

  const daysText = (value.lifetimeDays ?? '').trim();
  const daysValue = safeNum(Number.parseInt(daysText, 10), -1);

  if (!daysText) {
    return '请输入永久会员有效期（天）';
  }

  if (daysValue <= 0) {
    return '永久会员有效期必须大于 0 天';
  }

  return null;
};

const isTierValueDirty = (currentValue: TierValue, savedValue: TierValue): boolean =>
  currentValue.price !== savedValue.price ||
  (currentValue.lifetimeDays ?? '') !== (savedValue.lifetimeDays ?? '');

const clearSavedTimer = (savedTimerRef: MutableRefObject<number | null>): void => {
  if (savedTimerRef.current !== null) {
    window.clearTimeout(savedTimerRef.current);
    savedTimerRef.current = null;
  }
};

export const useMembershipTierCard = (
  config: MembershipTierConfig,
  initialValue: TierValue,
  onSaveValue: (tierId: MembershipTierConfig['id'], value: TierValue) => Promise<TierValue>,
): UseMembershipTierCardResult => {
  const [value, setValue] = useState<TierValue>(() => ({ ...initialValue }));
  const [savedValue, setSavedValue] = useState<TierValue>(() => ({ ...initialValue }));
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const savedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    clearSavedTimer(savedTimerRef);
    const nextValue = { ...initialValue };
    setValue(nextValue);
    setSavedValue(nextValue);
    setJustSaved(false);
  }, [initialValue]);

  useEffect(() => {
    return () => {
      clearSavedTimer(savedTimerRef);
    };
  }, []);

  const handlePriceChange = useCallback((rawValue: string): void => {
    const nextPrice = sanitizePriceInput(rawValue);
    clearSavedTimer(savedTimerRef);
    setJustSaved(false);
    setValue((previousValue) => {
      if (previousValue.price === nextPrice) {
        return previousValue;
      }

      return {
        ...previousValue,
        price: nextPrice,
      };
    });
  }, []);

  const handleDaysChange = useCallback((rawValue: string): void => {
    const nextLifetimeDays = sanitizeDaysInput(rawValue);
    clearSavedTimer(savedTimerRef);
    setJustSaved(false);
    setValue((previousValue) => {
      if ((previousValue.lifetimeDays ?? '') === nextLifetimeDays) {
        return previousValue;
      }

      return {
        ...previousValue,
        lifetimeDays: nextLifetimeDays,
      };
    });
  }, []);

  const handleSave = useCallback(async (): Promise<void> => {
    const validationMessage = validateTierValue(config, value);

    if (validationMessage) {
      showToast({ message: validationMessage, type: 'error' });
      return;
    }

    setIsSaving(true);

    try {
      const nextSavedValue = await onSaveValue(config.id, value);
      setValue(nextSavedValue);
      setSavedValue(nextSavedValue);
      setJustSaved(true);
      showToast({ message: `${config.label}已保存`, type: 'success' });

      clearSavedTimer(savedTimerRef);

      savedTimerRef.current = window.setTimeout(() => {
        setJustSaved(false);
      }, 3000);
    } catch {
      showToast({ message: '保存失败，请稍后重试', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  }, [config, onSaveValue, value]);

  return {
    value,
    savedValue,
    isDirty: isTierValueDirty(value, savedValue),
    isSaving,
    justSaved,
    handlePriceChange,
    handleDaysChange,
    handleSave,
  };
};
