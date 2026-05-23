// 会员列表 / 会员详情模块 — 类型定义。

/** 会员状态。 */
export type MemberStatus = 'active' | 'inactive' | 'banned';

/** 会员等级。 */
export type MemberLevel = 'free' | 'monthly' | 'quarterly' | 'annual' | 'lifetime';

/** 会员订阅时长类型。 */
export type MembershipDuration = 'monthly' | 'quarterly' | 'annual' | 'lifetime';

/** 充值记录。 */
export interface RechargeRecord {
  id: string;
  /** 套餐名称。 */
  planName: string;
  /** 充值金额（分）。 */
  amount: number;
  /** 积分奖励。 */
  pointsAwarded: number;
  /** 支付渠道。 */
  channel: 'wechat' | 'alipay' | 'card' | 'manual';
  /** 充值时间。 */
  createdAt: number;
}

/** 会员详情。 */
export interface MemberDetail {
  /** 会员 id。 */
  id: string;
  /** 会员姓名。 */
  name: string;
  /** 会员手机号。 */
  phone: string;
  /** 头像文字（姓名首字）。 */
  avatarChar: string;
  /** 头像颜色索引 0-5。 */
  avatarColorIdx: number;
  /** 当前会员状态。 */
  status: MemberStatus;
  /** 当前会员等级。 */
  level: MemberLevel;
  /** 注册时间。 */
  registeredAt: number;
  /** 最近活跃时间。 */
  lastActiveAt: number;
  /** 当前积分余额。 */
  availablePoints: number;
  /** 历史累计积分。 */
  totalPointsEarned: number;
  /** 纯利豆余额。 */
  beanBalance: number;
  /** 是否是合伙人。 */
  isPartner: boolean;
  /** 合伙人等级。 */
  partnerLevel?: string;
  /** 累计充值金额（分）。 */
  totalRecharged: number;
  /** 充值次数。 */
  rechargeCount: number;
  /** 推广带来的新用户数。 */
  invitedCount: number;
  /** 充值记录。 */
  rechargeHistory: RechargeRecord[];
  /** 备注。 */
  remark?: string;
  /** 会员到期时间戳（永久会员为 null）。 */
  membershipExpiry?: number | null;
}

/** 会员列表项（轻量）。 */
export interface MemberListItem {
  /** 会员 id。 */
  id: string;
  /** 会员姓名。 */
  name: string;
  /** 会员手机号。 */
  phone: string;
  /** 头像文字。 */
  avatarChar: string;
  /** 头像颜色索引。 */
  avatarColorIdx: number;
  /** 当前会员状态。 */
  status: MemberStatus;
  /** 当前会员等级。 */
  level: MemberLevel;
  /** 当前积分余额。 */
  availablePoints: number;
  /** 当前纯利豆余额。 */
  beanBalance: number;
  /** 是否是合伙人。 */
  isPartner: boolean;
  /** 合伙人等级。 */
  partnerLevel?: string;
  /** 累计充值金额（分）。 */
  totalRecharged: number;
  /** 注册时间。 */
  registeredAt: number;
  /** 最近活跃时间。 */
  lastActiveAt: number;
  /** 邀请人数。 */
  invitedCount?: number;
  /** 充值次数。 */
  rechargeCount?: number;
  /** 备注信息。 */
  remark?: string;
  /** 会员到期时间戳（永久会员可能为 null）。 */
  membershipExpiry?: number | null;
}

/** 会员列表筛选状态。 */
export type MemberFilterStatus = 'all' | MemberStatus;
export type MemberFilterLevel = 'all' | MemberLevel;

/** 会员列表查询参数。 */
export interface MemberListQuery {
  /** 搜索关键词。 */
  keyword: string;
  /** 状态筛选。 */
  status: MemberFilterStatus;
  /** 等级筛选。 */
  level: MemberFilterLevel;
}

/** 会员列表统计概览。 */
export interface MemberListStats {
  /** 总会员数。 */
  totalCount: number;
  /** 活跃会员数。 */
  activeCount: number;
  /** 合伙人数。 */
  partnerCount: number;
  /** 封禁人数。 */
  bannedCount: number;
}

/** 会员状态同步事件载荷。 */
export interface MemberStatusSyncPayload {
  /** 会员 id。 */
  memberId: string;
  /** 变更后的会员状态。 */
  status: MemberStatus;
  /** 变更后的备注。 */
  remark?: string;
}
