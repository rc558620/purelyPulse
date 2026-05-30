// 会员列表 / 详情服务层：封装接口请求、字段映射与前端语义整理。
import { createKeyedInFlightRequest, http, resolveEnvPath } from '@utils/http';
import { safeNum } from '@utils/utils';
import { STORAGE_KEYS } from '@constants/storageKeys';
import { MEMBER_STATUS_SYNC_EVENT, MEMBERSHIP_REVENUE_CONFIG, MEMBERSHIP_REVENUE_SYNC_EVENT } from './memberList.constants';
import type {
  MemberPointsPageUser,
  MemberPointsRecord,
  MemberPointsSource,
  MemberPointsStats,
} from '../memberPoints/memberPoints.types';
import type {
  BeanRecord,
  PartnerBeansStats,
  UserSnapshot,
} from '../partnerBeans/partnerBeans.shared.types';
import type {
  MemberDetail,
  MemberLevel,
  MemberListItem,
  MemberListQuery,
  MemberListStats,
  MemberStatus,
  MemberStatusSyncPayload,
  RechargeRecord,
  SubAccountRoleSummary,
} from './memberList.types';

const MEMBER_LIST_API_PATH = resolveEnvPath(import.meta.env.VITE_MEMBER_LIST_API_PATH, '/pulse/membership/admin/members');
const MEMBER_DETAIL_API_PATH = resolveEnvPath(import.meta.env.VITE_MEMBER_DETAIL_API_PATH, '/pulse/membership/admin/members/{id}');
const MEMBER_POINTS_API_PATH = resolveEnvPath(import.meta.env.VITE_MEMBER_POINTS_API_PATH, '/pulse/membership/points/logs');
const PARTNER_BEANS_API_PATH = resolveEnvPath(import.meta.env.VITE_PARTNER_BEANS_API_PATH, '/pulse/membership/beans/logs');
const ADJUST_MEMBER_POINTS_API_PATH = resolveEnvPath(import.meta.env.VITE_ADJUST_MEMBER_POINTS_API_PATH, '/pulse/membership/admin/members/{id}/points/adjust');
const ADJUST_PARTNER_BEANS_API_PATH = resolveEnvPath(import.meta.env.VITE_ADJUST_PARTNER_BEANS_API_PATH, '/pulse/membership/admin/members/{id}/beans/adjust');
const SET_MEMBERSHIP_API_PATH = resolveEnvPath(import.meta.env.VITE_SET_MEMBERSHIP_API_PATH, '/pulse/membership/admin/members/{id}/membership');
const MEMBER_BAN_API_PATH = resolveEnvPath(import.meta.env.VITE_MEMBER_BAN_API_PATH, '/pulse/membership/admin/members/{id}/ban');
const MEMBER_UNBAN_API_PATH = resolveEnvPath(import.meta.env.VITE_MEMBER_UNBAN_API_PATH, '/pulse/membership/admin/members/{id}/unban');
const SET_SUB_ACCOUNT_QUOTA_API_PATH = resolveEnvPath(import.meta.env.VITE_SET_SUB_ACCOUNT_QUOTA_API_PATH, '/pulse/membership/admin/members/{id}/sub-accounts/quota');
const MEMBER_AVATAR_COLOR_COUNT = 6;
const DAY_MS = 86_400_000;

const EMPTY_MEMBER_LIST_STATS: MemberListStats = {
  totalCount: 0,
  activeCount: 0,
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
const MEMBER_LIST_SOURCE_CANDIDATES = ['list', 'items', 'records', 'rows', 'members', 'data'] as const;
const MEMBER_DETAIL_SOURCE_CANDIDATES = ['member', 'detail', 'profile', 'info', 'data'] as const;
const MEMBER_STATS_SOURCE_CANDIDATES = ['stats', 'summary', 'overview'] as const;
const RECHARGE_LIST_SOURCE_CANDIDATES = ['rechargeHistory', 'rechargeList', 'recharges', 'rechargeRecords', 'records'] as const;
const RECHARGE_CHANNEL_CANDIDATES = ['channel', 'payChannel', 'paymentChannel', 'paymentType'] as const;
const RECHARGE_PLAN_CANDIDATES = ['planName', 'packageName', 'productName', 'membershipName'] as const;
const POINTS_RECORD_SOURCE_CANDIDATES = ['records', 'list', 'items', 'rows', 'data'] as const;
const PARTNER_USERS_SOURCE_CANDIDATES = ['partners', 'partnerUsers', 'users', 'members', 'list', 'items', 'rows', 'data'] as const;
const RELATED_USER_CANDIDATES = ['relatedUser', 'referralUserName', 'inviteeName', 'promotedUserName'] as const;

const isPlainObject = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const isFiniteNumber = (value: unknown): value is number => (
  typeof value === 'number' && Number.isFinite(value)
);

interface PulseServerRechargeRecordLike {
  id: string;
  planName: string;
  amount: number;
  pointsAwarded: number;
  channel: string;
  createdAt: number;
}

interface PulseServerMemberListItemLike {
  id: string;
  name: string;
  phone: string;
  avatarChar: string;
  avatarColorIdx: number;
  status: string;
  level: string;
  availablePoints: number;
  beanBalance: number;
  isPartner: boolean;
  totalRecharged: number;
  registeredAt: number;
  lastActiveAt: number;
  partnerLevel?: string;
  invitedCount?: number;
  rechargeCount?: number;
  remark?: string;
}

interface PulseServerMemberDetailLike extends PulseServerMemberListItemLike {
  totalPointsEarned: number;
  rechargeHistory: PulseServerRechargeRecordLike[];
  membershipExpiry?: number | null;
}

interface PulseServerMembersResponseLike {
  items: PulseServerMemberListItemLike[];
  total: number;
}

const isServerRechargeRecordLike = (value: unknown): value is PulseServerRechargeRecordLike => (
  isPlainObject(value)
  && typeof value.id === 'string'
  && typeof value.planName === 'string'
  && isFiniteNumber(value.amount)
  && isFiniteNumber(value.pointsAwarded)
  && typeof value.channel === 'string'
  && isFiniteNumber(value.createdAt)
);

const isServerMemberListItemLike = (value: unknown): value is PulseServerMemberListItemLike => (
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
  && isFiniteNumber(value.registeredAt)
  && isFiniteNumber(value.lastActiveAt)
);

const isServerMemberDetailLike = (value: unknown): value is PulseServerMemberDetailLike => (
  isServerMemberListItemLike(value)
  && isFiniteNumber(value.totalPointsEarned)
  && Array.isArray(value.rechargeHistory)
  && value.rechargeHistory.every((item) => isServerRechargeRecordLike(item))
);

const isServerMembersResponseLike = (value: unknown): value is PulseServerMembersResponseLike => (
  isPlainObject(value)
  && Array.isArray(value.items)
  && isFiniteNumber(value.total)
  && value.items.every((item) => isServerMemberListItemLike(item))
);

const normalizeOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue || undefined;
};

