// 会员列表 / 详情服务层门面：对外只暴露去重后的读请求、写操作与跨页同步事件。
import { createKeyedInFlightRequest } from '@utils/http';
import { safeNum } from '@utils/utils';
import { MEMBER_LIST_PAGE_SIZE } from './memberList.constants';
import {
  requestMemberDetail,
  requestMemberList,
  requestMemberPointsRecords,
  requestMemberPointsUsers,
  requestPartnerBeanRecords,
  requestPartnerBeanUsers,
} from './memberList.request';
import type {
  PartnerBeansRecordPage,
  PartnerBeansRecordRequestParams,
} from '../partnerBeans/partnerBeans.types';
import type { UserSnapshot } from '../partnerBeans/partnerBeans.shared.types';
import type { MemberDetail, MemberListPageResult, MemberListQuery } from './memberList.types';
import type {
  MemberPointsPageUser,
  MemberPointsRecordPage,
  MemberPointsRecordRequestParams,
} from '../memberPoints/memberPoints.types';

// ─── 写操作与统计 / 同步事件：实现下沉到各自模块，这里统一出口 ──────────────
export {
  backfillMemberSubAccountAmount,
  fetchMemberRenewalPrices,
  fetchMembershipPricingPreview,
  resetMemberLockedPrice,
  submitMemberBan,
  submitMemberBeansAdjustment,
  submitMemberCancelAccount,
  submitMemberMembership,
  submitMemberPointsAdjustment,
  submitMemberRenewalPrices,
  submitMemberUnban,
  submitSubAccountQuota,
} from './memberList.actions';
export { fetchMemberClubStats, fetchMemberSalesStats } from './memberList.stats';
export { emitMemberCancelSync, emitMemberStatusSync, emitMembershipRevenueSync } from './memberList.sync';
export type { MemberPricingPreview } from './memberList.pricing.types';
export type { MembershipRevenueSyncPayload } from './memberList.types';

/**
 * 获取积分流水单页（游标分页）。
 *
 * 不做并发去重：每页 cursor 不同，按「query + cursor」缓存命中率接近 0，
 * 反而会让下拉刷新与加载更多互相吞掉请求（与 partnerBeans 同一口径）。
 */
export const fetchMemberPointsRecords = async (
  params: MemberPointsRecordRequestParams,
): Promise<MemberPointsRecordPage> => requestMemberPointsRecords(params);

/** 获取会员快照：选人弹层的用户源，与流水分页无关。 */
export const fetchMemberPointsUsers = async (signal?: AbortSignal): Promise<MemberPointsPageUser[]> =>
  requestMemberPointsUsers(signal);

/**
 * 获取纯利豆流水单页（游标分页）。
 *
 * 不做并发去重：每页 cursor 不同，按「query + cursor」缓存命中率接近 0，
 * 反而会让下拉刷新与加载更多互相吞掉请求（与 memberRecords 同一口径）。
 */
export const fetchPartnerBeanRecords = async (
  params: PartnerBeansRecordRequestParams,
): Promise<PartnerBeansRecordPage> => requestPartnerBeanRecords(params);

/** 获取合伙人快照：余额一览与调整弹层的用户源，与流水分页无关。 */
export const fetchPartnerBeanUsers = async (signal?: AbortSignal): Promise<UserSnapshot[]> =>
  requestPartnerBeanUsers(signal);

/**
 * 获取会员列表单页数据，并按「查询条件 + 页码 + 页大小」对并发请求做去重。
 *
 * `pageSize` 可选，默认会员列表单页条数；供封禁管理页等复用方按需调整。
 */
export const fetchMemberList = createKeyedInFlightRequest(
  (query: MemberListQuery, page: number, pageSize: number = MEMBER_LIST_PAGE_SIZE) => JSON.stringify({ query, page, pageSize }),
  // 分页参数在入口归一：脏页码 / 脏页大小会破坏分页切片，回落首屏默认口径
  async (query: MemberListQuery, page: number, pageSize: number = MEMBER_LIST_PAGE_SIZE): Promise<MemberListPageResult> =>
    requestMemberList(query, safeNum(page, 1), safeNum(pageSize, MEMBER_LIST_PAGE_SIZE)),
);

/** 获取会员详情，并按会员 id 对并发请求做去重。 */
export const fetchMemberDetail = createKeyedInFlightRequest(
  (id: string) => id,
  async (id: string): Promise<MemberDetail | null> => requestMemberDetail(id),
);
