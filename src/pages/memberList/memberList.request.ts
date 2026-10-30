// 会员模块读请求：列表、详情、积分页与纯利豆页的原始请求与响应解包。
import { http } from '@utils/http';
import { safeNum } from '@utils/utils';
import {
  MEMBER_LIST_API_PATH,
  MEMBER_POINTS_API_PATH,
  PARTNER_BEANS_API_PATH,
  resolveMemberDetailRequestPath,
} from './memberList.apiPaths';
import {
  mapBeanRecord,
  mapPointsRecord,
  mapUserSnapshot,
  POINTS_RECORD_SOURCE_CANDIDATES,
} from './memberList.ledger.mapper';
import { buildMemberListStats, mapMemberDetail, mapMemberListItem } from './memberList.member.mapper';
import {
  getNestedArray,
  getNestedRecord,
  isFiniteNumber,
  isPlainObject,
  pickNumberField,
  pickStringField,
} from './memberList.normalize';
import {
  PARTNER_BEANS_EMPTY_STATS,
  PARTNER_BEANS_PAGE_SIZE,
  PARTNER_BEANS_USERS_PAGE_SIZE,
} from '../partnerBeans/partnerBeans.constants';
import type {
  PartnerBeansRecordPage,
  PartnerBeansRecordRequestParams,
  PartnerBeansUserPage,
  PartnerBeansUserRequestParams,
} from '../partnerBeans/partnerBeans.types';
import type { MemberDetail, MemberListPageResult, MemberListQuery } from './memberList.types';
import { isServerMemberDetailLike, isServerMembersResponseLike } from './memberList.dto';
import {
  MEMBER_POINTS_EMPTY_STATS,
  MEMBER_POINTS_OVERVIEW_PAGE_SIZE,
  MEMBER_POINTS_PAGE_SIZE,
} from '../memberPoints/memberPoints.constants';
import type {
  MemberPointsPageUser,
  MemberPointsRecordPage,
  MemberPointsRecordRequestParams,
  MemberPointsStats,
  MemberPointsUserPage,
  MemberPointsUserRequestParams,
} from '../memberPoints/memberPoints.types';
import type { PartnerBeansStats, UserSnapshot } from '../partnerBeans/partnerBeans.shared.types';

const MEMBER_LIST_SOURCE_CANDIDATES = ['list', 'items', 'records', 'rows', 'members', 'data'] as const;
const MEMBER_DETAIL_SOURCE_CANDIDATES = ['member', 'detail', 'profile', 'info', 'data'] as const;

/** 会员列表切片来源：分页响应优先，其次是嵌套数组，最后是裸数组。 */
const resolveMemberListSource = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (isServerMembersResponseLike(payload)) {
    return payload.items;
  }

  return getNestedArray(payload, MEMBER_LIST_SOURCE_CANDIDATES);
};

/** 会员详情来源：数组取首项，分页响应用嵌套对象，最后是响应本身。 */
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

/** 提取当前筛选条件下的会员总数：优先后端 total，缺失时回退已加载条数。 */
const resolveMemberListTotal = (payload: unknown, loadedCount: number): number => {
  if (isServerMembersResponseLike(payload)) {
    return safeNum(payload.total);
  }

  if (isPlainObject(payload)) {
    const total = pickNumberField(payload, ['total', 'totalCount']);
    if (isFiniteNumber(total) && total > 0) {
      return total;
    }
  }

  return loadedCount;
};

/** 会员列表单页请求：筛选与分页全部由后端权威处理。 */
export const requestMemberList = async (query: MemberListQuery, page: number, pageSize: number): Promise<MemberListPageResult> => {
  const response = await http.get<unknown>(MEMBER_LIST_API_PATH, {
    params: {
      keyword: query.keyword || undefined,
      status: query.status !== 'all' ? query.status : undefined,
      level: query.level !== 'all' ? query.level : undefined,
      expiry: query.expiry !== 'all' ? query.expiry : undefined,
      // 排序：默认顺序不下发，避免后端为无排序请求白跑一次聚合
      sortBy: query.sortBy !== 'default' ? query.sortBy : undefined,
      sortOrder: query.sortBy !== 'default' ? query.sortOrder : undefined,
      // 待补录清单：由后端按「有子账号能力 + 缺子账号加价」筛选，前端只传开关
      ...(query.pendingSubAccountBackfill
        ? { pendingSubAccountBackfill: true }
        : {}),
      // 已调续费价清单：由后端按「存在议定价覆盖」筛选，前端只传开关
      ...(query.renewalPriceAdjusted
        ? { renewalPriceAdjusted: true }
        : {}),
      // 分页参数：到期时间等所有筛选均由后端权威过滤，前端不再客户端补充过滤
      //（客户端过滤会破坏分页切片的正确性）
      page,
      pageSize,
    },
    skipGlobalErrorHandler: true,
    errorMessage: '获取会员列表失败',
  });

  const memberList = resolveMemberListSource(response)
    .map((item, index) => mapMemberListItem(item, index));

  const total = resolveMemberListTotal(response, memberList.length);

  return {
    members: memberList,
    stats: buildMemberListStats(memberList, response),
    total,
    hasMore: memberList.length < total,
  };
};

