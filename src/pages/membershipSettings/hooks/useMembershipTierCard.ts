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
  const dotIndex = cleanedValue.indexOf('.');

  // 无小数点，直接返回
  if (dotIndex === -1) {
    return cleanedValue;
  }

  // 只保留第一个小数点，后续小数点全部移除
  const integerPart = cleanedValue.slice(0, dotIndex + 1);
  const decimalPart = cleanedValue.slice(dotIndex + 1).replace(/\./g, '').slice(0, 2);

  return `${integerPart}${decimalPart}`;
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

  // BUG-01 修复：用 ref 标记是否正在保存，防止闭包读取过期的 isSaving
  const isSavingRef = useRef(false);

  // BUG-02 修复：用 ref 持有最新的 value，避免闭包捕获旧值
  const valueRef = useRef(value);

  // BUG-10 修复：用 ref 标记是否为保存成功触发的 initialValue 更新
  const isSaveTriggeredUpdateRef = useRef(false);

  useEffect(() => {
    // 同步 valueRef，保证事件处理函数中读到的值最新
    valueRef.current = value;
  });

  useEffect(() => {
    // BUG-10 修复：如果是保存成功触发的更新，不清除 justSaved
    if (isSaveTriggeredUpdateRef.current) {
      isSaveTriggeredUpdateRef.current = false;
      setValue({ ...initialValue });
      setSavedValue({ ...initialValue });
      return;
    }

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
    // BUG-01 修复：用 ref 防止重复提交
    if (isSavingRef.current) {
      return;
    }

    const currentValue = valueRef.current;
    const validationMessage = validateTierValue(config, currentValue);

    if (validationMessage) {
      showToast({ message: validationMessage, type: 'error' });
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);

    try {
      const nextSavedValue = await onSaveValue(config.id, currentValue);
      setValue(nextSavedValue);
      setSavedValue(nextSavedValue);
      setJustSaved(true);
      showToast({ message: `${config.label}已保存`, type: 'success' });

      // BUG-10 修复：标记后续的 initialValue 更新是保存触发的
      isSaveTriggeredUpdateRef.current = true;

      clearSavedTimer(savedTimerRef);

      savedTimerRef.current = window.setTimeout(() => {
        setJustSaved(false);
      }, 3000);
    } catch {
      // BUG-06 修复：保存失败时不更新 value/savedValue，保持 isDirty 为 true，允许重试
      showToast({ message: '保存失败，请稍后重试', type: 'error' });
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [config, onSaveValue]);

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
