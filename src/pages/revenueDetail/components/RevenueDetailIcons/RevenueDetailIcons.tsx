// 充值收入明细页图标集合：统一承载页面及子组件使用的 SVG 图标。
import type * as React from 'react';

type SvgProps = React.SVGProps<SVGSVGElement>;

/** 充值收入明细：空状态趋势面板图标。 */
export const IconRevenueDetailEmpty = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={40} height={40} fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
    <path d="M3 3h18v18H3z" />
    <path d="M7 15l3-3 3 2 4-5" />
  </svg>
);

/** 充值收入明细：上涨趋势图标。 */
export const IconRevenueDetailTrendUp = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.5} {...props}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

/** 充值收入明细：订单文档图标。 */
export const IconRevenueDetailDocument = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.5} {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

/** 充值收入明细：筛选漏斗图标。 */
export const IconRevenueDetailFilter = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.5} {...props}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

/** 充值收入明细：下拉箭头图标。 */
export const IconRevenueDetailChevronDown = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.5} {...props}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/** 充值收入明细：金额统计图标。 */
export const IconRevenueDetailCurrency = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <path d="M12 2v20" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

/** 充值收入明细：日历图标。 */
export const IconRevenueDetailCalendar = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

/** 充值收入明细：类型分布图标。 */
export const IconRevenueDetailPie = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
    <path d="M22 12A10 10 0 0 0 12 2v10z" />
  </svg>
);

/** 充值收入明细：记录列表图标。 */
export const IconRevenueDetailList = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);
