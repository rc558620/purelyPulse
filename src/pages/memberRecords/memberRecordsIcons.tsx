// 会员记录管理页图标集合：统一承载本页私有 SVG 图标。
//
// 与会员详情不同：这一页的行是四类记录混排的，行图标必须能独立表达「这是哪一类记录」，
// 因此按记录类型各给一个语义图标，而不是复用支付渠道图标。
import type * as React from 'react';

type SvgProps = React.SVGProps<SVGSVGElement>;

const BASE_PROPS = {
  'aria-hidden': true,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/** 筛选卡：放大镜图标 */
export const IconRecordSearch = (props: SvgProps): React.JSX.Element => (
  <svg viewBox="0 0 24 24" width={16} height={16} {...BASE_PROPS} {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);

/** 电话字段：听筒图标 */
export const IconRecordPhone = (props: SvgProps): React.JSX.Element => (
  <svg viewBox="0 0 24 24" width={14} height={14} {...BASE_PROPS} {...props}>
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
  </svg>
);

/** 姓名字段：单人图标 */
export const IconRecordUser = (props: SvgProps): React.JSX.Element => (
  <svg viewBox="0 0 24 24" width={14} height={14} {...BASE_PROPS} {...props}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

/** 行图标：充值记录（钞票） */
export const IconRecordRecharge = (props: SvgProps): React.JSX.Element => (
  <svg viewBox="0 0 24 24" width={18} height={18} {...BASE_PROPS} {...props}>
    <rect x="2" y="6" width="20" height="12" rx="2.5" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M6 12h.01M18 12h.01" />
  </svg>
);

/** 行图标：会员等级设置记录（徽章） */
export const IconRecordAdminGrant = (props: SvgProps): React.JSX.Element => (
  <svg viewBox="0 0 24 24" width={18} height={18} {...BASE_PROPS} {...props}>
    <circle cx="12" cy="9" r="6" />
    <path d="M9 14.5L8 22l4-2.2L16 22l-1-7.5" />
  </svg>
);

/** 行图标：调整续费记录（价签） */
export const IconRecordRenewalAdjust = (props: SvgProps): React.JSX.Element => (
  <svg viewBox="0 0 24 24" width={18} height={18} {...BASE_PROPS} {...props}>
    <path d="M20.6 12.5l-8.1 8.1a2 2 0 0 1-2.8 0l-6.3-6.3a2 2 0 0 1-.6-1.4V5a2 2 0 0 1 2-2h7.9a2 2 0 0 1 1.4.6l6.5 6.5a2 2 0 0 1 0 2.4z" />
    <path d="M7.5 7.5h.01" />
  </svg>
);

/** 行图标：子账号设置记录（多用户） */
export const IconRecordSubAccount = (props: SvgProps): React.JSX.Element => (
  <svg viewBox="0 0 24 24" width={18} height={18} {...BASE_PROPS} {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
    <path d="M16 3.1a4 4 0 0 1 0 7.8" />
  </svg>
);

/** 空态：记录清单 + 放大镜图标 */
export const IconRecordEmpty = (props: SvgProps): React.JSX.Element => (
  <svg viewBox="0 0 24 24" width={44} height={44} fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="8" y="2" width="8" height="4" rx="1.5" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M9 12h4" />
    <circle cx="16" cy="15" r="3" />
    <path d="M18.5 17.5L20 19" />
  </svg>
);
