// 会员列表 / 会员详情模块 — 类型定义。

/** 会员状态。 */
export type MemberStatus = 'active' | 'inactive' | 'banned';

// ─── 子账号类型 ────────────────────────────────────────────────────────────

/** 子账号角色类型。 */
export type SubAccountRole = 'cashier' | 'finance';

/** 子账号状态。 */
export type SubAccountStatus = 'active' | 'inactive' | 'disabled';

/** 子账号角色摘要（平台视角）。 */
export interface SubAccountRoleSummary {
  /** 子账号槽位序号（1~7）。 */
  slot: number;
  /** 子账号角色。 */
  role: SubAccountRole;
  /** 当前状态。 */
  status: SubAccountStatus;
  /** 是否已分配给员工。 */
  isAssigned: boolean;
  /** 平台为该子账号分配的登录账号（手机号或自定义用户名）。留空表示不修改。 */
  username?: string;
  /** 平台为该子账号设置的登录密码（明文；提交后由后端加密存储）。留空表示不修改。 */
  password?: string;
}

/** 子账号能力快照（会员详情中的平台侧展示字段）。 */
export interface SubAccountCapability {
  /** 当前门店配置的子账号额度（0 = 未启用）。 */
  subAccountQuota: number;
  /** 该商家是否具备配置子账号的资格（年/永久会员）。 */
  subAccountEligible: boolean;
  /** 子账号能力是否实际开启（quota > 0 且有资格）。 */
  subAccountCapabilityEnabled: boolean;
  /** 子账号额度上限（有资格时为 7，否则为 0）。 */
  subAccountQuotaMax: number;
  /** 已使用的子账号槽位数。 */
  subAccountsUsedCount: number;
  /** 剩余可分配的子账号槽位数。 */
  subAccountsAvailableCount: number;
  /** 子账号角色分配摘要。 */
  subAccountRoleSummary: SubAccountRoleSummary[];
}

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
  /** 子账号能力快照（平台侧）。 */
  subAccountCapability?: SubAccountCapability;
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
