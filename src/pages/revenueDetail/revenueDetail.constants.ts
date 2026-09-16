// 充值收入明细图表常量：统一管理趋势图高度。
// 说明：充值类型分布的饼图不设固定高度，由 .typePieWrap 的响应式尺寸（140/180）决定，
// 避免固定高度与中心文字容器不一致导致圆环偏移。
export const REVENUE_DETAIL_CHART_HEIGHTS = {
  trend: 300,
} as const;
