// 修改昵称页面专用图标组件：统一管理所有 SVG，保持页面代码干净。
import React from 'react';

type SvgProps = React.SVGProps<SVGSVGElement>;

/** 页面主图标：用户头像轮廓 */
export const IconUserMain: React.FC<SvgProps> = (props) => (
    <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
    >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

/** 输入框前缀图标：用户图标（小号） */
export const IconUserPrefix: React.FC<SvgProps> = (props) => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
    >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);
