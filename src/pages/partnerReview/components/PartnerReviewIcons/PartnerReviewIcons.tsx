// 合伙人申请审核页图标集合：统一承载页面及子组件使用的 SVG 图标。
import React from 'react';

type SvgProps = React.SVGProps<SVGSVGElement>;

/** 合伙人申请：定位图标。 */
export const IconPartnerReviewLocation = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2} {...props}>
    <path d="M12 21s6-4.35 6-10a6 6 0 1 0-12 0c0 5.65 6 10 6 10Z" />
    <circle cx="12" cy="11" r="2.5" />
  </svg>
);

/** 合伙人申请：通过动作与通过状态图标。 */
export const IconPartnerReviewApprove = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2.5} {...props}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/** 合伙人申请：拒绝动作与拒绝状态图标。 */
export const IconPartnerReviewReject = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2.5} {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/** 合伙人申请：展开态箭头图标。 */
export const IconPartnerReviewExpandArrow = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.5} {...props}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/** 合伙人申请：空状态占位图标。 */
export const IconPartnerReviewEmpty = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={40} height={40} fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9 9l6 6M15 9l-6 6" />
  </svg>
);
