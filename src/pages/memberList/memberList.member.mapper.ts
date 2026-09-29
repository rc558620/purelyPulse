// 会员映射：把后端会员列表 / 详情响应收敛成前端领域模型（含各类操作记录与统计概览）。
import { safeNum } from '@utils/utils';
import {
  DAY_MS,
  getNestedArray,
  getNestedRecord,
  isPlainObject,
  MEMBER_AVATAR_COLOR_COUNT,
  normalizeMemberLevel,
  normalizeMemberStatus,
  normalizeOptionalCount,
  normalizeOptionalString,
  normalizeRechargeChannel,
  normalizeTimestamp,
  pickBooleanField,
  pickDisplayField,
  pickNumberField,
  pickStringField,
  resolveAvatarChar,
  resolveAvatarColorIndex,
  resolveMemberOnline,
  resolveMembershipExpiry,
} from './memberList.normalize';
import type {
  PulseServerMemberDetailLike,
  PulseServerMemberListItemLike,
  PulseServerMembersResponseLike,
  PulseServerRechargeRecordLike,
  PulseServerRenewalPriceAdjustRecordLike,
  PulseServerSubAccountQuotaRecordLike,
} from './memberList.dto';
import { isServerMemberDetailLike, isServerMemberListItemLike, isServerMembersResponseLike } from './memberList.dto';
import { resolveLockedPrices } from './memberList.price.mapper';
import { mapSubAccountCapability } from './memberList.subAccount.mapper';
import type {
  MemberDetail,
  MemberListItem,
  MemberListStats,
  MemberSubAccountQuotaRecord,
  RechargeRecord,
} from './memberList.types';
import type { MemberRenewalPriceAdjustRecord } from './memberList.pricing.types';

const EMPTY_MEMBER_LIST_STATS: MemberListStats = {
  totalCount: 0,
  activeCount: 0,
  inactiveCount: 0,
  partnerCount: 0,
  bannedCount: 0,
};

const MEMBER_NAME_CANDIDATES = ['name', 'nickname', 'nickName', 'memberName', 'userName', 'username'] as const;
const MEMBER_ID_CANDIDATES = ['id', 'memberId', 'userId', 'uid'] as const;
const MEMBER_PHONE_CANDIDATES = ['phone', 'mobile', 'mobilePhone', 'phoneNumber', 'tel'] as const;
const MEMBER_STATUS_CANDIDATES = ['status', 'memberStatus', 'state'] as const;
const MEMBER_LEVEL_CANDIDATES = ['level', 'memberLevel', 'membershipLevel', 'vipLevel', 'cardLevel'] as const;
const PARTNER_LEVEL_CANDIDATES = ['partnerLevel', 'partnerRank', 'partnerGrade'] as const;
const REMARK_CANDIDATES = ['remark', 'note', 'comment', 'memo'] as const;
const MEMBER_STATS_SOURCE_CANDIDATES = ['stats', 'summary', 'overview'] as const;
const RECHARGE_LIST_SOURCE_CANDIDATES = ['rechargeHistory', 'rechargeList', 'recharges', 'rechargeRecords', 'records'] as const;
const RECHARGE_CHANNEL_CANDIDATES = ['channel', 'payChannel', 'paymentChannel', 'paymentType'] as const;
const RECHARGE_PLAN_CANDIDATES = ['planName', 'packageName', 'productName', 'membershipName'] as const;

/** 后端充值记录映射：金额展示值由后端下发，前端不换算。 */
const mapServerRechargeRecord = (value: PulseServerRechargeRecordLike & { amountDisplay?: string }): RechargeRecord => ({
  id: value.id,
  planName: value.planName,
  amountDisplay: value.amountDisplay ?? '',
  pointsAwarded: safeNum(value.pointsAwarded),
  channel: normalizeRechargeChannel(value.channel),
  createdAt: value.createdAt,
});

/**
 * 改价记录映射。
 *
 * 两个价格都是「可为 null 的语义值」：oldPriceDisplay=null 表示此前未议定，
 * newPriceDisplay=null 表示这次是清除覆盖、恢复默认价——归一成 null 而不是
 * 空串，UI 才能把「没改过价」和「改成了 0 元」区分开（0 是合法议定价）。
 */