const normalizeOptionalCount = (value: unknown): number | undefined => {
  const normalizedValue = normalizeNumber(value);
  if (normalizedValue !== 0 || value === 0 || value === '0') {
    return safeNum(normalizedValue);
  }

  return undefined;
};

const mapServerRechargeRecord = (value: PulseServerRechargeRecordLike): RechargeRecord => ({
  id: value.id,
  planName: value.planName,
  amount: safeNum(value.amount),
  pointsAwarded: safeNum(value.pointsAwarded),
  channel: normalizeRechargeChannel(value.channel),
  createdAt: value.createdAt,
});

const mapServerMemberListItem = (value: PulseServerMemberListItemLike): MemberListItem => ({
  id: value.id,
  name: value.name,
  phone: value.phone,
  avatarChar: value.avatarChar,
  avatarColorIdx: Math.abs(Math.round(value.avatarColorIdx)) % MEMBER_AVATAR_COLOR_COUNT,
  status: normalizeMemberStatus(value.status),
  level: normalizeMemberLevel(value.level),
  availablePoints: safeNum(value.availablePoints),
  beanBalance: safeNum(value.beanBalance),
  isPartner: value.isPartner,
  partnerLevel: normalizeOptionalString(value.partnerLevel),
  totalRecharged: safeNum(value.totalRecharged),
  registeredAt: value.registeredAt,
  lastActiveAt: value.lastActiveAt,
  invitedCount: normalizeOptionalCount(value.invitedCount),
  rechargeCount: normalizeOptionalCount(value.rechargeCount),
  remark: normalizeOptionalString(value.remark),
  membershipExpiry: value.membershipExpiry === null || value.expireAt === null || value.membershipExpireAt === null
    ? null
    : normalizeTimestamp(value.membershipExpiry ?? value.expireAt ?? value.membershipExpireAt, 0) || undefined,
});

const mapServerMemberDetail = (value: PulseServerMemberDetailLike): MemberDetail => ({
  ...mapServerMemberListItem(value),
  totalPointsEarned: safeNum(value.totalPointsEarned),
  rechargeCount: normalizeOptionalCount(value.rechargeCount) ?? value.rechargeHistory.length,
  invitedCount: normalizeOptionalCount(value.invitedCount) ?? 0,
  rechargeHistory: value.rechargeHistory.map((record) => mapServerRechargeRecord(record)),
  membershipExpiry: value.membershipExpiry === null || value.expireAt === null || value.membershipExpireAt === null
    ? null
    : normalizeTimestamp(value.membershipExpiry ?? value.expireAt ?? value.membershipExpireAt, 0) || undefined,
});

const getServerMemberListStats = (
  members: MemberListItem[],
  payload: PulseServerMembersResponseLike,
): MemberListStats => ({
  totalCount: payload.total,
  activeCount: members.filter((member) => member.status === 'active').length,
  partnerCount: members.filter((member) => member.isPartner).length,
  bannedCount: members.filter((member) => member.status === 'banned').length,
});

const getNestedRecord = (value: unknown, keys: readonly string[]): Record<string, unknown> | null => {
  if (!isPlainObject(value)) {
    return null;
  }

  for (const key of keys) {
    const candidate = value[key];
    if (isPlainObject(candidate)) {
      return candidate;
    }
  }

  return null;
};

const getNestedArray = (value: unknown, keys: readonly string[]): unknown[] => {
  if (!isPlainObject(value)) {
    return [];
  }

  for (const key of keys) {
    const candidate = value[key];
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
};

const pickStringField = (value: unknown, keys: readonly string[]): string => {
  if (!isPlainObject(value)) {
    return '';
  }

  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return '';
};

const pickBooleanField = (value: unknown, keys: readonly string[]): boolean => {
  if (!isPlainObject(value)) {
    return false;
  }

  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === 'boolean') {
      return candidate;
    }
    if (candidate === 1 || candidate === '1' || candidate === 'true') {
      return true;
    }
    if (candidate === 0 || candidate === '0' || candidate === 'false') {
      return false;
    }
  }

  return false;
};

const normalizeNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const sanitizedValue = value.replace(/,/g, '').trim();
    if (!sanitizedValue) {
      return 0;
    }
    const parsedValue = Number(sanitizedValue);
    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return 0;
};

const pickNumberField = (value: unknown, keys: readonly string[]): number => {
  if (!isPlainObject(value)) {
    return 0;
  }

  for (const key of keys) {
    const normalizedValue = normalizeNumber(value[key]);
    if (normalizedValue !== 0 || value[key] === 0 || value[key] === '0') {
      return safeNum(normalizedValue);
    }
  }

  return 0;
};

const toFenAmount = (value: number, isYuan: boolean): number => {
  const normalizedValue = Number.isFinite(value) ? value : 0;
  if (isYuan) {
    return Math.round(normalizedValue * 100);
  }
  return Math.round(normalizedValue);
};

const pickFenAmountField = (
  value: unknown,
  fenKeys: readonly string[],
  yuanKeys: readonly string[],
): number => {
  if (!isPlainObject(value)) {
    return 0;
  }

  for (const key of fenKeys) {
    const candidate = value[key];
    const normalizedValue = normalizeNumber(candidate);
    if (normalizedValue !== 0 || candidate === 0 || candidate === '0') {
      return toFenAmount(normalizedValue, false);
    }
  }

  for (const key of yuanKeys) {
    const candidate = value[key];
    const normalizedValue = normalizeNumber(candidate);
    if (normalizedValue !== 0 || candidate === 0 || candidate === '0') {
      return toFenAmount(normalizedValue, true);
    }
  }

  return 0;
};

