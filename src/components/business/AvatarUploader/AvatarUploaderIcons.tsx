// AvatarUploader 专属 SVG 图标集
import React from 'react';

type SvgProps = React.SVGProps<SVGSVGElement>;

/** 默认猫咪占位头像：无头像时显示的猫脸占位图 */
export const IconAvatarPlaceholder: React.FC<SvgProps> = (props) => (
    <svg
        width="52"
        height="52"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        {...props}
    >
        {/* 猫咪耳朵和头部轮廓 */}
        <path
            d="M4.5 9.5L3 4L8 5.5C9.2 4.8 10.5 4.5 12 4.5C13.5 4.5 14.8 4.8 16 5.5L21 4L19.5 9.5C20.5 11 21 12.8 21 14.5C21 18.6 17 22 12 22C7 22 3 18.6 3 14.5C3 12.8 3.5 11 4.5 9.5Z"
            fill="currentColor"
            fillOpacity="0.15"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        {/* 闭着的眼睛（左） */}
        <path
            d="M8 13C8 13 9 14 10 14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        {/* 闭着的眼睛（右） */}
        <path
            d="M16 13C16 13 15 14 14 14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        {/* 小巧的鼻子 */}
        <path
            d="M12 16.5C12.5 16.5 12.5 15.5 12 15.5C11.5 15.5 11.5 16.5 12 16.5Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

/** 编辑头像：相机图标，悬停遮罩层内使用 */
export const IconAvatarEdit: React.FC<SvgProps> = (props) => (
    <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
    >
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
    </svg>
);
