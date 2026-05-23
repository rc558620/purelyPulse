// 会员设置页面常量：统一维护套餐配置与默认初始值。
import {
  IconMembershipLifetime,
  IconMembershipMonthly,
  IconMembershipQuarterly,
  IconMembershipYearly,
} from './components/MembershipSettingsIcons/MembershipSettingsIcons';
import type { MembershipTierConfig, MembershipTierValuesMap, TierId, TierValue } from './membershipSettings.types';

export const MEMBERSHIP_TIER_CONFIGS: MembershipTierConfig[] = [
  {
    id: 'monthly',
    label: '月度会员',
    sublabel: '按月订阅',
    icon: IconMembershipMonthly,
    tone: 'blue',
  },
  {
    id: 'quarterly',
    label: '季度会员',
    sublabel: '按季订阅',
    icon: IconMembershipQuarterly,
    tone: 'purple',
  },
  {
    id: 'yearly',
    label: '年度会员',
    sublabel: '按年订阅',
    icon: IconMembershipYearly,
    tone: 'amber',
  },
  {
    id: 'lifetime',
    label: '永久会员',
    sublabel: '一次性购买',
    icon: IconMembershipLifetime,
    tone: 'rose',
  },
];

export const MEMBERSHIP_TIER_DEFAULT_VALUES: MembershipTierValuesMap = {
  monthly: { price: '38' },
  quarterly: { price: '99' },
  yearly: { price: '369' },
  lifetime: {
    price: '398',
    lifetimeDays: '730',
  },
};

export const MEMBERSHIP_TIER_DEFAULT_VALUE_BY_ID: Record<TierId, TierValue> = MEMBERSHIP_TIER_DEFAULT_VALUES;