const normalizeTimestamp = (value: unknown, fallbackValue: number): number => {
  if (value instanceof Date) {
    return value.getTime();
  }

  const numericValue = normalizeNumber(value);
  if (numericValue > 0) {
    return numericValue < 1_000_000_000_000 ? numericValue * 1000 : numericValue;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsedValue = Date.parse(value);
    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return fallbackValue;
};

const resolveAvatarChar = (name: string, rawValue: unknown): string => {
  const providedAvatarChar = pickStringField(rawValue, ['avatarChar', 'avatarText', 'avatarInitial']);
  if (providedAvatarChar) {
    return providedAvatarChar.slice(0, 1);
  }

  const normalizedName = name.trim();
  return normalizedName ? normalizedName.slice(0, 1) : '会';
};

const resolveAvatarColorIndex = (seedValue: string, rawValue: unknown): number => {
  const providedIndex = pickNumberField(rawValue, ['avatarColorIdx', 'avatarColorIndex']);
  if (providedIndex > 0 || providedIndex === 0) {
    return Math.abs(Math.round(providedIndex)) % MEMBER_AVATAR_COLOR_COUNT;
  }

  if (!seedValue) {
    return 0;
  }

  const hashValue = seedValue.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return hashValue % MEMBER_AVATAR_COLOR_COUNT;
};

const maskPhone = (value: string): string => {
  const normalizedValue = value.replace(/\s+/g, '');
  if (!/^1\d{10}$/.test(normalizedValue)) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, 3)}****${normalizedValue.slice(-4)}`;
};

const normalizeMemberStatus = (value: string): MemberStatus => {
  switch (value.toLowerCase()) {
    case 'active':
    case 'normal':
    case 'enabled':
      return 'active';
    case 'inactive':
    case 'sleep':
    case 'dormant':
      return 'inactive';
    case 'banned':
    case 'disabled':
    case 'blocked':
    case 'forbidden':
      return 'banned';
    default:
      return 'active';
  }
};

const normalizeMemberLevel = (value: string): MemberLevel => {
  switch (value.toLowerCase()) {
    case 'monthly':
    case 'month':
      return 'monthly';
    case 'quarterly':
    case 'quarter':
    case 'season':
      return 'quarterly';
    case 'annual':
    case 'yearly':
    case 'year':
      return 'annual';
    case 'lifetime':
    case 'forever':
    case 'permanent':
      return 'lifetime';
    case 'free':
    default:
      return 'free';
  }
};

const normalizeRechargeChannel = (value: string): RechargeRecord['channel'] => {
  switch (value.toLowerCase()) {
    case 'alipay':
    case 'ali':
      return 'alipay';
    case 'card':
    case 'giftcard':
    case 'gift_card':
      return 'card';
    case 'manual':
    case 'manual_set':
    case 'system':
      return 'manual';
    case 'wechat':
    case 'wx':
    case 'wechatpay':
    default:
      return 'wechat';
  }
};

const normalizePointsSource = (value: string): MemberPointsSource => {
  switch (value.toLowerCase()) {
    case 'purchase_bonus':
    case 'purchasebonus':
    case 'purchase':
    case 'recharge_bonus':
      return 'purchase_bonus';
    case 'deduct_payment':
    case 'deductpayment':
    case 'payment_deduction':
    case 'consume':
      return 'deduct_payment';
    case 'expire':
    case 'expired':
      return 'expire';
    case 'admin_adjust':
    case 'adminadjust':
    case 'manual_adjust':
    default:
      return 'admin_adjust';
  }
};

const normalizeBeanSource = (value: string): BeanRecord['source'] => {
  switch (value.toLowerCase()) {
    case 'promo_reward':
    case 'promoreward':
    case 'promotion_reward':
      return 'promo_reward';
    case 'deduct_payment':
    case 'deductpayment':
    case 'payment_deduction':
      return 'deduct_payment';
    case 'withdrawal':
    case 'withdraw':
      return 'withdrawal';
    case 'admin_adjust':
    case 'adminadjust':
    case 'manual_adjust':
    default:
      return 'admin_adjust';
  }
};

const mapUserSnapshot = (value: unknown, index: number): UserSnapshot => {
  const member = mapMemberListItem(value, index);
  return {
    id: member.id,
    name: member.name,
    phone: member.phone,
    availablePoints: member.availablePoints,
    beanBalance: member.beanBalance,
    isPartner: member.isPartner,
  };
};

const mapPointsRecord = (value: unknown, index: number): MemberPointsRecord => {
  const userId = pickStringField(value, ['userId', 'memberId', 'uid', 'id']) || `member-${index + 1}`;
  const userName = pickStringField(value, ['userName', 'name', 'memberName']) || `会员${index + 1}`;
  const amount = pickNumberField(value, ['amount', 'delta', 'changeAmount']);
  const rawType = pickStringField(value, ['type', 'changeType']);
  const source = normalizePointsSource(pickStringField(value, ['source', 'changeSource', 'bizType']) || 'admin_adjust');
  const type = rawType
    ? (rawType === 'expire' ? 'expire' : rawType === 'earn' ? 'earn' : 'spend')
    : amount > 0
      ? 'earn'
      : source === 'expire'
        ? 'expire'
        : 'spend';

  return {
    id: pickStringField(value, ['id', 'recordId']) || `pts-${index + 1}`,
    userId,
    userName,
    userPhone: maskPhone(pickStringField(value, ['userPhone', 'phone', 'mobile'])),
    amount,
    type,
    source,
    description: pickStringField(value, ['description', 'reason', 'remark', 'note']) || '管理员调整积分',
    createdAt: normalizeTimestamp(isPlainObject(value) ? value.createdAt ?? value.createTime ?? value.time : undefined, Date.now()),
    expireAt: normalizeTimestamp(isPlainObject(value) ? value.expireAt : undefined, 0) || undefined,
  };
};

const mapBeanRecord = (value: unknown, index: number): BeanRecord => {
  const userId = pickStringField(value, ['userId', 'memberId', 'uid', 'id']) || `partner-${index + 1}`;
  const userName = pickStringField(value, ['userName', 'name', 'memberName']) || `合伙人${index + 1}`;
  const amount = pickNumberField(value, ['amount', 'delta', 'changeAmount']);
  const source = normalizeBeanSource(pickStringField(value, ['source', 'changeSource', 'bizType']) || 'admin_adjust');
  const rawType = pickStringField(value, ['type', 'changeType']);
  const type = rawType
    ? (rawType === 'withdraw' ? 'withdraw' : rawType === 'earn' ? 'earn' : 'spend')
    : source === 'withdrawal'
      ? 'withdraw'
      : amount > 0
        ? 'earn'
        : 'spend';

  return {
    id: pickStringField(value, ['id', 'recordId']) || `bean-${index + 1}`,
    userId,
    userName,
    userPhone: maskPhone(pickStringField(value, ['userPhone', 'phone', 'mobile'])),
    amount,
    type,
    source,
    description: pickStringField(value, ['description', 'reason', 'remark', 'note']) || '管理员调整纯利豆',
    relatedPromoId: pickStringField(value, ['relatedPromoId', 'promoId']) || undefined,
    relatedUser: pickStringField(value, RELATED_USER_CANDIDATES) || undefined,
    createdAt: normalizeTimestamp(isPlainObject(value) ? value.createdAt ?? value.createTime ?? value.time : undefined, Date.now()),
  };
};

const buildMemberListStats = (members: MemberListItem[], payload: unknown): MemberListStats => {
  if (isServerMembersResponseLike(payload)) {
    return getServerMemberListStats(members, payload);
  }

  const computedStats = members.reduce<MemberListStats>((stats, member) => ({
    totalCount: stats.totalCount + 1,
    activeCount: stats.activeCount + (member.status === 'active' ? 1 : 0),
    partnerCount: stats.partnerCount + (member.isPartner ? 1 : 0),
    bannedCount: stats.bannedCount + (member.status === 'banned' ? 1 : 0),
  }), { ...EMPTY_MEMBER_LIST_STATS });

  const statsSource = getNestedRecord(payload, MEMBER_STATS_SOURCE_CANDIDATES) ?? (isPlainObject(payload) ? payload : null);
  if (!statsSource) {
    return computedStats;
  }

  return {
    totalCount: pickNumberField(statsSource, ['totalCount', 'total', 'memberCount']) || computedStats.totalCount,
    activeCount: pickNumberField(statsSource, ['activeCount', 'normalCount']) || computedStats.activeCount,
    partnerCount: pickNumberField(statsSource, ['partnerCount']) || computedStats.partnerCount,
    bannedCount: pickNumberField(statsSource, ['bannedCount', 'disabledCount']) || computedStats.bannedCount,
  };
};

export interface MembershipRevenueSyncPayload {
  memberId: string;
  memberName: string;
  level: Exclude<MemberLevel, 'free'>;
  amountFen: number;
  planName: string;
  revenueTypeLabel: string;
  createdAt: number;
}

const MEMBERSHIP_REVENUE_EVENT_LIMIT = 200;

const buildMembershipRevenueRecordId = (event: MembershipRevenueSyncPayload): string => (
  `membership-revenue-${event.memberId}-${event.createdAt}-${event.level}`
);

const normalizeMembershipRevenueSyncPayload = (value: unknown): MembershipRevenueSyncPayload | null => {
  if (!isPlainObject(value)) {
    return null;
  }

  const memberId = normalizeOptionalString(value.memberId) ?? '';
  const normalizedLevel = normalizeMemberLevel(normalizeOptionalString(value.level) ?? 'free');
  const amountFen = normalizeNumber(value.amountFen);
  const planName = normalizeOptionalString(value.planName) ?? '';
  const revenueTypeLabel = normalizeOptionalString(value.revenueTypeLabel) ?? '';
  const createdAt = normalizeTimestamp(value.createdAt, 0);

  if (!memberId || normalizedLevel === 'free' || amountFen <= 0 || !planName || !revenueTypeLabel || !createdAt) {
    return null;
  }

  return {
    memberId,
    memberName: normalizeOptionalString(value.memberName) ?? `会员${memberId}`,
    level: normalizedLevel,
    amountFen,
    planName,
    revenueTypeLabel,
    createdAt,
  };
};

const readStoredMembershipRevenueSyncEvents = (): MembershipRevenueSyncPayload[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const rawValue = sessionStorage.getItem(STORAGE_KEYS.MEMBERSHIP_REVENUE_EVENTS);
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) {
      sessionStorage.removeItem(STORAGE_KEYS.MEMBERSHIP_REVENUE_EVENTS);
      return [];
    }

    return parsedValue
      .map((item) => normalizeMembershipRevenueSyncPayload(item))
      .filter((item): item is MembershipRevenueSyncPayload => item !== null);
  } catch {
    sessionStorage.removeItem(STORAGE_KEYS.MEMBERSHIP_REVENUE_EVENTS);
    return [];
  }
};

const persistMembershipRevenueSyncEvents = (events: MembershipRevenueSyncPayload[]): void => {
  if (typeof window === 'undefined') {
    return;
  }

  if (events.length === 0) {
    sessionStorage.removeItem(STORAGE_KEYS.MEMBERSHIP_REVENUE_EVENTS);
    return;
  }

  sessionStorage.setItem(
    STORAGE_KEYS.MEMBERSHIP_REVENUE_EVENTS,
    JSON.stringify(events.slice(-MEMBERSHIP_REVENUE_EVENT_LIMIT)),
  );
};

export const readMembershipRevenueSyncEvents = (): MembershipRevenueSyncPayload[] => (
  readStoredMembershipRevenueSyncEvents()
);

const appendMembershipRevenueSyncEvent = (payload: MembershipRevenueSyncPayload): void => {
  persistMembershipRevenueSyncEvents(readStoredMembershipRevenueSyncEvents().concat(payload));
};

const applyMembershipRevenueToMemberListItem = (member: MemberListItem): MemberListItem => {
  const relatedEvents = readStoredMembershipRevenueSyncEvents().filter((item) => item.memberId === member.id);
  if (relatedEvents.length === 0) {
    return member;
  }

  const addedAmountFen = relatedEvents.reduce((sum, item) => safeNum(sum + item.amountFen), 0);
  return {
    ...member,
    totalRecharged: safeNum(member.totalRecharged + addedAmountFen),
    rechargeCount: safeNum((member.rechargeCount ?? 0) + relatedEvents.length),
  };
};

const applyMembershipRevenueToMemberDetail = (member: MemberDetail): MemberDetail => {
  const relatedEvents = readStoredMembershipRevenueSyncEvents()
    .filter((item) => item.memberId === member.id)
    .sort((left, right) => right.createdAt - left.createdAt);
  if (relatedEvents.length === 0) {
    return member;
  }

  const addedAmountFen = relatedEvents.reduce((sum, item) => safeNum(sum + item.amountFen), 0);
  const manualRechargeHistory = relatedEvents.map<RechargeRecord>((item) => ({
    id: buildMembershipRevenueRecordId(item),
    planName: item.planName,
    amount: item.amountFen,
    pointsAwarded: 0,
    channel: 'manual',
    createdAt: item.createdAt,
  }));

  return {
    ...member,
    totalRecharged: safeNum(member.totalRecharged + addedAmountFen),
    rechargeCount: safeNum((member.rechargeCount ?? member.rechargeHistory.length) + relatedEvents.length),
    rechargeHistory: manualRechargeHistory.concat(member.rechargeHistory),
  };
};

const mapRechargeRecord = (value: unknown, index: number, memberId: string): RechargeRecord => {
  const recordId = pickStringField(value, ['id', 'recordId', 'rechargeId']) || `${memberId}-recharge-${index + 1}`;
  const planName = pickStringField(value, RECHARGE_PLAN_CANDIDATES) || '会员充值';
  const amount = pickFenAmountField(
    value,
    ['amountFen', 'amount', 'rechargeAmountFen', 'totalFen'],
    ['amountYuan', 'amountValue', 'rechargeAmountYuan', 'totalAmount'],
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
    amount,
    pointsAwarded,
    channel,
    createdAt,
  };
};

const mapMemberListItem = (value: unknown, index: number): MemberListItem => {
  if (isServerMemberListItemLike(value)) {
    return mapServerMemberListItem(value);
  }

  const memberId = pickStringField(value, MEMBER_ID_CANDIDATES) || `member-${index + 1}`;
  const memberName = pickStringField(value, MEMBER_NAME_CANDIDATES) || `会员${index + 1}`;
  const phone = maskPhone(pickStringField(value, MEMBER_PHONE_CANDIDATES));
  const partnerLevel = pickStringField(value, PARTNER_LEVEL_CANDIDATES);
  const isPartner = pickBooleanField(value, ['isPartner', 'partner', 'partnerMember']) || Boolean(partnerLevel);

  return {
    id: memberId,
    name: memberName,
    phone,
    avatarChar: resolveAvatarChar(memberName, value),
    avatarColorIdx: resolveAvatarColorIndex(memberId || memberName, value),
    status: normalizeMemberStatus(pickStringField(value, MEMBER_STATUS_CANDIDATES) || 'active'),
    level: normalizeMemberLevel(pickStringField(value, MEMBER_LEVEL_CANDIDATES) || 'free'),
    availablePoints: pickNumberField(value, ['availablePoints', 'pointsBalance', 'pointBalance', 'currentPoints']),
    beanBalance: pickNumberField(value, ['beanBalance', 'beans', 'beanAmount', 'currentBeans']),
    isPartner,
    partnerLevel: partnerLevel || undefined,
    totalRecharged: pickFenAmountField(
      value,
      ['totalRechargedFen', 'totalRecharged', 'rechargeTotalFen', 'totalRechargeAmountFen'],
      ['totalRechargedYuan', 'rechargeTotalAmount', 'totalRechargeAmount'],
    ),
    registeredAt: normalizeTimestamp(isPlainObject(value) ? value.registeredAt ?? value.createdAt ?? value.joinTime : undefined, Date.now() - 30 * DAY_MS),
    lastActiveAt: normalizeTimestamp(isPlainObject(value) ? value.lastActiveAt ?? value.latestActiveAt ?? value.activeAt : undefined, Date.now()),
    invitedCount: pickNumberField(value, ['invitedCount', 'inviteCount', 'referralCount', 'promotionCount']) || undefined,
    rechargeCount: pickNumberField(value, ['rechargeCount', 'rechargeTimes', 'payCount']) || undefined,
    remark: pickStringField(value, REMARK_CANDIDATES) || undefined,
    membershipExpiry: isPlainObject(value) && (value.membershipExpiry === null || value.expireAt === null || value.membershipExpireAt === null)
      ? null
      : normalizeTimestamp(isPlainObject(value) ? value.membershipExpiry ?? value.expireAt ?? value.membershipExpireAt : undefined, 0) || undefined,
  };
};

const mapMemberDetail = (value: unknown): MemberDetail => {
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
    totalRecharged: pickFenAmountField(
      value,
      ['totalRechargedFen', 'totalRecharged', 'rechargeTotalFen', 'totalRechargeAmountFen'],
      ['totalRechargedYuan', 'rechargeTotalAmount', 'totalRechargeAmount'],
    ),
    rechargeCount: pickNumberField(value, ['rechargeCount', 'rechargeTimes', 'payCount']) || rechargeHistory.length,
    invitedCount: pickNumberField(value, ['invitedCount', 'inviteCount', 'referralCount', 'promotionCount']),
    rechargeHistory,
    remark: pickStringField(value, REMARK_CANDIDATES) || undefined,
    membershipExpiry: isPlainObject(value) && (value.membershipExpiry === null || value.expireAt === null || value.membershipExpireAt === null)
      ? null
      : normalizeTimestamp(isPlainObject(value) ? value.membershipExpiry ?? value.expireAt ?? value.membershipExpireAt : undefined, 0) || undefined,
  };
};

const resolveMemberListSource = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (isServerMembersResponseLike(payload)) {
    return payload.items;
  }

  return getNestedArray(payload, MEMBER_LIST_SOURCE_CANDIDATES);
};

const resolveMemberDetailSource = (payload: unknown): unknown | null => {
  if (Array.isArray(payload)) {
    return payload[0] ?? null;
  }

  if (isServerMemberDetailLike(payload)) {
    return payload;
  }

  if (!isPlainObject(payload)) {
    return null;
  }

  return getNestedRecord(payload, MEMBER_DETAIL_SOURCE_CANDIDATES) ?? payload;
};

const requestMemberList = async (query: MemberListQuery): Promise<{ members: MemberListItem[]; stats: MemberListStats }> => {
  const response = await http.get<unknown>(MEMBER_LIST_API_PATH, {
    params: {
      keyword: query.keyword || undefined,
      status: query.status !== 'all' ? query.status : undefined,
      level: query.level !== 'all' ? query.level : undefined,
    },
    skipGlobalErrorHandler: true,
    errorMessage: '获取会员列表失败',
  });

  const memberList = resolveMemberListSource(response)
    .map((item, index) => mapMemberListItem(item, index))
    .map((item) => applyMembershipRevenueToMemberListItem(item));

  return {
    members: memberList,
    stats: buildMemberListStats(memberList, response),
  };
};

const resolveMemberDetailRequestPath = (id: string): { url: string; params?: { id: string } } => {
  if (MEMBER_DETAIL_API_PATH.includes(':id')) {
    return {
      url: MEMBER_DETAIL_API_PATH.replace(':id', encodeURIComponent(id)),
    };
  }

  if (MEMBER_DETAIL_API_PATH.includes('{id}')) {
    return {
      url: MEMBER_DETAIL_API_PATH.replace('{id}', encodeURIComponent(id)),
    };
  }

  if (MEMBER_DETAIL_API_PATH.endsWith('/detail')) {
    return {
      url: MEMBER_DETAIL_API_PATH,
      params: { id },
    };
  }

  return {
    url: `${MEMBER_DETAIL_API_PATH.replace(/\/+$/, '')}/${encodeURIComponent(id)}`,
  };
};

const requestMemberDetail = async (id: string): Promise<MemberDetail | null> => {
  if (!id.trim()) {
    return null;
  }

  const requestTarget = resolveMemberDetailRequestPath(id);
  const response = await http.get<unknown>(requestTarget.url, {
    params: requestTarget.params,
    skipGlobalErrorHandler: true,
    errorMessage: '获取会员详情失败',
  });

  const memberDetailSource = resolveMemberDetailSource(response);
  if (!memberDetailSource) {
    return null;
  }

  return applyMembershipRevenueToMemberDetail(mapMemberDetail(memberDetailSource));
};

const requestMemberPointsPageData = async (): Promise<{
  records: MemberPointsRecord[];
  users: MemberPointsPageUser[];
  stats: MemberPointsStats;
}> => {
  const [recordsResponse, usersResponse] = await Promise.all([
    http.get<unknown>(MEMBER_POINTS_API_PATH, {
      skipGlobalErrorHandler: true,
      errorMessage: '获取积分记录失败',
    }),
    http.get<unknown>(MEMBER_LIST_API_PATH, {
      skipGlobalErrorHandler: true,
      errorMessage: '获取会员列表失败',
    }),
  ]);

  const records = getNestedArray(recordsResponse, POINTS_RECORD_SOURCE_CANDIDATES).map((item, index) => mapPointsRecord(item, index));
  const users: MemberPointsPageUser[] = resolveMemberListSource(usersResponse).map((item, index) => mapUserSnapshot(item, index));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return {
    records,
    users,
    stats: {
      totalRecords: records.length,
      adminAdjustCount: records.filter((record) => record.source === 'admin_adjust').length,
      todayChangeCount: records.filter((record) => record.createdAt >= today.getTime()).length,
    },
  };
};

const requestPartnerBeansPageData = async (): Promise<{
  records: BeanRecord[];
  users: UserSnapshot[];
  stats: PartnerBeansStats;
}> => {
  const [recordsResponse, usersResponse] = await Promise.all([
    http.get<unknown>(PARTNER_BEANS_API_PATH, {
      skipGlobalErrorHandler: true,
      errorMessage: '获取纯利豆记录失败',
    }),
    http.get<unknown>(MEMBER_LIST_API_PATH, {
      params: { partner: true },
      skipGlobalErrorHandler: true,
      errorMessage: '获取合伙人列表失败',
    }),
  ]);

  const records = getNestedArray(recordsResponse, POINTS_RECORD_SOURCE_CANDIDATES).map((item, index) => mapBeanRecord(item, index));
  const rawUsers = getNestedArray(usersResponse, PARTNER_USERS_SOURCE_CANDIDATES);
  const users = rawUsers
    .map((item, index) => mapUserSnapshot(item, index))
    .filter((user) => user.isPartner || user.beanBalance > 0);

  return {
    records,
    users,
    stats: {
      totalRecords: records.length,
      adminAdjustCount: records.filter((record) => record.source === 'admin_adjust').length,
      withdrawCount: records.filter((record) => record.source === 'withdrawal').length,
      promoRewardCount: records.filter((record) => record.source === 'promo_reward').length,
    },
  };
};

const buildAdjustPayload = (memberId: string, delta: number, reason: string): Record<string, unknown> => ({
  memberId,
  userId: memberId,
  id: memberId,
  delta,
  amount: Math.abs(delta),
  direction: delta >= 0 ? 'add' : 'subtract',
  reason,
});

const resolveMemberActionPath = (rawPath: string, memberId: string): { url: string; params?: { id: string } } => {
  if (rawPath.includes(':id')) {
    return {
      url: rawPath.replace(':id', encodeURIComponent(memberId)),
    };
  }

  if (rawPath.includes('{id}')) {
    return {
      url: rawPath.replace('{id}', encodeURIComponent(memberId)),
    };
  }

  return {
    url: `${rawPath.replace(/\/+$/, '')}/${encodeURIComponent(memberId)}`,
    params: undefined,
  };
};

const buildMemberStatusPayload = (
  memberId: string,
  nextStatus: MemberStatus,
  reason?: string,
): Record<string, unknown> => ({
  memberId,
  userId: memberId,
  id: memberId,
  status: nextStatus,
  memberStatus: nextStatus,
  reason,
  remark: reason,
});

const submitMemberStatusRequest = async (
  rawPath: string,
  memberId: string,
  nextStatus: MemberStatus,
  reason?: string,
): Promise<void> => {
  const requestTarget = resolveMemberActionPath(rawPath, memberId);
  await http.post<unknown, Record<string, unknown>>(requestTarget.url, buildMemberStatusPayload(memberId, nextStatus, reason), {
    params: requestTarget.params,
    skipGlobalErrorHandler: true,
    errorMessage: nextStatus === 'banned' ? '封禁会员失败，请稍后重试' : '解封会员失败，请稍后重试',
  });
};

/** 广播会员状态变更，驱动列表与详情跨页面刷新。 */
export const emitMemberStatusSync = (payload: MemberStatusSyncPayload): void => {
  window.dispatchEvent(new CustomEvent<MemberStatusSyncPayload>(MEMBER_STATUS_SYNC_EVENT, { detail: payload }));
};

/** 广播会员等级设置产生的收入，驱动充值收入相关页面刷新。 */
export const emitMembershipRevenueSync = (payload: MembershipRevenueSyncPayload): void => {
  if (typeof window === 'undefined') {
    return;
  }

  appendMembershipRevenueSyncEvent(payload);
  window.dispatchEvent(new CustomEvent<MembershipRevenueSyncPayload>(MEMBERSHIP_REVENUE_SYNC_EVENT, { detail: payload }));
};

/** 提交会员积分调整。 */
export const submitMemberPointsAdjustment = async (memberId: string, delta: number, reason: string): Promise<void> => {
  const requestTarget = resolveMemberActionPath(ADJUST_MEMBER_POINTS_API_PATH, memberId);
  await http.post<unknown, Record<string, unknown>>(requestTarget.url, buildAdjustPayload(memberId, delta, reason), {
    params: requestTarget.params,
    skipGlobalErrorHandler: true,
    errorMessage: '积分调整失败，请稍后重试',
  });
};

/** 提交会员纯利豆调整。 */
export const submitMemberBeansAdjustment = async (memberId: string, delta: number, reason: string): Promise<void> => {
  const requestTarget = resolveMemberActionPath(ADJUST_PARTNER_BEANS_API_PATH, memberId);
  await http.post<unknown, Record<string, unknown>>(requestTarget.url, buildAdjustPayload(memberId, delta, reason), {
    params: requestTarget.params,
    skipGlobalErrorHandler: true,
    errorMessage: '纯利豆调整失败，请稍后重试',
  });
};

/** 提交会员等级设置。 */
export const submitMemberMembership = async (
  memberId: string,
  level: MemberLevel,
  membershipExpiry: number | null,
  options?: { memberName?: string; amountFen?: number },
): Promise<void> => {
  const requestTarget = resolveMemberActionPath(SET_MEMBERSHIP_API_PATH, memberId);
  const isNonExpiringLevel = level === 'free';

  if (!isNonExpiringLevel && (membershipExpiry === null || !Number.isFinite(membershipExpiry))) {
    throw new Error('缺少有效的会员到期时间');
  }

  const payload: Record<string, unknown> = {
    level,
  };

  if (isNonExpiringLevel) {
    payload.membershipExpiry = null;
  } else {
    payload.membershipExpiry = membershipExpiry;
  }

  await http.post<unknown, Record<string, unknown>>(requestTarget.url, payload, {
    params: requestTarget.params,
    skipGlobalErrorHandler: true,
    errorMessage: '会员等级设置失败，请稍后重试',
  });

  if (level !== 'free') {
    const config = MEMBERSHIP_REVENUE_CONFIG[level];
    emitMembershipRevenueSync({
      memberId,
      memberName: options?.memberName?.trim() || `会员${memberId}`,
      level,
      amountFen: level === 'lifetime' && typeof options?.amountFen === 'number'
        ? options.amountFen
        : config.amountFen,
      planName: config.planName,
      revenueTypeLabel: config.revenueTypeLabel,
      createdAt: Date.now(),
    });
  }
};

/** 提交会员封禁。 */
export const submitMemberBan = async (memberId: string, reason: string): Promise<void> => {
  await submitMemberStatusRequest(MEMBER_BAN_API_PATH, memberId, 'banned', reason);
};

/** 提交会员解封。 */
export const submitMemberUnban = async (memberId: string): Promise<void> => {
  await submitMemberStatusRequest(MEMBER_UNBAN_API_PATH, memberId, 'active');
};

/** 获取积分页主数据。 */
export const fetchMemberPointsPageData = createKeyedInFlightRequest(
  () => 'member-points-page',
  async () => requestMemberPointsPageData(),
);

/** 获取纯利豆页主数据。 */
export const fetchPartnerBeansPageData = createKeyedInFlightRequest(
  () => 'partner-beans-page',
  async () => requestPartnerBeansPageData(),
);

/** 获取会员列表，并按查询条件对并发请求做去重。 */
export const fetchMemberList = createKeyedInFlightRequest(
  (query: MemberListQuery) => JSON.stringify(query),
  async (query: MemberListQuery): Promise<{ members: MemberListItem[]; stats: MemberListStats }> => requestMemberList(query),
);

/** 获取会员详情，并按会员 id 对并发请求做去重。 */
export const fetchMemberDetail = createKeyedInFlightRequest(
  (id: string) => id,
  async (id: string): Promise<MemberDetail | null> => requestMemberDetail(id),
);

/** 提交子账号配额设置（平台侧，仅允许年/永久会员商家）。 */
export const submitSubAccountQuota = async (
  memberId: string,
  quota: number,
  roleSummary: SubAccountRoleSummary[],
): Promise<void> => {
  const requestTarget = resolveMemberActionPath(SET_SUB_ACCOUNT_QUOTA_API_PATH, memberId);
  await http.post<unknown, Record<string, unknown>>(
    requestTarget.url,
    {
      memberId,
      quota,
      roleSummary: roleSummary.map((item) => ({
        slot: item.slot,
        role: item.role,
        status: item.status,
        isAssigned: item.isAssigned,
        ...(item.username ? { username: item.username } : {}),
        ...(item.password ? { password: item.password } : {}),
      })),
    },
    {
      params: requestTarget.params,
      skipGlobalErrorHandler: true,
      errorMessage: '子账号配额设置失败，请稍后重试',
    },
  );
};
