// 首页图标集合：统一承载 home 页面私有 SVG 图标。
import type * as React from 'react';
import { safeNum } from '@utils/utils';

type SvgProps = React.SVGProps<SVGSVGElement>;

const clampPercent = (value: number): number => {
  const normalizedValue = safeNum(value);
  if (!Number.isFinite(normalizedValue)) {
    return 0;
  }

  return Math.max(0, Math.min(100, normalizedValue));
};

/** 首页空态：圆形关闭提示图标 */
export const IconHomeEmptyState = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={40} height={40} fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9 9l6 6M15 9l-6 6" />
  </svg>
);

/** 首页趋势：向上增长折线图标 */
export const IconHomeTrendUp = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.5} {...props}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

/** 合伙人概览：多人用户图标 */
export const IconHomeUsers = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2.5} {...props}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

/** 活跃率：时间刻度图标 */
export const IconHomeClock = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2.5} {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

/** 收益概览：金额货币图标 */
export const IconHomeCurrency = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2.5} {...props}>
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

/** 活跃率展示：环形进度图标 */
export interface IconHomeActiveRateRingProps extends SvgProps {
  /** 活跃率百分比，范围 0 到 100 */
  progress: number;
}

/** 活跃率展示：环形进度图标 */
export const IconHomeActiveRateRing = ({ progress, ...props }: IconHomeActiveRateRingProps): React.JSX.Element => {
  const normalizedProgress = clampPercent(progress);
  const dashOffset = 100 - normalizedProgress;

  return (
    <svg aria-hidden="true" viewBox="0 0 36 36" width={56} height={56} fill="none" {...props}>
      <circle cx="18" cy="18" r="15.9" stroke="rgba(16,185,129,0.12)" strokeWidth={3} />
      <circle
        cx="18"
        cy="18"
        r="15.9"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={`${normalizedProgress} ${dashOffset}`}
        strokeDashoffset="25"
      />
    </svg>
  );
};

/** 管理入口：宫格导航图标 */
export const IconHomeGrid = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2.2} {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

/** 快捷入口：打款管理图标 */
export const IconHomePayout = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <rect x="2" y="5" width="20" height="14" rx="2.5" />
    <line x1="2" y1="10" x2="22" y2="10" />
    <line x1="6" y1="15" x2="10" y2="15" />
  </svg>
);

/** 快捷入口：申请审核图标 */
export const IconHomeReview = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

/** 快捷入口：纯利豆管理图标 */
export const IconHomeBeans = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 8.5c.8-1 2-1.5 3.5-1.5 2.5 0 4 1.5 4 3.5 0 1.5-.8 2.5-2 3" />
    <path d="M15.5 15.5c-.8 1-2 1.5-3.5 1.5-2.5 0-4-1.5-4-3.5 0-1.5.8-2.5 2-3" />
    <line x1="12" y1="6" x2="12" y2="7.5" />
    <line x1="12" y1="16.5" x2="12" y2="18" />
  </svg>
);

/** 快捷入口：会员积分图标 */
export const IconHomePoints = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

/** 快捷入口：封禁管理图标 */
export const IconHomeBan = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M4.93 4.93l14.14 14.14" />
  </svg>
);

/** 快捷入口：会员列表图标 */
export const IconHomeMemberList = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

/** 快捷入口：会员管理（皇冠）图标 */
export const IconHomeMembershipSettings = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2 17l3-9 4 5 3-7 4 5 3-4 3 10H2z" />
    <line x1="2" y1="20" x2="22" y2="20" />
  </svg>
);

/** 通用跳转：向右箭头图标 */
export const IconHomeChevronRight = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.5} {...props}>
    <path d="M9 18l6-6-6-6" />
  </svg>
);

/** 排行卡片：冠军星标图标 */
export const IconHomeRank = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

/** 排行徽标：填充星形图标 */
export const IconHomeRankStar = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={10} height={10} fill="currentColor" {...props}>
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17 5.8 21.3l2.4-7.4L2 9.4h7.6L12 2z" />
  </svg>
);