/** 会员详情请求：id 为空时直接返回 null，不发请求。 */
export const requestMemberDetail = async (id: string): Promise<MemberDetail | null> => {
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

  return mapMemberDetail(memberDetailSource);
};

/**
 * 会员积分流水单页（游标分页）。
 *
 * Tab 与关键词下推后端：分页后前端只有一页数据，本地过滤只会过滤到已加载的页。
 * 流水行不带「变动后积分」，可用积分统一用会员快照回填。
 */
export const requestMemberPointsRecords = async (
  params: MemberPointsRecordRequestParams,
): Promise<MemberPointsRecordPage> => {
  const response = await http.get<unknown>(MEMBER_POINTS_API_PATH, {
    params: {
      pointsTab: params.query.tab === 'all' ? undefined : params.query.tab,
      keyword: params.query.keyword.trim() || undefined,
      // 单会员（门店）过滤：积分一览点击进入单会员变动记录时下发
      storeId: params.query.storeId ?? undefined,
      cursor: params.cursor ?? undefined,
      limit: MEMBER_POINTS_PAGE_SIZE,
    },
    signal: params.signal,
    skipGlobalErrorHandler: true,
    errorMessage: '获取积分记录失败',
  });

  const userLookup = new Map<string, MemberPointsPageUser>(params.users.map((user) => [user.id, user]));
  const records = getNestedArray(response, POINTS_RECORD_SOURCE_CANDIDATES)
    .map((item, index) => mapPointsRecord(item, index, userLookup));
  const nextCursor = pickStringField(response, LOG_CURSOR_CANDIDATES) || null;
  // 游标分页只能靠 cursor 往下翻：没有游标就没有下一页，
  // 否则底部会留一个点了没反应的「加载更多」；后端明确给出 hasMore:false 时同样尊重
  const hasMore = Boolean(nextCursor)
    && pickOptionalBoolean(response, LOG_HAS_MORE_CANDIDATES) !== false;

  return {
    records,
    stats: resolveMemberPointsStats(response),
    hasMore,
    nextCursor,
  };
};

/**
 * 会员积分一览单页（页码分页）：筛选与分页全部下推后端，前端不做本地切片。
 *
 * 与纯利豆的合伙人余额一览同口径：一览自己翻页，流水行不再依赖「一次性全量快照」，
 * 单会员变动记录只传当前会员作快照即可回填头像与可用积分。
 */
export const requestMemberPointsUserPage = async (
  params: MemberPointsUserRequestParams,
): Promise<MemberPointsUserPage> => {
  const response = await http.get<unknown>(MEMBER_LIST_API_PATH, {
    params: {
      keyword: params.keyword.trim() || undefined,
      page: params.page,
      pageSize: MEMBER_POINTS_OVERVIEW_PAGE_SIZE,
    },
    signal: params.signal,
    skipGlobalErrorHandler: true,
    errorMessage: '获取会员列表失败',
  });

  const users = resolveMemberListSource(response)
    .map((item, index) => mapUserSnapshot(item, index));
  // total 缺失时回退已加载条数：此时「整页拉满」视为可能还有下一页，
  // 多翻一次空页即可停住，比提前断流更安全
  const total = resolveMemberListTotal(response, users.length);
  const hasMore = total > users.length
    ? params.page * MEMBER_POINTS_OVERVIEW_PAGE_SIZE < total
    : users.length >= MEMBER_POINTS_OVERVIEW_PAGE_SIZE;

  return {
    users,
    total,
    hasMore,
    nextPage: hasMore ? params.page + 1 : null,
  };
};

const LOG_CURSOR_CANDIDATES = ['nextCursor', 'cursor'] as const;
const LOG_HAS_MORE_CANDIDATES = ['hasMore', 'hasNext'] as const;
const LOG_STATS_CANDIDATES = ['stats', 'summary', 'overview'] as const;

/** 读取可选布尔字段：缺失时返回 undefined，由调用方决定兜底口径。 */
const pickOptionalBoolean = (value: unknown, keys: readonly string[]): boolean | undefined => {
  if (!isPlainObject(value)) {
    return undefined;
  }

  for (const key of keys) {
    if (typeof value[key] === 'boolean') {
      return value[key];
    }
  }

  return undefined;
};

