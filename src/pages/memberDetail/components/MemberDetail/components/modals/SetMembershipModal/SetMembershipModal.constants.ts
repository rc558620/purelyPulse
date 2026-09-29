// SetMembershipModal 常量：档位 / 期数选项与各类上下限。
import type { MemberLevel } from '@pages/memberList/memberList.types';
import type { DurationOption, MultiplierOption } from './SetMembershipModal.types';

export const DAY_MS = 86_400_000;

export const BASE_DURATION_OPTIONS: DurationOption[] = [
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

export const MULTIPLIER_OPTIONS: MultiplierOption[] = [
  { value: 1, label: '× 1' },
  { value: 2, label: '× 2' },
  { value: 3, label: '× 3' },
  { value: 6, label: '× 6' },
  { value: 12, label: '× 12' },
];

/** 会员档位高低，仅用于判断本次选择是否属于「降档」 */
export const LEVEL_RANK: Record<string, number> = {
  free: 0,
  monthly: 1,
  quarterly: 2,
  annual: 3,
  lifetime: 4,
};

/** 档位展示名，用于「当前：xxx」与降级提示 */
export const MEMBERSHIP_LEVEL_LABELS: Record<MemberLevel, string> = {
  free: '免费会员',
  monthly: '月度会员',
  quarterly: '季度会员',
  annual: '年度会员',
  lifetime: '永久会员',
};

/** 子账号数量上限，与后端 DTO 的 @Max(10) 保持一致 */
export const SUB_ACCOUNT_COUNT_MAX = 10;
