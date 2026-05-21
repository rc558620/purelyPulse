// 封禁管理图标集：统一承载页面内全部 SVG 图标。
import React from 'react';

type SvgProps = React.SVGProps<SVGSVGElement>;

/** 空态图标：封禁列表为空时的占位符号。 */
export const IconBanEmptyState = (props: SvgProps): React.JSX.Element => {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={40} height={40} fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </svg>
  );
};

/** 封禁图标：表示禁用或封禁动作。 */
export const IconBanCircleSlash = (props: SvgProps): React.JSX.Element => {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={28} height={28} fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M4.93 4.93l14.14 14.14" />
    </svg>
  );
};

/** 解封图标：表示恢复正常访问权限。 */
export const IconShieldCheck = (props: SvgProps): React.JSX.Element => {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={28} height={28} fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
};

/** 正常状态图标：展示在线或可用状态。 */
export const IconStatusDot = (props: SvgProps): React.JSX.Element => {
  return (
    <svg aria-hidden="true" viewBox="0 0 8 8" width={8} height={8} {...props}>
      <circle cx="4" cy="4" r="4" fill="currentColor" />
    </svg>
  );
};

/** 搜索图标：用于搜索输入框前缀。 */
export const IconSearch = (props: SvgProps): React.JSX.Element => {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth="2.2" {...props}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
};

/** 关闭图标：用于清空搜索和关闭行为。 */
export const IconClose = (props: SvgProps): React.JSX.Element => {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2.5" {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
};

/** 展开箭头图标：表示列表项展开和收起。 */
export const IconChevronDown = (props: SvgProps): React.JSX.Element => {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2.5" {...props}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
};

/** 日历图标：用于注册时间信息展示。 */
export const IconCalendar = (props: SvgProps): React.JSX.Element => {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
};

/** 提示图标：用于封禁原因提示信息。 */
export const IconInfoCircle = (props: SvgProps): React.JSX.Element => {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
};
