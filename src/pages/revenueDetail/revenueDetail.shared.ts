// 充值收入明细页共享配置：统一沉淀筛选项、类型色板与 tone class 映射。
import styles from './revenueDetail.module.less';
import type { RevenuePeriod } from './revenueDetail.types';

export type RevenueToneClassName =
  | 'toneOrange'
  | 'toneLime'
  | 'toneEmerald'
  | 'toneIndigo'
  | 'toneAmber'
  | 'toneSlate';

export interface RevenueTypeMeta {
  color: string;
  tone: RevenueToneClassName;
}

export const REVENUE_TAB_OPTIONS: ReadonlyArray<{ value: RevenuePeriod; label: string }> = [
  { value: 'today', label: '今日' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'season', label: '本季' },
];

const REVENUE_TONE_CLASS_MAP: Record<RevenueToneClassName, string> = {
  toneOrange: styles.toneOrange,
  toneLime: styles.toneLime,
  toneEmerald: styles.toneEmerald,
  toneIndigo: styles.toneIndigo,
  toneAmber: styles.toneAmber,
  toneSlate: styles.toneSlate,
};

const REVENUE_TYPE_META_MAP: Record<string, RevenueTypeMeta> = {
  月卡会员: {
    color: '#84cc16',
    tone: 'toneLime',
  },
  季度会员: {
    color: '#10b981',
    tone: 'toneEmerald',
  },
  年卡会员: {
    color: '#6366f1',
    tone: 'toneIndigo',
  },
  永久会员: {
    color: '#a855f7',
    tone: 'toneOrange',
  },
  其他充值: {
    color: '#f59e0b',
    tone: 'toneAmber',
  },
};

export const getRevenueToneClassName = (tone: RevenueToneClassName): string => (
  REVENUE_TONE_CLASS_MAP[tone]
);

export const getRevenueTypeMeta = (label: string): RevenueTypeMeta => (
  REVENUE_TYPE_META_MAP[label] ?? {
    color: '#94a3b8',
    tone: 'toneSlate',
  }
);