const mapRenewalPriceAdjustRecord = (
  value: PulseServerRenewalPriceAdjustRecordLike,
): MemberRenewalPriceAdjustRecord => ({
  id: String(value.id),
  planId: normalizeOptionalString(value.planId) ?? '',
  planName: normalizeOptionalString(value.planName) ?? '续费价',
  oldPriceDisplay: normalizeOptionalString(value.oldPriceDisplay) ?? null,
  newPriceDisplay: normalizeOptionalString(value.newPriceDisplay) ?? null,
  operatorName: normalizeOptionalString(value.operatorName) ?? null,
  createdAt: safeNum(value.createdAt),
});

/**
 * 子账号额度变更记录映射。
 *
 * 额度是数字且 0 有业务语义（关闭功能），因此只做 safeNum 兜底、
 * 不做「0 视为缺失」的归一——`normalizeOptionalCount` 会把 0 当成无值。
 */
const mapSubAccountQuotaRecord = (
  value: PulseServerSubAccountQuotaRecordLike,
): MemberSubAccountQuotaRecord => ({
  id: String(value.id),
  oldQuota: safeNum(value.oldQuota),
  newQuota: safeNum(value.newQuota),
  operatorName: normalizeOptionalString(value.operatorName) ?? null,
  reason: normalizeOptionalString(value.reason) ?? null,
  createdAt: safeNum(value.createdAt),
});

/** 后端会员列表行映射。 */
const mapServerMemberListItem = (value: PulseServerMemberListItemLike): MemberListItem => ({
  id: value.id,
  name: value.name,
  phone: value.phone,
  avatarChar: value.avatarChar,
  avatarColorIdx: Math.abs(Math.round(value.avatarColorIdx)) % MEMBER_AVATAR_COLOR_COUNT,
  avatarUrl: value.avatarUrl || undefined,
  status: normalizeMemberStatus(value.status),
  level: normalizeMemberLevel(value.level),
  availablePoints: safeNum(value.availablePoints),
  beanBalance: safeNum(value.beanBalance),
  isPartner: value.isPartner,
  partnerLevel: normalizeOptionalString(value.partnerLevel),
  totalRechargedDisplay: value.totalRechargedDisplay ?? '',
  registeredAt: value.registeredAt,
  lastActiveAt: value.lastActiveAt,
  invitedCount: normalizeOptionalCount(value.invitedCount),
  rechargeCount: normalizeOptionalCount(value.rechargeCount),
  remark: normalizeOptionalString(value.remark),
  membershipExpiry: resolveMembershipExpiry(value as unknown as Record<string, unknown>),
  isOnline: resolveMemberOnline(value),
  renewalPriceAdjusted: value.renewalPriceAdjusted === true,
});

/** 后端会员详情映射：充值为骨架，另外三组操作记录各有专属结构。 */
const mapServerMemberDetail = (value: PulseServerMemberDetailLike): MemberDetail => ({
  ...mapServerMemberListItem(value),
  totalPointsEarned: safeNum(value.totalPointsEarned),
  rechargeCount: normalizeOptionalCount(value.rechargeCount) ?? value.rechargeHistory.length,
  invitedCount: normalizeOptionalCount(value.invitedCount) ?? 0,
  rechargeHistory: value.rechargeHistory.map((record) => mapServerRechargeRecord(record)),
  // 管理端「设置会员等级记录」：与充值记录同结构，按 tab 分开展示
  adminGrantCount: normalizeOptionalCount(value.adminGrantCount) ?? 0,
  adminGrantHistory: (value.adminGrantHistory ?? []).map((record) =>
    mapServerRechargeRecord(record),
  ),
  // 「调整续费记录」：改价审计，与上面两组记录结构不同，走专属映射
  renewalPriceAdjustCount: normalizeOptionalCount(value.renewalPriceAdjustCount) ?? 0,
  renewalPriceAdjustHistory: (value.renewalPriceAdjustHistory ?? []).map((record) =>
    mapRenewalPriceAdjustRecord(record),
  ),
  // 「子账号设置记录」：额度变更审计，同样走专属映射
  subAccountQuotaRecordCount: normalizeOptionalCount(value.subAccountQuotaRecordCount) ?? 0,
  subAccountQuotaRecordHistory: (value.subAccountQuotaRecordHistory ?? []).map((record) =>
    mapSubAccountQuotaRecord(record),
  ),
  membershipExpiry: resolveMembershipExpiry(value as unknown as Record<string, unknown>),
  subAccountCapability: mapSubAccountCapability(value),
  lockedPrices: resolveLockedPrices(value),
});

