// 合伙人打款页面图标集合
import React from 'react';

type SvgProps = React.SVGProps<SVGSVGElement>;

/** 城市定位：合伙人所在城市标识 */
export const IconPartnerPayoutLocation: React.FC<SvgProps> = (props) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <path d="M12 21s6-4.35 6-10a6 6 0 1 0-12 0c0 5.65 6 10 6 10Z" />
    <circle cx="12" cy="11" r="2.5" />
  </svg>
);

/** 展开箭头：卡片详情开合指示 */
export const IconPartnerPayoutExpandArrow: React.FC<SvgProps> = (props) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.5} {...props}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/** 信息提示：拒绝原因说明图标 */
export const IconPartnerPayoutInfo: React.FC<SvgProps> = (props) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2.5} {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

/** 拒绝操作：打款拒绝按钮图标 */
export const IconPartnerPayoutReject: React.FC<SvgProps> = (props) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2.5} {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/** 确认打款：提交打款操作按钮图标 */
export const IconPartnerPayoutApprove: React.FC<SvgProps> = (props) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2.5} {...props}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);

/** 空状态：暂无打款申请占位图标 */
export const IconPartnerPayoutEmpty: React.FC<SvgProps> = (props) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={40} height={40} fill="none" stroke="currentColor" strokeWidth={1.2} {...props}>
    <rect x="2" y="5" width="20" height="14" rx="3" />
    <line x1="2" y1="10" x2="22" y2="10" />
    <line x1="6" y1="15" x2="10" y2="15" />
    <line x1="14" y1="15" x2="18" y2="15" />
  </svg>
);