/**
 * 解析后端返回的流水统计。
 *
 * 统计由后端按「当前筛选 + 完整结果集」计数，前端不再对已加载页二次统计 ——
 * 分页后前端只有一页数据，本地 count 会让概览卡数字随加载量变化。
 */
const resolveMemberPointsStats = (response: unknown): MemberPointsStats => {
  const rawStats = getNestedRecord(response, LOG_STATS_CANDIDATES);
  if (!rawStats) {
    return MEMBER_POINTS_EMPTY_STATS;
  }

  return {
    totalRecords: pickNumberField(rawStats, ['totalRecords', 'total']),
    adminAdjustCount: pickNumberField(rawStats, ['adminAdjustCount']),
    todayChangeCount: pickNumberField(rawStats, ['todayChangeCount']),
  };
};

const resolvePartnerBeanStats = (response: unknown): PartnerBeansStats => {
  const rawStats = getNestedRecord(response, LOG_STATS_CANDIDATES);
  if (!rawStats) {
    return PARTNER_BEANS_EMPTY_STATS;
  }

  return {
    totalRecords: pickNumberField(rawStats, ['totalRecords', 'total']),
    adminAdjustCount: pickNumberField(rawStats, ['adminAdjustCount']),
    withdrawCount: pickNumberField(rawStats, ['withdrawCount']),
    promoRewardCount: pickNumberField(rawStats, ['promoRewardCount']),
  };
};

/** 合伙人余额一览单页（页码分页）：筛选与分页全部下推后端，前端不做本地切片。 */
export const requestPartnerBeanUserPage = async (
  params: PartnerBeansUserRequestParams,
): Promise<PartnerBeansUserPage> => {
  const response = await http.get<unknown>(MEMBER_LIST_API_PATH, {
    params: {
      partner: true,
      keyword: params.keyword.trim() || undefined,
      page: params.page,
      pageSize: PARTNER_BEANS_USERS_PAGE_SIZE,
    },
    signal: params.signal,
    skipGlobalErrorHandler: true,
    errorMessage: '获取合伙人列表失败',
  });

  const users = resolveMemberListSource(response)
    .map((item, index) => mapUserSnapshot(item, index));
  // total 缺失时回退已加载条数：此时「整页拉满」视为可能还有下一页，
  // 多翻一次空页即可停住，比提前断流更安全
  const total = resolveMemberListTotal(response, users.length);
  const hasMore = total > users.length
    ? params.page * PARTNER_BEANS_USERS_PAGE_SIZE < total
    : users.length >= PARTNER_BEANS_USERS_PAGE_SIZE;

  return {
    users,
    total,
    hasMore,
    nextPage: hasMore ? params.page + 1 : null,
  };
};

/**
 * 纯利豆流水单页（游标分页）。
 *
 * Tab 与关键词下推后端：分页后前端只有一页数据，本地过滤只会过滤到已加载的页。
 * 流水行没有余额字段，余额与头像统一用合伙人快照回填。
 */
export const requestPartnerBeanRecords = async (
  params: PartnerBeansRecordRequestParams,
): Promise<PartnerBeansRecordPage> => {
  const response = await http.get<unknown>(PARTNER_BEANS_API_PATH, {
    params: {
      beanTab: params.query.tab === 'all' ? undefined : params.query.tab,
      keyword: params.query.keyword.trim() || undefined,
      // 单合伙人（门店）过滤：余额一览点击进入详情时下发
      storeId: params.query.storeId ?? undefined,
      cursor: params.cursor ?? undefined,
      limit: PARTNER_BEANS_PAGE_SIZE,
    },
    signal: params.signal,
    skipGlobalErrorHandler: true,
    errorMessage: '获取纯利豆记录失败',
  });

  const userLookup = new Map<string, UserSnapshot>(params.users.map((user) => [user.id, user]));
  const records = getNestedArray(response, POINTS_RECORD_SOURCE_CANDIDATES)
    .map((item, index) => mapBeanRecord(item, index, userLookup));
  const nextCursor = pickStringField(response, LOG_CURSOR_CANDIDATES) || null;
  // 游标分页只能靠 cursor 往下翻：没有游标就没有下一页，
  // 否则底部会留一个点了没反应的「加载更多」；后端明确给出 hasMore:false 时同样尊重
  const hasMore = Boolean(nextCursor)
    && pickOptionalBoolean(response, LOG_HAS_MORE_CANDIDATES) !== false;

  return {
    records,
    stats: resolvePartnerBeanStats(response),
    hasMore,
    nextCursor,
  };
};
