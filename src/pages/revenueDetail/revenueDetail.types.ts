export type RevenuePeriod = 'today' | 'week' | 'month' | 'season';

export interface RevenueDetailSummary {
  total: number;
  avg: number;
  growth: number;
  orders: number;
  peak: number;
}

export interface RevenueDetailTrend {
  dates: string[];
  values: number[];
}

export interface RevenueTypeItem {
  label: string;
  value: number;
}

export interface RevenueRecordItem {
  id: string;
  user: string;
  type: string;
  amount: number;
  region: string;
  time: string;
}

export interface RevenueDetailData {
  summary: RevenueDetailSummary;
  trend: RevenueDetailTrend;
  revenueTypes: RevenueTypeItem[];
  records: RevenueRecordItem[];
  totalRecords: number;
}

export interface RevenueDetailQuery {
  period: RevenuePeriod;
  date: string | null;
  startDate: string | null;
  endDate: string | null;
  regionValues: string[];
}
