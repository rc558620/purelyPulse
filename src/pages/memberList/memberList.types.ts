// 会员列表 / 会员详情模块 — 类型定义。
// 定价与统计两类子类型定义在 memberList.pricing.types.ts / memberList.stats.types.ts，
// 消费方按语义直连对应文件，此处不做再导出。
// 说明：类型中的 number 字段是后端契约，进入 UI 前统一由映射层经 safeNum 归一。
import type { MemberLockedPrice, MemberRenewalPriceAdjustRecord } from './memberList.pricing.types';

/** 会员状态。 */
export type MemberStatus = 'active' | 'inactive' | 'banned' | 'cancelled';

/** 会员等级。 */
export type MemberLevel = 'free' | 'monthly' | 'quarterly' | 'annual' | 'lifetime';

/** 会员订阅时长类型。 */
export type MembershipDuration = 'monthly' | 'quarterly' | 'annual' | 'lifetime';

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

/**
 * 子账号设置记录（会员详情「子账号设置记录」tab 的一行）。
 *
 * 后端取额度变更审计（`store_sub_account_quota_audits`），每次调额留一条：
 * 谁、什么时候、把额度从多少调成了多少、原因是什么。
 *
 * ⚠️ 只覆盖**额度数值**变更：槽位的角色 / 状态 / 分配员工改动没有留痕，
 * 因此运营在本 tab 里看不到那部分历史。
 */
export interface MemberSubAccountQuotaRecord {
  /** 记录 id。 */
  id: string;
  /** 变更前的子账号额度。 */
  oldQuota: number;
  /** 变更后的子账号额度（0 = 关闭子账号功能）。 */
  newQuota: number;
  /** 操作人名称；查不到用户（已注销 / 历史数据）时为 null。 */
  operatorName: string | null;
  /** 变更原因；未填写时为 null。 */
  reason: string | null;
  /** 变更时间戳（ms）。 */
  createdAt: number;
}

// ─── 充值记录 ──────────────────────────────────────────────────────────────

/** 充值记录。 */
export interface RechargeRecord {
  id: string;
  /** 套餐名称。 */
  planName: string;
  /** 充值金额展示值（后端直接返回，前端不再分转元）。 */
  amountDisplay: string;
  /** 积分奖励。 */
  pointsAwarded: number;
  /**
   * 支付渠道。
   *
   * - wechat / alipay / card：商家端支付充值
   * - admin：Pulse 管理端设置会员等级，且勾选了「计入收入」
   * - gift：管理端设置会员等级，按赠送处理（amountDisplay 为「赠送」）
   */
  channel: 'wechat' | 'alipay' | 'card' | 'manual' | 'admin' | 'gift';
  /** 充值时间。 */
  createdAt: number;
}

// ─── 会员模型 ──────────────────────────────────────────────────────────────

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
  /** 用户头像 URL，未设置时为空串。 */
  avatarUrl?: string;
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
  /** 累计充值金额展示值（后端直接返回，前端不再分转元）。 */
  totalRechargedDisplay: string;
  /** 充值次数。 */
  rechargeCount: number;
  /** 推广带来的新用户数。 */
  invitedCount: number;
  /** 充值记录。 */
  rechargeHistory: RechargeRecord[];
  /** 管理端「设置会员等级」次数。 */
  adminGrantCount?: number;
  /** 管理端「设置会员等级」记录列表（含赠送）。 */
  adminGrantHistory?: RechargeRecord[];
  /** 「调整续费价格」次数。 */
  renewalPriceAdjustCount?: number;
  /** 「调整续费价格」记录列表（议定基础价的覆盖变更留痕）。 */
  renewalPriceAdjustHistory?: MemberRenewalPriceAdjustRecord[];
  /** 「子账号设置」次数（额度变更次数）。 */
  subAccountQuotaRecordCount?: number;
  /** 「子账号设置」记录列表（额度变更审计）。 */
  subAccountQuotaRecordHistory?: MemberSubAccountQuotaRecord[];
  /** 备注。 */
  remark?: string;
  /** 会员到期时间戳（永久会员为 null）。 */
  membershipExpiry?: number | null;
  /** 子账号能力快照（平台侧）。 */
  subAccountCapability?: SubAccountCapability;
  /** 首购锁定价快照（空数组表示未锁价）。 */
  lockedPrices?: MemberLockedPrice[];
  /** 是否在线（后端权威判定：最近 10 分钟内有经过鉴权的请求）。 */
  isOnline: boolean;
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
  /** 用户头像 URL，未设置时为空串。 */
  avatarUrl?: string;
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
  /** 累计充值金额展示值（后端直接返回，前端不再分转元）。 */
  totalRechargedDisplay: string;
  /** 注册时间。 */
  registeredAt: number;
  /** 最近活跃时间。 */
  lastActiveAt: number;
  /** 是否在线（后端权威判定：最近 10 分钟内有经过鉴权的请求）。 */
  isOnline: boolean;
  /** 邀请人数。 */
  invitedCount?: number;
  /** 充值次数。 */
  rechargeCount?: number;
  /** 备注信息。 */
  remark?: string;
  /** 会员到期时间戳（永久会员可能为 null）。 */
  membershipExpiry?: number | null;
  /**
   * 续费价是否被调整过（曾经调过即 true，清空恢复配置价后仍为 true）。
   * 后端以改价审计判定，供列表「已调价」徽章展示。
   */
  renewalPriceAdjusted?: boolean;
}

