// memberPoints 页面共享常量
import type { MemberPointsFilterTab, MemberPointsTabOption } from './memberPoints.types';

/** 积分流水单页条数（与后端 cursor 分页默认口径一致）。 */
export const MEMBER_POINTS_PAGE_SIZE = 20;

/**
 * 会员积分一览单页条数（页码分页）。
 *
 * 一览走会员列表接口的 page/pageSize 页码分页，与流水的 cursor 分页各自独立：
 * 页数由后端口径 total 决定，翻页只追加这一页的会员。
 */
export const MEMBER_POINTS_OVERVIEW_PAGE_SIZE = 20;

/** 搜索输入防抖时长：连续输入只打最后一次请求。 */
export const MEMBER_POINTS_SEARCH_DEBOUNCE_MS = 250;

export const MEMBER_POINTS_DEFAULT_FILTER_TAB: MemberPointsFilterTab = 'all';

export const MEMBER_POINTS_FILTER_TABS: MemberPointsTabOption[] = [
  { value: 'all', label: '全部' },
  { value: 'admin', label: '管理员调整' },
  { value: 'earn', label: '获得' },
  { value: 'spend', label: '消耗' },
];

export const MEMBER_POINTS_EMPTY_STATS = {
  totalRecords: 0,
  adminAdjustCount: 0,
  todayChangeCount: 0,
};
