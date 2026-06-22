// 推广详情类型定义：数值字段在展示层统一经过 safeNum 兜底后再输出。
export type PromotionQueryMode = 'day' | 'range';
export type PromotionViewMode = 'region' | 'partners' | 'detail';
export type PromotionPeriodTab = 'day' | 'month' | 'year';

export interface PromotionPeriodRecord {
  label: string;
  orders: number;
  revenue: number;
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
  totalRevenue: number;
  growth: number;
}

export interface PromotionPartnerItem {
  id: string;
  name: string;
  province: string;
  city: string;
  district?: string;
  orders: number;
  revenue: number;
  growth: number;
  avatar: string;
  avatarUrl?: string;
  rank: number;
  joinDate: string;
  phone: string;
  series: PromotionPartnerSeries;
}

export interface PromotionDetailData {
  regions: PromotionRegionItem[];
  partners: PromotionPartnerItem[];
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
