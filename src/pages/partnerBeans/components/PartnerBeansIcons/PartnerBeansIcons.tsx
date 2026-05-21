// partnerBeans 页面与弹窗共用 SVG 图标集合
import React from 'react';

type SvgProps = React.SVGProps<SVGSVGElement>;

/** 页面加载中：圆形时钟图标 */
export const IconPartnerBeansLoading: React.FC<SvgProps> = (props) => (
  <svg
    width={36}
    height={36}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    aria-hidden="true"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

/** 页面异常/空态：问号提示图标 */
export const IconPartnerBeansQuestion: React.FC<SvgProps> = (props) => (
  <svg
    width={36}
    height={36}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    aria-hidden="true"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

/** 主操作：新增/调整图标 */
export const IconPartnerBeansAdd: React.FC<SvgProps> = (props) => (
  <svg
    width={14}
    height={14}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    aria-hidden="true"
    {...props}
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

/** 合伙人总览：双人图标 */
export const IconPartnerBeansSummary: React.FC<SvgProps> = (props) => (
  <svg
    width={14}
    height={14}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden="true"
    {...props}
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

/** 搜索框：放大镜图标 */
export const IconPartnerBeansSearch: React.FC<SvgProps> = (props) => (
  <svg
    width={15}
    height={15}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden="true"
    {...props}
  >
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

/** 关闭按钮：叉号图标 */
export const IconPartnerBeansClose: React.FC<SvgProps> = (props) => (
  <svg
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    aria-hidden="true"
    {...props}
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/** 记录关联用户：单人图标 */
export const IconPartnerBeansRelatedUser: React.FC<SvgProps> = (props) => (
  <svg
    width={11}
    height={11}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden="true"
    {...props}
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

/** 记录增加：加号图标 */
export const IconPartnerBeansEarn: React.FC<SvgProps> = (props) => (
  <svg
    width={14}
    height={14}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    aria-hidden="true"
    {...props}
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

/** 记录提现：向下转出图标 */
export const IconPartnerBeansWithdraw: React.FC<SvgProps> = (props) => (
  <svg
    width={14}
    height={14}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    aria-hidden="true"
    {...props}
  >
    <path d="M12 5v14M5 12l7 7 7-7" />
  </svg>
);

/** 记录扣减：减号图标 */
export const IconPartnerBeansSpend: React.FC<SvgProps> = (props) => (
  <svg
    width={14}
    height={14}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    aria-hidden="true"
    {...props}
  >
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

/** 调整弹窗：纯利豆环形图标 */
export const IconPartnerBeansBean: React.FC<SvgProps> = (props) => (
  <svg
    width={18}
    height={18}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    <path d="M8 12c0-2.21 1.79-4 4-4" />
    <path d="M16 12c0 2.21-1.79 4-4 4" />
  </svg>
);

/** 调整弹窗：确认勾选图标 */
export const IconPartnerBeansConfirm: React.FC<SvgProps> = (props) => (
  <svg
    width={14}
    height={14}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    aria-hidden="true"
    {...props}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/** 调整弹窗：余额变化箭头图标 */
export const IconPartnerBeansPreviewArrow: React.FC<SvgProps> = (props) => (
  <svg
    width={14}
    height={14}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden="true"
    {...props}
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
