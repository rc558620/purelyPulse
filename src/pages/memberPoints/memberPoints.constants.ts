// memberPoints 页面共享常量
import type { MemberPointsFilterTab } from './memberPoints.types';

/** 积分流水单页条数（与后端 cursor 分页默认口径一致）。 */
export const MEMBER_POINTS_PAGE_SIZE = 20;

/**
 * 会员快照拉取条数：按后端会员列表单页上限（`PULSE_ADMIN_MEMBER_LIST_MAX_PAGE_SIZE`）取满。
 *
 * 流水分页后每页只有 20 条，但会员快照是全量一次性拉取 —— 它同时是
 * 「选人弹层的用户源」和「流水行头像 / 可用积分的回填来源」，
 * 只拿默认 20 条会让大多数流水行余额显示成 0、调整积分时也选不到人。
 */
export const MEMBER_POINTS_USERS_PAGE_SIZE = 100;

/** 搜索输入防抖时长：连续输入只打最后一次请求。 */
export const MEMBER_POINTS_SEARCH_DEBOUNCE_MS = 250;

export const MEMBER_POINTS_DEFAULT_FILTER_TAB: MemberPointsFilterTab = 'all';

export const MEMBER_POINTS_EMPTY_STATS = {
  totalRecords: 0,
  adminAdjustCount: 0,
  todayChangeCount: 0,
};