// 从后端响应结构中提取统计数据，前端不再 reduce 累加。
const getServerMemberListStats = (
  _members: MemberListItem[],
  payload: PulseServerMembersResponseLike,
): MemberListStats => {
  const stats = payload.stats ?? payload.summary;
  if (isPlainObject(stats)) {
    return {
      totalCount: safeNum(Number((stats as Record<string, unknown>).totalCount ?? (stats as Record<string, unknown>).total ?? 0)),
      activeCount: safeNum(Number((stats as Record<string, unknown>).activeCount ?? (stats as Record<string, unknown>).normalCount ?? 0)),
      inactiveCount: safeNum(Number((stats as Record<string, unknown>).inactiveCount ?? (stats as Record<string, unknown>).dormantCount ?? 0)),
      partnerCount: safeNum(Number((stats as Record<string, unknown>).partnerCount ?? 0)),
      bannedCount: safeNum(Number((stats as Record<string, unknown>).bannedCount ?? (stats as Record<string, unknown>).disabledCount ?? 0)),
    };
  }

  // 后端未提供 stats 对象时，从顶层字段提取
  return {
    totalCount: safeNum(payload.totalCount ?? payload.total ?? 0),
    activeCount: safeNum(payload.activeCount ?? payload.normalCount ?? 0),
    inactiveCount: safeNum(payload.inactiveCount ?? payload.dormantCount ?? 0),
    partnerCount: safeNum(payload.partnerCount ?? 0),
    bannedCount: safeNum(payload.bannedCount ?? payload.disabledCount ?? 0),
  };
};

/** 旧协议下的充值记录映射：金额与渠道都从候选字段兜底。 */
const mapRechargeRecord = (value: unknown, index: number, memberId: string): RechargeRecord => {
  const recordId = pickStringField(value, ['id', 'recordId', 'rechargeId']) || `${memberId}-recharge-${index + 1}`;
  const planName = pickStringField(value, RECHARGE_PLAN_CANDIDATES) || '会员充值';
  const amountDisplay = pickDisplayField(
    value,
    ['amountDisplay', 'rechargeAmountDisplay', 'totalDisplay'],
  );
  const pointsAwarded = pickNumberField(value, ['pointsAwarded', 'rewardPoints', 'points']);
  const channel = normalizeRechargeChannel(pickStringField(value, RECHARGE_CHANNEL_CANDIDATES) || 'wechat');
  const createdAt = normalizeTimestamp(
    isPlainObject(value) ? value.createdAt ?? value.payTime ?? value.paidAt : undefined,
    Date.now(),
  );

  return {
    id: recordId,
    planName,
    amountDisplay,
    pointsAwarded,
    channel,
    createdAt,
  };
};

