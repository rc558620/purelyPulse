// 会员套餐配置 hook：拉取永久会员有效天数与年度 / 永久会员默认价格。
import { useEffect, useRef, useState } from 'react';
import { MEMBERSHIP_TIER_DEFAULT_VALUES } from '../../membershipSettings/membershipSettings.constants';
import { fetchMembershipSettings } from '../../membershipSettings/membershipSettings.service';

export interface UseMemberDetailMembershipSettingsReturn {
  /** 永久会员当前有效天数配置。 */
  lifetimeMembershipDays: number;
  /** 永久会员当前价格展示值（后端直接返回，前端不再分转元）。 */
  lifetimeMembershipAmountDisplay: string;
  /** 年度会员当前价格展示值（后端直接返回，前端不再分转元）。 */
  annualMembershipAmountDisplay: string;
}

const DEFAULT_LIFETIME_MEMBERSHIP_DAYS = Number.parseInt(MEMBERSHIP_TIER_DEFAULT_VALUES.lifetime.lifetimeDays ?? '730', 10);
const DEFAULT_LIFETIME_MEMBERSHIP_AMOUNT_DISPLAY = MEMBERSHIP_TIER_DEFAULT_VALUES.lifetime.price || '398';
const DEFAULT_ANNUAL_MEMBERSHIP_AMOUNT_DISPLAY = MEMBERSHIP_TIER_DEFAULT_VALUES.yearly.price || '369';

const normalizeLifetimeMembershipDays = (value: string | undefined): number => {
  const parsedValue = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return DEFAULT_LIFETIME_MEMBERSHIP_DAYS;
  }

  return parsedValue;
};

/** 归一化套餐价格展示值：非法或空值回落到默认配置价。 */
const normalizeMembershipAmountDisplay = (value: string, fallbackValue: string): string => {
  const trimmedValue = value?.trim();
  if (!trimmedValue) {
    return fallbackValue;
  }

  const parsedValue = Number.parseFloat(trimmedValue);
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return fallbackValue;
  }

  return trimmedValue;
};

const normalizeLifetimeMembershipAmountDisplay = (value: string): string => (
  normalizeMembershipAmountDisplay(value, DEFAULT_LIFETIME_MEMBERSHIP_AMOUNT_DISPLAY)
);

const normalizeAnnualMembershipAmountDisplay = (value: string): string => (
  normalizeMembershipAmountDisplay(value, DEFAULT_ANNUAL_MEMBERSHIP_AMOUNT_DISPLAY)
);

/** 会员套餐配置 hook。 */
export const useMemberDetailMembershipSettings = (): UseMemberDetailMembershipSettingsReturn => {
  const [lifetimeMembershipDays, setLifetimeMembershipDays] = useState<number>(DEFAULT_LIFETIME_MEMBERSHIP_DAYS);
  const [lifetimeMembershipAmountDisplay, setLifetimeMembershipAmountDisplay] = useState<string>(DEFAULT_LIFETIME_MEMBERSHIP_AMOUNT_DISPLAY);
  const [annualMembershipAmountDisplay, setAnnualMembershipAmountDisplay] = useState<string>(DEFAULT_ANNUAL_MEMBERSHIP_AMOUNT_DISPLAY);

  const membershipSettingsRequestIdRef = useRef<number>(0);

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
        setLifetimeMembershipAmountDisplay(normalizeLifetimeMembershipAmountDisplay(response.lifetime.price));
        setAnnualMembershipAmountDisplay(normalizeAnnualMembershipAmountDisplay(response.yearly.price));
      } catch {
        if (currentRequestId !== membershipSettingsRequestIdRef.current) {
          return;
        }

        setLifetimeMembershipDays(DEFAULT_LIFETIME_MEMBERSHIP_DAYS);
        setLifetimeMembershipAmountDisplay(DEFAULT_LIFETIME_MEMBERSHIP_AMOUNT_DISPLAY);
        setAnnualMembershipAmountDisplay(DEFAULT_ANNUAL_MEMBERSHIP_AMOUNT_DISPLAY);
      }
    };

    void loadMembershipSettings();
  }, []);

  return {
    lifetimeMembershipDays,
    lifetimeMembershipAmountDisplay,
    annualMembershipAmountDisplay,
  };
};
