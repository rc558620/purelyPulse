// 推广详情页面图标集合：统一承载 promotionDetail 页面私有 SVG 图标。
import type * as React from 'react';

type SvgProps = React.SVGProps<SVGSVGElement>;

/** 空状态：未查询到推广数据时的关闭圆环图标 */
export const IconPromotionDetailEmpty = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={40} height={40} fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9 9l6 6M15 9l-6 6" />
  </svg>
);

/** 面包屑与跳转：向右箭头图标 */
export const IconPromotionDetailChevronRight = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <path d="M9 18l6-6-6-6" />
  </svg>
);

/** 查询动作：放大镜图标 */
export const IconPromotionDetailSearch = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

/** 合伙人字段：单用户图标 */
export const IconPromotionDetailUser = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

/** 区域定位：地图定位图标 */
export const IconPromotionDetailLocation = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);

/** 日期筛选：通用日历图标 */
export const IconPromotionDetailCalendar = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

/** 日期范围：上升趋势图标 */
export const IconPromotionDetailTrendUp = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2.5} {...props}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

/** 排名徽标：填充星形图标 */
export const IconPromotionDetailRankStar = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={10} height={10} fill="currentColor" {...props}>
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17 5.8 21.3l2.4-7.4L2 9.4h7.6L12 2z" />
  </svg>
);

/** 趋势统计：脉冲折线图标 */
export const IconPromotionDetailPulse = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

/** 收益统计：货币图标 */
export const IconPromotionDetailCurrency = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

/** 趋势图表：柱状图图标 */
export const IconPromotionDetailChart = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

/** 时间维度：日视图图标 */
export const IconPromotionDetailDayTab = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <line x1="8" y1="14" x2="8.01" y2="14" />
    <line x1="12" y1="14" x2="12.01" y2="14" />
    <line x1="16" y1="14" x2="16.01" y2="14" />
  </svg>
);

/** 时间维度：月视图图标 */
export const IconPromotionDetailMonthTab = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <rect x="7" y="13" width="10" height="5" rx="1" />
  </svg>
);

/** 时间维度：年视图图标 */
export const IconPromotionDetailYearTab = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M8 17h8" />
    <path d="M12 13v4" />
  </svg>
);
