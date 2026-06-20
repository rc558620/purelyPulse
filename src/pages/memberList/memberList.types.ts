// 会员列表 / 会员详情模块 — 类型定义。

/** 会员状态。 */
export type MemberStatus = 'active' | 'inactive' | 'banned';

// ─── 子账号类型 ────────────────────────────────────────────────────────────

/** 子账号角色类型。 */
export type SubAccountRole = 'cashier' | 'finance' | 'manager';

/** 子账号状态。 */
export type SubAccountStatus = 'active' | 'inactive' | 'disabled';

/** 子账号角色摘要（平台视角）。 */
export interface SubAccountRoleSummary {
  /** 子账号槽位序号（1~10）。 */
  slot: number;
  /** 子账号角色。 */
  role: SubAccountRole;
  /** 当前状态。 */
  status: SubAccountStatus;
  /** 是否已分配给员工。 */
  isAssigned: boolean;
}

/** 子账号能力快照（会员详情中的平台侧展示字段）。 */
export interface SubAccountCapability {
  /** 当前门店配置的子账号额度（0 = 未启用）。 */
  subAccountQuota: number;
  /** 该商家是否具备配置子账号的资格（年/永久会员）。 */
  subAccountEligible: boolean;
  /** 子账号能力是否实际开启（quota > 0 且有资格）。 */
  subAccountCapabilityEnabled: boolean;
  /** 子账号额度上限（有资格时为 10，否则为 0）。 */
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

// ─── purelyClub C 端会员运营数据 ──────────────────────────────────────────

/** C 端会员等级（purelyClub 储值会员分层）。 */
export type ClubMemberLevel = 'free' | 'gold' | 'platinum' | 'diamond';

/** C 端各等级会员数量分布。 */
export interface ClubMemberLevelBreakdown {
  /** 免费会员数量。 */
  free: number;
  /** 黄金会员数量。 */
  gold: number;
  /** 铂金会员数量。 */
  platinum: number;
  /** 钻石会员数量。 */
  diamond: number;
}

/** 该商家在 purelyClub 的会员运营统计（owner 视角）。 */
export interface ClubMemberStats {
  /** 顾客在途余额合计（分），即全部顾客当前储值余额之和。 */
  pendingBalanceFen: number;
  /** 会员充值总金额（分）。 */
  totalRechargeFen: number;
  /** 会员用户总数。 */
  totalMemberCount: number;
  /** 累计充值笔数。 */
  rechargeCount: number;
  /** 今日储值金额（分）。 */
  todayRechargeFen: number;
  /** 本月储值金额（分）。 */
  monthRechargeFen: number;
  /** 本季储值金额（分）。 */
  quarterRechargeFen: number;
  /** 本年储值金额（分）。 */
  yearRechargeFen: number;
  /** 去年储值金额（分）。 */
  lastYearRechargeFen: number;
  /** 各等级会员数量分布。 */
  levelBreakdown: ClubMemberLevelBreakdown;
}

// ─── 会员营业详情：销售额与利润数据 ────────────────────────────────────────────

/** 单周期销售/利润数据点。 */
export interface SalesPeriodDataPoint {
  /** 时间标签（如"周一"、"1月"等）。 */
  label: string;
  /** 销售额（分）。 */
  salesFen: number;
  /** 利润（分）。 */
  profitFen: number;
}

/** 销售统计时间维度类型。 */
export type SalesPeriodType = 'today' | 'week' | 'month' | 'year' | 'lastYear';

/** 单维度销售汇总。 */
export interface SalesPeriodSummary {
  /** 时间维度。 */
  period: SalesPeriodType;
  /** 销售总额（分）。 */
  totalSalesFen: number;
  /** 利润总额（分）。 */
  totalProfitFen: number;
  /** 销售额环比增幅（百分比，null = 无数据）。 */
  salesGrowthPct: number | null;
  /** 利润环比增幅（百分比，null = 无数据）。 */
  profitGrowthPct: number | null;
  /** 各时间点明细（今日=小时，本周=天，本月=天，今年/去年=月）。 */
  dataPoints: SalesPeriodDataPoint[];
}

/** 该商家的营业详情统计（owner 视角，含 5 个周期）。 */
export interface MemberSalesStats {
  /** 今日数据。 */
  today: SalesPeriodSummary;
  /** 本周数据。 */
  week: SalesPeriodSummary;
  /** 本月数据。 */
  month: SalesPeriodSummary;
  /** 今年数据。 */
  year: SalesPeriodSummary;
  /** 去年数据。 */
  lastYear: SalesPeriodSummary;
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
