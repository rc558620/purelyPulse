// 会员记录管理服务层：跨会员拉取四类记录，并做字段容错与展示值归一。
//
// 后端契约（与 /pulse/membership/admin/points/logs 共用同一套游标分页习惯）：
//   GET  {MEMBER_RECORDS_API_PATH}
//     phone / name / date / startDate / endDate / level / type / cursor / limit
//   → { items, hasMore, nextCursor }
//
// 四类记录分别来自充值流水、等级设置、改价审计、子账号额度审计四张留痕表，
// 后端已统一成同一行结构；前端只做字段容错，不做任何金额换算（金额一律用 xxxDisplay）。
import { ApiError, http, resolveEnvPath } from '@utils/http';
import { safeNum } from '@utils/utils';
import type {
  MemberRecordItem,
  MemberRecordsPage,
  MemberRecordsQuery,
  MemberRecordType,
} from './memberRecords.types';

const MEMBER_RECORDS_API_PATH = resolveEnvPath(
  import.meta.env.VITE_MEMBER_RECORDS_API_PATH,
  '/pulse/membership/admin/member-records',
);

const RECORD_ITEMS_SOURCE_CANDIDATES = ['items', 'records', 'list', 'rows', 'data'] as const;
const RECORD_TYPE_CANDIDATES = ['type', 'recordType', 'category', 'kind'] as const;
const RECORD_ID_CANDIDATES = ['id', 'recordId', 'logId'] as const;
const RECORD_MEMBER_ID_CANDIDATES = ['memberId', 'userId', 'uid'] as const;
const RECORD_MEMBER_NAME_CANDIDATES = ['memberName', 'name', 'nickname', 'userName'] as const;
const RECORD_MEMBER_PHONE_CANDIDATES = ['memberPhone', 'phone', 'mobile', 'phoneNumber'] as const;
const RECORD_PLAN_NAME_CANDIDATES = ['planName', 'packageName', 'productName', 'membershipName'] as const;
const RECORD_AMOUNT_CANDIDATES = ['amountDisplay', 'amountText'] as const;
const RECORD_POINTS_CANDIDATES = ['pointsAwarded', 'points', 'grantedPoints'] as const;
const RECORD_CHANNEL_CANDIDATES = ['channel', 'payChannel', 'paymentChannel', 'paymentType'] as const;
const RECORD_OPERATOR_CANDIDATES = ['operatorName', 'operator', 'adminName'] as const;
const RECORD_OLD_PRICE_CANDIDATES = ['oldValueDisplay', 'oldPriceDisplay'] as const;
const RECORD_NEW_PRICE_CANDIDATES = ['newValueDisplay', 'newPriceDisplay'] as const;
const RECORD_OLD_QUOTA_CANDIDATES = ['oldQuota', 'previousQuota'] as const;
const RECORD_NEW_QUOTA_CANDIDATES = ['newQuota', 'quota', 'subAccountQuota'] as const;
const RECORD_REASON_CANDIDATES = ['reason', 'remark', 'note'] as const;
const RECORD_TIME_CANDIDATES = ['createdAt', 'createdTime', 'timestamp', 'time'] as const;
const RECORD_CURSOR_CANDIDATES = ['nextCursor', 'cursor'] as const;
const RECORD_HAS_MORE_CANDIDATES = ['hasMore', 'hasNext'] as const;

/** 记录类型白名单：后端返回未知类型时按当前查询类型兜底，避免整条记录被丢掉。 */
const MEMBER_RECORD_TYPES: readonly MemberRecordType[] = ['recharge', 'adminGrant', 'renewalAdjust', 'subAccount'];

/** 支付渠道白名单（与 RechargeRecord['channel'] 对齐）。 */
const RECHARGE_CHANNELS = ['wechat', 'alipay', 'card', 'manual', 'admin', 'gift'] as const;

const isPlainObject = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

/** 从候选字段名里取第一个命中的数组（后端字段命名在四类记录间并不完全统一）。 */
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
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return String(candidate);
    }
  }

  return '';
};

const pickNumberField = (value: unknown, keys: readonly string[]): number => {
  if (!isPlainObject(value)) {
    return 0;
  }

  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return safeNum(candidate);
    }
    if (typeof candidate === 'string' && candidate.trim() && Number.isFinite(Number(candidate))) {
      return safeNum(Number(candidate));
    }
  }

  return 0;
};

/** 读取布尔字段；字段不存在时返回 undefined（用于区分「没给」与「明确给了 false」）。 */
const pickOptionalBooleanField = (value: unknown, keys: readonly string[]): boolean | undefined => {
  if (!isPlainObject(value)) {
    return undefined;
  }

  for (const key of keys) {
    if (typeof value[key] === 'boolean') {
      return value[key] as boolean;
    }
  }

  return undefined;
};

/** 归一化记录类型：未知类型按当前查询的类型兜底。 */
const normalizeRecordType = (value: unknown, fallback: MemberRecordType): MemberRecordType => {
  const rawType = pickStringField(value, RECORD_TYPE_CANDIDATES);
  return MEMBER_RECORD_TYPES.find((type) => type === rawType) ?? fallback;
};

/** 归一化支付渠道：非充值类记录没有渠道，返回 null 让行渲染跳过渠道文案。 */
const normalizeChannel = (value: unknown): MemberRecordItem['channel'] => {
  const rawChannel = pickStringField(value, RECORD_CHANNEL_CANDIDATES);
  return RECHARGE_CHANNELS.find((channel) => channel === rawChannel) ?? null;
};

/**
 * 取变更前 / 变更后的展示值。
 *
 * 调整续费记录用价格展示字段；子账号记录后端给的是数值额度，这里折算成「N 个」，
 * 让两种变更在行上都能用同一套「新值 + 原值」渲染。
 */
