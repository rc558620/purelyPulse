// 新客额度页面与弹窗共用 SVG 图标集合
import React from 'react';

type SvgProps = React.SVGProps<SVGSVGElement>;

/** 页面加载中：圆形时钟图标 */
export const IconNewCustomerQuotaLoading: React.FC<SvgProps> = (props) => (
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
export const IconNewCustomerQuotaQuestion: React.FC<SvgProps> = (props) => (
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

/** 主操作：新建/设置图标 */
export const IconNewCustomerQuotaAdd: React.FC<SvgProps> = (props) => (
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

/** 门店额度一览标题：门店图标 */
export const IconNewCustomerQuotaStore: React.FC<SvgProps> = (props) => (
  <svg
    width={14}
    height={14}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M3 9.5 5 4h14l2 5.5" />
    <path d="M4 9.5h16V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z" />
    <path d="M9 21v-6h6v6" />
  </svg>
);

/** 门店行：新客额度图标（身份证 + 用户） */
export const IconNewCustomerQuotaBadge: React.FC<SvgProps> = (props) => (
  <svg
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <rect x="2" y="5" width="14" height="14" rx="2.5" />
    <circle cx="8" cy="11" r="2.2" />
    <path d="M4.5 17c.6-1.6 2-2.4 3.5-2.4S10.9 15.4 11.5 17" />
    <path d="M19 8h3M19 12h3M19 16h2" />
  </svg>
);

/** 搜索框：放大镜图标 */
export const IconNewCustomerQuotaSearch: React.FC<SvgProps> = (props) => (
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
export const IconNewCustomerQuotaClose: React.FC<SvgProps> = (props) => (
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

/** 设置弹窗：确认勾选图标 */
export const IconNewCustomerQuotaConfirm: React.FC<SvgProps> = (props) => (
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

/** 设置弹窗：额度变化箭头图标 */
export const IconNewCustomerQuotaArrow: React.FC<SvgProps> = (props) => (
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
