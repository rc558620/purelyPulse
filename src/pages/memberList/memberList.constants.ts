// 会员列表 / 详情模块共享展示常量。
import type { MemberLevel, MemberStatus } from './memberList.types';

export type PaidMemberLevel = Exclude<MemberLevel, 'free'>;

/** 会员等级显示映射。 */
export const LEVEL_LABEL: Record<MemberLevel, string> = {
  free: '免费',
  monthly: '月卡',
  quarterly: '季卡',
  annual: '年卡',
  lifetime: '永久',
};

/** 会员状态显示映射。 */
export const STATUS_LABEL: Record<MemberStatus, string> = {
  active: '正常',
  inactive: '未活跃',
  banned: '已封禁',
  cancelled: '已注销',
};

/** 会员头像背景色表。 */
export const AVATAR_COLORS = [
  'linear-gradient(135deg, #84cc16, #4ade80)',
  'linear-gradient(135deg, #3b82f6, #60a5fa)',
  'linear-gradient(135deg, #a855f7, #c084fc)',
  'linear-gradient(135deg, #f59e0b, #fbbf24)',
  'linear-gradient(135deg, #10b981, #34d399)',
  'linear-gradient(135deg, #f43f5e, #fb7185)',
] as const;

/** 会员状态变更后的跨页面同步事件名。 */
export const MEMBER_STATUS_SYNC_EVENT = 'member-status-sync';

/** 会员注销后的跨页面同步事件名。 */
export const MEMBER_CANCEL_SYNC_EVENT = 'member-cancel-sync';

/** 会员等级设置产生收入后的跨页面同步事件名。 */
export const MEMBERSHIP_REVENUE_SYNC_EVENT = 'membership-revenue-sync';

/** 会员等级设置对应的前端收入配置。 */
export const MEMBERSHIP_REVENUE_CONFIG: Record<PaidMemberLevel, {
  planName: string;
  revenueTypeLabel: string;
  /** 金额展示值（后端直接返回，前端不再分转元）。 */
  amountDisplay: string;
}> = {
  monthly: {
    planName: '月度会员',
    revenueTypeLabel: '月卡会员',
    amountDisplay: '38',
  },
  quarterly: {
    planName: '季度会员',
    revenueTypeLabel: '季度会员',
    amountDisplay: '99',
  },
  annual: {
    planName: '年度会员',
    revenueTypeLabel: '年卡会员',
    amountDisplay: '369',
  },
  lifetime: {
    planName: '永久会员',
    revenueTypeLabel: '永久会员',
    amountDisplay: '398',
  },
};