const resolveValueDisplays = (
  value: unknown,
  type: MemberRecordType,
): Pick<MemberRecordItem, 'oldValueDisplay' | 'newValueDisplay'> => {
  if (type === 'subAccount') {
    const quotaKeys = [...RECORD_OLD_QUOTA_CANDIDATES, ...RECORD_NEW_QUOTA_CANDIDATES];
    const hasQuota = isPlainObject(value) && quotaKeys.some((key) => key in value);
    if (!hasQuota) {
      return { oldValueDisplay: null, newValueDisplay: null };
    }

    return {
      oldValueDisplay: `${safeNum(pickNumberField(value, RECORD_OLD_QUOTA_CANDIDATES))} 个`,
      newValueDisplay: `${safeNum(pickNumberField(value, RECORD_NEW_QUOTA_CANDIDATES))} 个`,
    };
  }

  if (type === 'renewalAdjust') {
    return {
      oldValueDisplay: pickStringField(value, RECORD_OLD_PRICE_CANDIDATES) || null,
      newValueDisplay: pickStringField(value, RECORD_NEW_PRICE_CANDIDATES) || null,
    };
  }

  return { oldValueDisplay: null, newValueDisplay: null };
};

/** 原始记录 → 时间轴行；非对象脏数据直接丢弃，避免渲染期崩在取字段上。 */
const mapMemberRecord = (
  value: unknown,
  index: number,
  fallbackType: MemberRecordType,
): MemberRecordItem | null => {
  if (!isPlainObject(value)) {
    return null;
  }

  const type = normalizeRecordType(value, fallbackType);
  const displays = resolveValueDisplays(value, type);

  return {
    id: pickStringField(value, RECORD_ID_CANDIDATES) || `${type}-${index}`,
    type,
    memberId: pickStringField(value, RECORD_MEMBER_ID_CANDIDATES),
    memberName: pickStringField(value, RECORD_MEMBER_NAME_CANDIDATES),
    memberPhone: pickStringField(value, RECORD_MEMBER_PHONE_CANDIDATES),
    planName: pickStringField(value, RECORD_PLAN_NAME_CANDIDATES),
    amountDisplay: pickStringField(value, RECORD_AMOUNT_CANDIDATES) || null,
    pointsAwarded: pickNumberField(value, RECORD_POINTS_CANDIDATES),
    channel: normalizeChannel(value),
    operatorName: pickStringField(value, RECORD_OPERATOR_CANDIDATES) || null,
    oldValueDisplay: displays.oldValueDisplay,
    newValueDisplay: displays.newValueDisplay,
    reason: pickStringField(value, RECORD_REASON_CANDIDATES) || null,
    createdAt: pickNumberField(value, RECORD_TIME_CANDIDATES),
  };
};

/** 解析一页记录：游标字段与积分 / 纯利豆流水保持一致（hasMore + nextCursor）。 */
const resolveMemberRecordsPage = (response: unknown, fallbackType: MemberRecordType): MemberRecordsPage => {
  const items = getNestedArray(response, RECORD_ITEMS_SOURCE_CANDIDATES)
    .map((item, index) => mapMemberRecord(item, index, fallbackType))
    .filter((item): item is MemberRecordItem => item !== null);

  const nextCursor = pickStringField(response, RECORD_CURSOR_CANDIDATES) || null;
  // 游标分页只能靠 cursor 往下翻：没有游标就没有下一页（否则底部会留一个点了没反应的「加载更多」），
  // 后端明确给了 hasMore:false 时同样尊重；只有「有游标且没说 false」才算还有更多
  const hasMore = Boolean(nextCursor) && pickOptionalBooleanField(response, RECORD_HAS_MORE_CANDIDATES) !== false;

  return { items, hasMore, nextCursor };
};

const DEFAULT_FETCH_ERROR_MESSAGE = '获取会员记录失败，请稍后重试';

/**
 * 归一化错误文案。
 *
 * 业务信封错误（HTTP 200 + 业务码）里后端给的是可读原因，直接用；
 * 传输层错误（404 / 5xx）的 message 常常是「Cannot GET /api/...」这类框架原文，
 * 原样展示到列表卡上只会让运营看不懂，统一换成一句人话。
 */
const resolveFetchErrorMessage = (error: unknown): Error => {
  if (error instanceof ApiError && (error.statusCode === undefined || error.statusCode < 400)) {
    return new Error(error.message || DEFAULT_FETCH_ERROR_MESSAGE);
  }

  return new Error(DEFAULT_FETCH_ERROR_MESSAGE);
};

interface FetchMemberRecordsOptions {
  query: MemberRecordsQuery;
  /** 游标：null 表示拉第一页。 */
  cursor: string | null;
  limit: number;
}

/** 拉取一页会员记录（游标分页）。 */
export const fetchMemberRecords = async ({
  query,
  cursor,
  limit,
}: FetchMemberRecordsOptions): Promise<MemberRecordsPage> => {
  try {
    const response = await http.get<unknown>(MEMBER_RECORDS_API_PATH, {
      params: {
        phone: query.phone || undefined,
        name: query.name || undefined,
        date: query.date || undefined,
        startDate: query.startDate || undefined,
        endDate: query.endDate || undefined,
        level: query.level !== 'all' ? query.level : undefined,
        type: query.type !== 'all' ? query.type : undefined,
        cursor: cursor ?? undefined,
        limit,
      },
      skipGlobalErrorHandler: true,
      errorMessage: DEFAULT_FETCH_ERROR_MESSAGE,
    });

    return resolveMemberRecordsPage(response, query.type === 'all' ? 'recharge' : query.type);
  } catch (error) {
    throw resolveFetchErrorMessage(error);
  }
};