// ─── 会员列表查询与结果 ────────────────────────────────────────────────────

/** 会员列表筛选状态。 */
export type MemberFilterStatus = 'all' | MemberStatus;
export type MemberFilterLevel = 'all' | MemberLevel;

/** 会员到期时间筛选。 */
export type MemberFilterExpiry = 'all' | '1m' | '3m' | '6m' | '1y' | '2y';

/** 会员列表查询参数。 */
export interface MemberListQuery {
  /** 搜索关键词。 */
  keyword: string;
  /** 状态筛选。 */
  status: MemberFilterStatus;
  /** 等级筛选。 */
  level: MemberFilterLevel;
  /** 到期时间筛选。 */
  expiry: MemberFilterExpiry;
  /**
   * 只看「有子账号能力、但成交价快照里缺子账号加价」的门店。
   *
   * 这些门店的续费价会退化为 max(当前配置价, 成交总额)，配置价一旦涨过
   * 成交总额，子账号就白送了，需要运营补录。
   */
  pendingSubAccountBackfill: boolean;
  /**
   * 只看「续费价被调整过」的门店。
   *
   * 口径是**曾经调过**：判据由后端取改价审计（`store_membership_price_override_audits`），
   * 并上「当前仍有覆盖价」兜底。因此运营在弹窗里清空覆盖、恢复配置价之后，
   * 门店依然留在清单里——改价这件事发生过，不该因为后来取消了就查不到。
   */
  renewalPriceAdjusted: boolean;
}

/** 会员列表统计概览。 */
export interface MemberListStats {
  /** 总会员数。 */
  totalCount: number;
  /** 活跃会员数。 */
  activeCount: number;
  /** 未活跃会员数（后端权威计算，前端不再反推）。 */
  inactiveCount: number;
  /** 合伙人数。 */
  partnerCount: number;
  /** 封禁人数。 */
  bannedCount: number;
}

/** 会员列表单页请求结果（分页切片 + 全量统计）。 */
export interface MemberListPageResult {
  /** 当前页会员列表。 */
  members: MemberListItem[];
  /** 统计概览（按当前筛选条件的完整列表计算，与分页无关）。 */
  stats: MemberListStats;
  /** 当前筛选条件下的会员总数。 */
  total: number;
  /** 是否还有下一页。 */
  hasMore: boolean;
}

// ─── 跨页面同步事件载荷 ────────────────────────────────────────────────────

/** 会员状态同步事件载荷。 */
export interface MemberStatusSyncPayload {
  /** 会员 id。 */
  memberId: string;
  /** 变更后的会员状态。 */
  status: MemberStatus;
  /** 变更后的备注。 */
  remark?: string;
}

/** 会员等级设置产生的收入同步事件载荷。 */
export interface MembershipRevenueSyncPayload {
  memberId: string;
  memberName: string;
  level: Exclude<MemberLevel, 'free'>;
  /** 金额展示值（后端直接返回，前端不再分转元）。 */
  amountDisplay: string;
  planName: string;
  revenueTypeLabel: string;
  createdAt: number;
}
