// 会员模块读请求：列表、详情、积分页与纯利豆页的原始请求与响应解包。
import { STORAGE_KEYS } from '@constants/storageKeys';
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
  PARTNER_USERS_SOURCE_CANDIDATES,
  POINTS_RECORD_SOURCE_CANDIDATES,
} from './memberList.ledger.mapper';
import { buildMemberListStats, mapMemberDetail, mapMemberListItem } from './memberList.member.mapper';
import { getNestedArray, getNestedRecord, isFiniteNumber, isPlainObject, pickNumberField } from './memberList.normalize';
import type { MemberDetail, MemberListPageResult, MemberListQuery } from './memberList.types';
import { isServerMemberDetailLike, isServerMembersResponseLike } from './memberList.dto';
import type { MemberPointsPageUser, MemberPointsRecord, MemberPointsStats } from '../memberPoints/memberPoints.types';
import type { BeanRecord, PartnerBeansStats, UserSnapshot } from '../partnerBeans/partnerBeans.shared.types';

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

/** 读取积分页本地缓存：接口异常时用于恢复上一次成功数据。 */
const readCachedPointsPageData = (): { records: MemberPointsRecord[]; users: MemberPointsPageUser[]; stats: MemberPointsStats } | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawValue = localStorage.getItem(STORAGE_KEYS.MEMBER_POINTS_PAGE_DATA);
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue);
    if (!isPlainObject(parsedValue) || !Array.isArray(parsedValue.records)) {
      return null;
    }

    return {
      records: parsedValue.records,
      users: Array.isArray(parsedValue.users) ? parsedValue.users : [],
      stats: isPlainObject(parsedValue.stats) ? parsedValue.stats as unknown as MemberPointsStats : { totalRecords: 0, adminAdjustCount: 0, todayChangeCount: 0 },
    };
  } catch {
    return null;
  }
};

/** 写入积分页本地缓存。 */
const persistPointsPageData = (data: { records: MemberPointsRecord[]; users: MemberPointsPageUser[]; stats: MemberPointsStats }): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEYS.MEMBER_POINTS_PAGE_DATA, JSON.stringify(data));
  } catch {
    // localStorage 写入失败（如空间不足）时静默忽略
  }
};

/** 会员列表单页请求：筛选与分页全部由后端权威处理。 */
export const requestMemberList = async (query: MemberListQuery, page: number, pageSize: number): Promise<MemberListPageResult> => {
  const response = await http.get<unknown>(MEMBER_LIST_API_PATH, {
    params: {
      keyword: query.keyword || undefined,
      status: query.status !== 'all' ? query.status : undefined,
      level: query.level !== 'all' ? query.level : undefined,
      expiry: query.expiry !== 'all' ? query.expiry : undefined,
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

/** 积分页主数据：流水与会员快照并行拉取，任一成功即视为可用。 */
export const requestMemberPointsPageData = async (): Promise<{
  records: MemberPointsRecord[];
  users: MemberPointsPageUser[];
  stats: MemberPointsStats;
}> => {
  const [recordsResponse, usersResponse] = await Promise.all([
    http.get<unknown>(MEMBER_POINTS_API_PATH, {
      skipGlobalErrorHandler: true,
      errorMessage: '获取积分记录失败',
    }).catch((error: unknown) => {
      console.warn('[memberPoints] 积分记录接口请求失败:', error);
      return null;
    }),
    http.get<unknown>(MEMBER_LIST_API_PATH, {
      skipGlobalErrorHandler: true,
      errorMessage: '获取会员列表失败',
    }).catch((error: unknown) => {
      console.warn('[memberPoints] 会员列表接口请求失败:', error);
      return null;
    }),
  ]);

  // 两个接口均失败时，抛出错误让 hook 层展示错误状态
  if (recordsResponse === null && usersResponse === null) {
    throw new Error('获取积分数据失败，请检查网络后重试');
  }

  const users: MemberPointsPageUser[] = resolveMemberListSource(usersResponse).map((item, index) => mapUserSnapshot(item, index));
  const userLookup = new Map<string, MemberPointsPageUser>(users.map((user) => [user.id, user]));
  const records = getNestedArray(recordsResponse, POINTS_RECORD_SOURCE_CANDIDATES)
    .map((item, index) => mapPointsRecord(item, index, userLookup))
    .sort((left, right) => right.createdAt - left.createdAt);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = {
    records,
    users,
    stats: {
      totalRecords: records.length,
      adminAdjustCount: records.filter((record) => record.source === 'admin_adjust').length,
      todayChangeCount: records.filter((record) => record.createdAt >= today.getTime()).length,
    },
  };

  // 成功获取数据后缓存到 localStorage
  if (records.length > 0 || users.length > 0) {
    persistPointsPageData(result);
  }

  // 如果后端返回空数据，尝试从缓存中恢复
  if (records.length === 0 && users.length === 0) {
    const cachedData = readCachedPointsPageData();
    if (cachedData && (cachedData.records.length > 0 || cachedData.users.length > 0)) {
      // 后端返回空数据，从缓存恢复
      return cachedData;
    }
  }

  return result;
};

/** 纯利豆页主数据：豆流水与合伙人快照并行拉取。 */
export const requestPartnerBeansPageData = async (): Promise<{
  records: BeanRecord[];
  users: UserSnapshot[];
  stats: PartnerBeansStats;
}> => {
  const [recordsResponse, usersResponse] = await Promise.all([
    http.get<unknown>(PARTNER_BEANS_API_PATH, {
      skipGlobalErrorHandler: true,
      errorMessage: '获取纯利豆记录失败',
    }).catch((error: unknown) => {
      console.warn('[partnerBeans] 纯利豆记录接口请求失败:', error);
      return null;
    }),
    http.get<unknown>(MEMBER_LIST_API_PATH, {
      params: { partner: true },
      skipGlobalErrorHandler: true,
      errorMessage: '获取合伙人列表失败',
    }).catch((error: unknown) => {
      console.warn('[partnerBeans] 合伙人列表接口请求失败:', error);
      return null;
    }),
  ]);

  const rawUsers = getNestedArray(usersResponse, PARTNER_USERS_SOURCE_CANDIDATES);
  const users = rawUsers
    .map((item, index) => mapUserSnapshot(item, index))
    .filter((user) => user.isPartner || user.beanBalance > 0);
  const userLookup = new Map<string, UserSnapshot>(users.map((user) => [user.id, user]));
  const records = getNestedArray(recordsResponse, POINTS_RECORD_SOURCE_CANDIDATES)
    .map((item, index) => mapBeanRecord(item, index, userLookup))
    .sort((left, right) => right.createdAt - left.createdAt);

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
