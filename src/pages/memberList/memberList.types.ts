// ─── 会员列表 / 会员详情模块 — 类型定义 ──────────────────────────────

/** 会员状态 */
export type MemberStatus = 'active' | 'inactive' | 'banned';

/** 会员等级 */
export type MemberLevel = 'free' | 'monthly' | 'quarterly' | 'annual';

/** 充值记录 */
export interface RechargeRecord {
  id: string;
  /** 套餐名称 */
  planName: string;
  /** 充值金额（分） */
  amount: number;
  /** 积分奖励 */
  pointsAwarded: number;
  /** 支付渠道 */
  channel: 'wechat' | 'alipay' | 'card';
  createdAt: number;
}

/** 会员详情 */
export interface MemberDetail {
  id: string;
  name: string;
  phone: string;
  /** 头像文字（姓名首字）*/
  avatarChar: string;
  /** 头像颜色索引 0-5 */
  avatarColorIdx: number;
  status: MemberStatus;
  level: MemberLevel;
  /** 注册时间 */
  registeredAt: number;
  /** 最近活跃时间 */
  lastActiveAt: number;
  /** 当前积分余额 */
  availablePoints: number;
  /** 历史累计积分 */
  totalPointsEarned: number;
  /** 纯利豆余额 */
  beanBalance: number;
  /** 是否是合伙人 */
  isPartner: boolean;
  /** 合伙人等级 */
  partnerLevel?: string;
  /** 累计充值金额（分） */
  totalRecharged: number;
  /** 充值次数 */
  rechargeCount: number;
  /** 推广带来的新用户数 */
  invitedCount: number;
  /** 充值记录 */
  rechargeHistory: RechargeRecord[];
  /** 备注 */
  remark?: string;
}

/** 会员列表项（轻量） */
export interface MemberListItem {
  id: string;
  name: string;
  phone: string;
  avatarChar: string;
  avatarColorIdx: number;
  status: MemberStatus;
  level: MemberLevel;
  availablePoints: number;
  beanBalance: number;
  isPartner: boolean;
  totalRecharged: number;
  registeredAt: number;
  lastActiveAt: number;
}

/** 会员列表筛选状态 */
export type MemberFilterStatus = 'all' | MemberStatus;
export type MemberFilterLevel = 'all' | MemberLevel;
