// 推广详情类型定义：金额展示值由后端直接返回，前端不做分转元和格式化。
export type PromotionQueryMode = 'day' | 'range';
export type PromotionViewMode = 'region' | 'partners' | 'detail';
export type PromotionPeriodTab = 'day' | 'month' | 'year';

export interface PromotionPeriodRecord {
  label: string;
  orders: number;
  /** 收入展示值（后端直接返回，前端不再分转元） */
  revenueDisplay: string;
}

export interface PromotionPartnerSeries {
  day: PromotionPeriodRecord[];
  month: PromotionPeriodRecord[];
  year: PromotionPeriodRecord[];
}

export interface PromotionRegionItem {
  province: string;
  city?: string;
  partnerCount: number;
  totalOrders: number;
  /** 总收入展示值（后端直接返回，前端不再分转元） */
  totalRevenueDisplay: string;
  growth: number;
}

export interface PromotionPartnerItem {
  id: string;
  name: string;
  province: string;
  city: string;
  district?: string;
  orders: number;
  /** 收入展示值（后端直接返回，前端不再分转元） */
  revenueDisplay: string;
  growth: number;
  avatar: string;
  avatarUrl?: string;
  rank: number;
  joinDate: string;
  phone: string;
  series: PromotionPartnerSeries;
}

/** 推广详情全量汇总（后端权威计算，前端不再 reduce 累加）。 */
export interface PromotionDetailSummary {
  /** 合伙人总数。 */
  totalPartners: number;
  /** 订单总数。 */
  totalOrders: number;
  /** 总收入展示值（后端直接返回，前端不再分转元）。 */
  totalRevenueDisplay: string;
}

/** 推广详情合伙人趋势汇总（后端权威计算，前端不再 reduce 累加）。 */
export interface PromotionDetailTotal {
  /** 订单总数。 */
  orders: number;
  /** 总收入展示值（后端直接返回，前端不再分转元）。 */
  revenueDisplay: string;
}

export interface PromotionDetailData {
  regions: PromotionRegionItem[];
  partners: PromotionPartnerItem[];
  /** 全量汇总统计（后端权威计算，前端只做展示）。 */
  summary: PromotionDetailSummary;
  /** 合伙人详情趋势汇总（后端权威计算，前端只做展示）。 */
  detailTotal: PromotionDetailTotal;
}

export interface PromotionDetailQuery {
  name: string;
  queryMode: PromotionQueryMode;
  date: string | null;
  startDate: string | null;
  endDate: string | null;
  regionValues: string[];
}

export interface PromotionDetailQueryMeta {
  regionLabels: string[];
  regionDisplayText: string;
  dateDisplayText: string;
}
