// 会员列表 / 详情服务层门面：对外只暴露去重后的读请求、写操作与跨页同步事件。
import { createKeyedInFlightRequest } from '@utils/http';
import { safeNum } from '@utils/utils';
import { MEMBER_LIST_PAGE_SIZE } from './memberList.constants';
import {
  requestMemberDetail,
  requestMemberList,
  requestMemberPointsPageData,
  requestPartnerBeansPageData,
} from './memberList.request';
import type { MemberDetail, MemberListPageResult, MemberListQuery } from './memberList.types';

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
