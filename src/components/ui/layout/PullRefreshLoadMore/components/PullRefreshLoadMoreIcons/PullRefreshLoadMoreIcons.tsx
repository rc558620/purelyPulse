// PullRefreshLoadMore 共享图标集合
import React from 'react';

type SvgProps = React.SVGProps<SVGSVGElement>;

/** 回到顶部：向上箭头 */
export const IconBackToTopArrow = (props: SvgProps): React.JSX.Element => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    width={24}
    height={24}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M12 18V7M12 7L7.5 11.5M12 7L16.5 11.5"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
