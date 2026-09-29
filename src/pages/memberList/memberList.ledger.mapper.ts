// 积分 / 纯利豆流水映射：把流水行收敛成页面展示模型，并回填会员快照字段。
import { safeNum } from '@utils/utils';
import type { MemberPointsPageUser, MemberPointsRecord } from '../memberPoints/memberPoints.types';
import type { BeanRecord, UserSnapshot } from '../partnerBeans/partnerBeans.shared.types';
import { mapMemberListItem } from './memberList.member.mapper';
import {
  isPlainObject,
  normalizeBeanSource,
  normalizePointsSource,
  normalizeTimestamp,
  pickNumberField,
  pickStringField,
} from './memberList.normalize';

/** 积分 / 纯利豆流水列表来源候选字段。 */
export const POINTS_RECORD_SOURCE_CANDIDATES = ['records', 'list', 'items', 'rows', 'data'] as const;
/** 合伙人 / 会员快照来源候选字段。 */
export const PARTNER_USERS_SOURCE_CANDIDATES = ['partners', 'partnerUsers', 'users', 'members', 'list', 'items', 'rows', 'data'] as const;
const RELATED_USER_CANDIDATES = ['relatedUser', 'referralUserName', 'inviteeName', 'promotedUserName'] as const;

/** 流水页用到的会员轻量快照。 */
export const mapUserSnapshot = (value: unknown, index: number): UserSnapshot => {
  const member = mapMemberListItem(value, index);
  return {
    id: member.id,
    name: member.name,
    phone: member.phone,
    availablePoints: member.availablePoints,
    beanBalance: member.beanBalance,
    isPartner: member.isPartner,
    avatarUrl: member.avatarUrl,
  };
};

/** 积分流水行映射：未匹配到会员时用行内字段与序号兜底。 */
export const mapPointsRecord = (
  value: unknown,
  index: number,
  userLookup?: Map<string, MemberPointsPageUser>,
): MemberPointsRecord => {
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

  const matchedUser = userLookup?.get(userId);
  const rawAvatarUrl = (isPlainObject(value) && typeof value.avatarUrl === 'string' && value.avatarUrl.trim())
    ? value.avatarUrl.trim()
    : undefined;
  const avatarUrl = rawAvatarUrl || matchedUser?.avatarUrl || undefined;
  // 会员快照可能来自缓存，余额兜底统一过 safeNum，避免 NaN 透传到 UI
  const availablePoints = safeNum(
    pickNumberField(value, ['availablePoints', 'pointsBalance', 'pointBalance', 'currentPoints', 'balanceBefore', 'balance'])
    || matchedUser?.availablePoints
    || 0,
  );

  return {
    id: pickStringField(value, ['id', 'recordId']) || `pts-${index + 1}`,
    userId,
    userName,
    userPhone: pickStringField(value, ['userPhone', 'phone', 'mobile']) || matchedUser?.phone || '',
    avatarUrl,
    availablePoints,
    amount,
    type,
    source,
    description: pickStringField(value, ['description', 'reason', 'remark', 'note']) || '管理员调整积分',
    createdAt: normalizeTimestamp(isPlainObject(value) ? value.createdAt ?? value.createTime ?? value.time : undefined, Date.now()),
    expireAt: normalizeTimestamp(isPlainObject(value) ? value.expireAt : undefined, 0) || undefined,
  };
};

/** 纯利豆流水行映射：与积分流水同构，来源枚举与余额字段不同。 */
export const mapBeanRecord = (
  value: unknown,
  index: number,
  userLookup?: Map<string, UserSnapshot>,
): BeanRecord => {
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

  const matchedUser = userLookup?.get(userId);
  const rawAvatarUrl = isPlainObject(value) && typeof value.avatarUrl === 'string' ? value.avatarUrl.trim() : undefined;
  const avatarUrl = rawAvatarUrl || matchedUser?.avatarUrl || undefined;
  // 与积分余额同理：缓存快照里的脏值不能透传到 UI
  const beanBalance = safeNum(
    pickNumberField(value, ['beanBalance', 'beans', 'beanAmount', 'currentBeans', 'balanceAfter', 'afterBalance'])
    || matchedUser?.beanBalance
    || 0,
  );

  return {
    id: pickStringField(value, ['id', 'recordId']) || `bean-${index + 1}`,
    userId,
    userName,
    userPhone: pickStringField(value, ['userPhone', 'phone', 'mobile']) || matchedUser?.phone || '',
    avatarUrl,
    beanBalance,
    amount,
    type,
    source,
    description: pickStringField(value, ['description', 'reason', 'remark', 'note']) || '管理员调整纯利豆',
    relatedPromoId: pickStringField(value, ['relatedPromoId', 'promoId']) || undefined,
    relatedUser: pickStringField(value, RELATED_USER_CANDIDATES) || undefined,
    createdAt: normalizeTimestamp(isPlainObject(value) ? value.createdAt ?? value.createTime ?? value.time : undefined, Date.now()),
  };
};