/** 会员列表行映射：命中后端 DTO 走严格映射，否则按候选字段兜底。 */
export const mapMemberListItem = (value: unknown, index: number): MemberListItem => {
  if (isServerMemberListItemLike(value)) {
    return mapServerMemberListItem(value);
  }

  const memberId = pickStringField(value, MEMBER_ID_CANDIDATES) || `member-${index + 1}`;
  const memberName = pickStringField(value, MEMBER_NAME_CANDIDATES) || `会员${index + 1}`;
  const phone = pickStringField(value, MEMBER_PHONE_CANDIDATES);
  const partnerLevel = pickStringField(value, PARTNER_LEVEL_CANDIDATES);
  const isPartner = pickBooleanField(value, ['isPartner', 'partner', 'partnerMember']) || Boolean(partnerLevel);

  return {
    id: memberId,
    name: memberName,
    phone,
    avatarChar: resolveAvatarChar(memberName, value),
    avatarColorIdx: resolveAvatarColorIndex(memberId || memberName, value),
    avatarUrl: (isPlainObject(value) && typeof value.avatarUrl === 'string' && value.avatarUrl.trim()) ? value.avatarUrl.trim() : undefined,
    status: normalizeMemberStatus(pickStringField(value, MEMBER_STATUS_CANDIDATES) || 'active'),
    level: normalizeMemberLevel(pickStringField(value, MEMBER_LEVEL_CANDIDATES) || 'free'),
    availablePoints: pickNumberField(value, ['availablePoints', 'pointsBalance', 'pointBalance', 'currentPoints']),
    beanBalance: pickNumberField(value, ['beanBalance', 'beans', 'beanAmount', 'currentBeans']),
    isPartner,
    partnerLevel: partnerLevel || undefined,
    totalRechargedDisplay: pickDisplayField(
      value,
      ['totalRechargedDisplay', 'rechargeTotalDisplay', 'totalRechargeAmountDisplay'],
    ),
    registeredAt: normalizeTimestamp(isPlainObject(value) ? value.registeredAt ?? value.createdAt ?? value.joinTime : undefined, Date.now() - 30 * DAY_MS),
    lastActiveAt: normalizeTimestamp(isPlainObject(value) ? value.lastActiveAt ?? value.latestActiveAt ?? value.activeAt : undefined, Date.now()),
    invitedCount: pickNumberField(value, ['invitedCount', 'inviteCount', 'referralCount', 'promotionCount']) || undefined,
    rechargeCount: pickNumberField(value, ['rechargeCount', 'rechargeTimes', 'payCount']) || undefined,
    remark: pickStringField(value, REMARK_CANDIDATES) || undefined,
    membershipExpiry: isPlainObject(value) ? resolveMembershipExpiry(value) : undefined,
    isOnline: resolveMemberOnline(value),
    renewalPriceAdjusted: isPlainObject(value) ? value.renewalPriceAdjusted === true : undefined,
  };
};

/** 会员详情映射：命中后端 DTO 走严格映射，否则按候选字段兜底。 */
export const mapMemberDetail = (value: unknown): MemberDetail => {
  if (isServerMemberDetailLike(value)) {
    return mapServerMemberDetail(value);
  }

  const memberListItem = mapMemberListItem(value, 0);
  const partnerLevel = pickStringField(value, PARTNER_LEVEL_CANDIDATES);
  const rechargeHistorySource = getNestedArray(value, RECHARGE_LIST_SOURCE_CANDIDATES);
  const rechargeHistory = rechargeHistorySource.map((item, index) => mapRechargeRecord(item, index, memberListItem.id));

  return {
    ...memberListItem,
    totalPointsEarned: pickNumberField(value, ['totalPointsEarned', 'earnedPoints', 'pointsTotal']),
    partnerLevel: partnerLevel || undefined,
    totalRechargedDisplay: pickDisplayField(
      value,
      ['totalRechargedDisplay', 'rechargeTotalDisplay', 'totalRechargeAmountDisplay'],
    ),
    rechargeCount: pickNumberField(value, ['rechargeCount', 'rechargeTimes', 'payCount']) || rechargeHistory.length,
    invitedCount: pickNumberField(value, ['invitedCount', 'inviteCount', 'referralCount', 'promotionCount']),
    rechargeHistory,
    remark: pickStringField(value, REMARK_CANDIDATES) || undefined,
    membershipExpiry: isPlainObject(value) ? resolveMembershipExpiry(value) : undefined,
    subAccountCapability: mapSubAccountCapability(value),
    lockedPrices: resolveLockedPrices(value),
  };
};

// 后端权威计算统计数据，前端仅做字段映射，不再 reduce 回退。
// 使用 ?? 避免后端返回 0 时被误兜底。
export const buildMemberListStats = (members: MemberListItem[], payload: unknown): MemberListStats => {
  if (isServerMembersResponseLike(payload)) {
    return getServerMemberListStats(members, payload);
  }

  const statsSource = getNestedRecord(payload, MEMBER_STATS_SOURCE_CANDIDATES) ?? (isPlainObject(payload) ? payload : null);
  if (!statsSource) {
    return { ...EMPTY_MEMBER_LIST_STATS };
  }

  return {
    totalCount: pickNumberField(statsSource, ['totalCount', 'total', 'memberCount']) ?? 0,
    activeCount: pickNumberField(statsSource, ['activeCount', 'normalCount']) ?? 0,
    inactiveCount: pickNumberField(statsSource, ['inactiveCount', 'dormantCount']) ?? 0,
    partnerCount: pickNumberField(statsSource, ['partnerCount']) ?? 0,
    bannedCount: pickNumberField(statsSource, ['bannedCount', 'disabledCount']) ?? 0,
  };
};
