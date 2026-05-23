// 会员设置图标集合：统一承载会员设置页面私有 SVG 图标。
import type * as React from 'react';

type SvgProps = React.SVGProps<SVGSVGElement>;

/** 页面 Hero：会员设置主图标（皇冠形象） */
export const IconMembershipSettings = (props: SvgProps): React.JSX.Element => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    width={28}
    height={28}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M2 18l3-10 4 6 3-8 4 6 3-4 3 10H2z" />
    <line x1="2" y1="21" x2="22" y2="21" />
  </svg>
);

/** 月度会员：日历月图标 */
export const IconMembershipMonthly = (props: SvgProps): React.JSX.Element => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    width={20}
    height={20}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="3" y="4" width="18" height="18" rx="2.5" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <path d="M8 14h.01M12 14h.01M12 18h.01" />
  </svg>
);

/** 季度会员：三角形叠加图标 */
export const IconMembershipQuarterly = (props: SvgProps): React.JSX.Element => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    width={20}
    height={20}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 2L2 19h20L12 2z" />
    <path d="M12 8l-4 8h8l-4-8z" opacity={0.55} />
  </svg>
);

/** 年度会员：无限循环图标 */
export const IconMembershipYearly = (props: SvgProps): React.JSX.Element => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    width={20}
    height={20}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 2a10 10 0 0 1 10 10A10 10 0 0 1 12 22 10 10 0 0 1 2 12 10 10 0 0 1 12 2" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

/** 永久会员：皇冠图标 */
export const IconMembershipLifetime = (props: SvgProps): React.JSX.Element => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    width={20}
    height={20}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M2 17l3-9 4 5 3-7 4 5 3-4 3 10H2z" />
    <line x1="2" y1="20" x2="22" y2="20" />
  </svg>
);

/** 保存成功：勾选图标 */
export const IconMembershipCheck = (props: SvgProps): React.JSX.Element => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    width={14}
    height={14}
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/** 卡片保存按钮：上传/保存图标 */
export const IconMembershipSave = (props: SvgProps): React.JSX.Element => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    width={15}
    height={15}
    fill="none"
    stroke="currentColor"
    strokeWidth={2.2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

/** 有效期字段：日历图标 */
export const IconMembershipCalendar = (props: SvgProps): React.JSX.Element => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    width={13}
    height={13}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="3" y="4" width="18" height="18" rx="2.5" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="16" y1="2" x2="16" y2="6" />
  </svg>
);
