// 会员模块后端响应结构（DTO）与类型守卫：只在 service 内部用于收窄 unknown 响应。
// 这里的 number 字段只是后端契约声明，进入领域模型前统一由映射层经 safeNum 归一。
import { isFiniteNumber, isPlainObject } from './memberList.normalize';

/** 后端充值 / 赠送记录行。 */
export interface PulseServerRechargeRecordLike {
  id: string;
  planName: string;
  amount: number;
  pointsAwarded: number;
  channel: string;
  createdAt: number;
}

/** 后端改价审计行（PulseRenewalPriceAdjustRecordDto）。 */
export interface PulseServerRenewalPriceAdjustRecordLike {
  id: string;
  planId?: string;
  planName?: string;
  oldPriceDisplay?: string | null;
  newPriceDisplay?: string | null;
  operatorName?: string | null;
  createdAt?: number;
}

/** 后端子账号额度变更审计行（PulseSubAccountQuotaRecordDto）。 */
export interface PulseServerSubAccountQuotaRecordLike {
  id: string;
  oldQuota?: number;
  newQuota?: number;
  operatorName?: string | null;
  reason?: string | null;
  createdAt?: number;
}

/** 后端会员列表行（PulseMemberListItemDto）。 */
export interface PulseServerMemberListItemLike {
  id: string;
  name: string;
  phone: string;
  avatarChar: string;
  avatarColorIdx: number;
  avatarUrl?: string;
  status: string;
  level: string;
  availablePoints: number;
  beanBalance: number;
  isPartner: boolean;
  totalRecharged: number;
  totalRechargedDisplay: string;
  registeredAt: number;
  lastActiveAt: number;
  /** 是否在线（后端按「最近 10 分钟内有鉴权请求」判定）。 */
  isOnline?: boolean;
  partnerLevel?: string;
  invitedCount?: number;
  rechargeCount?: number;
  remark?: string;
  membershipExpiry?: number | null;
  expireAt?: number | null;
  membershipExpireAt?: number | null;
  /** 续费价是否被调整过（曾经调过即 true，后端以改价审计判定）。 */
  renewalPriceAdjusted?: boolean;
}

/** 后端首购锁定价快照行。 */
export interface PulseServerLockedPriceLike {
  planId?: string;
  price?: number;
  priceDisplay?: string;
  subAccountAmountDisplay?: string | null;
  subAccountCount?: number | null;
  source?: string;
  lockedAt?: number;
}

/** 后端会员详情（PulseMemberDetailDto）。 */
export interface PulseServerMemberDetailLike extends PulseServerMemberListItemLike {
  totalPointsEarned: number;
  rechargeHistory: PulseServerRechargeRecordLike[];
  /** 管理端「设置会员等级」次数与记录（后端 PulseMemberDetailDto）。 */
  adminGrantCount?: number;
  adminGrantHistory?: PulseServerRechargeRecordLike[];
  /** 「调整续费价格」次数与记录（后端 PulseMemberDetailDto）。 */
  renewalPriceAdjustCount?: number;
  renewalPriceAdjustHistory?: PulseServerRenewalPriceAdjustRecordLike[];
  /** 「子账号设置」次数与记录（后端 PulseMemberDetailDto）。 */
  subAccountQuotaRecordCount?: number;
  subAccountQuotaRecordHistory?: PulseServerSubAccountQuotaRecordLike[];
  /** 首购锁定价快照（后端 PulseMemberDetailDto.lockedPrices）。 */
  lockedPrices?: PulseServerLockedPriceLike[];
}

/** 后端会员列表分页响应（PulseMembersResponseDto）。 */
export interface PulseServerMembersResponseLike {
  items: PulseServerMemberListItemLike[];
  total: number;
  stats?: Record<string, unknown>;
  summary?: Record<string, unknown>;
  totalCount?: number;
  activeCount?: number;
  normalCount?: number;
  inactiveCount?: number;
  dormantCount?: number;
  partnerCount?: number;
  bannedCount?: number;
  disabledCount?: number;
}

/** 充值记录守卫。 */
export const isServerRechargeRecordLike = (value: unknown): value is PulseServerRechargeRecordLike => (
  isPlainObject(value)
  && typeof value.id === 'string'
  && typeof value.planName === 'string'
  && isFiniteNumber(value.amount)
  && isFiniteNumber(value.pointsAwarded)
  && typeof value.channel === 'string'
  && isFiniteNumber(value.createdAt)
);

/** 会员列表行守卫。 */
export const isServerMemberListItemLike = (value: unknown): value is PulseServerMemberListItemLike => (
  isPlainObject(value)
  && typeof value.id === 'string'
  && typeof value.name === 'string'
  && typeof value.phone === 'string'
  && typeof value.avatarChar === 'string'
  && isFiniteNumber(value.avatarColorIdx)
  && typeof value.status === 'string'
  && typeof value.level === 'string'
  && isFiniteNumber(value.availablePoints)
  && isFiniteNumber(value.beanBalance)
  && typeof value.isPartner === 'boolean'
  && isFiniteNumber(value.totalRecharged)
  && typeof value.totalRechargedDisplay === 'string'
  && isFiniteNumber(value.registeredAt)
  && isFiniteNumber(value.lastActiveAt)
);

/** 会员详情守卫：在列表行基础上校验详情专属字段。 */
export const isServerMemberDetailLike = (value: unknown): value is PulseServerMemberDetailLike => {
  if (!isServerMemberListItemLike(value)) {
    return false;
  }

  const candidate = value as Partial<PulseServerMemberDetailLike>;

  return isFiniteNumber(candidate.totalPointsEarned)
    && Array.isArray(candidate.rechargeHistory)
    && candidate.rechargeHistory.every((item) => isServerRechargeRecordLike(item));
};

/** 会员列表分页响应守卫。 */
export const isServerMembersResponseLike = (value: unknown): value is PulseServerMembersResponseLike => (
  isPlainObject(value)
  && Array.isArray(value.items)
  && isFiniteNumber(value.total)
  && value.items.every((item) => isServerMemberListItemLike(item))
);
