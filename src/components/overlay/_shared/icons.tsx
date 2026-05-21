/**
 * overlay 层公共 SVG 图标集合
 *
 * 所有来自 src/components/overlay 各子目录的内联图标统一在此定义并导出，
 * 避免在弹窗组件中散落内联 SVG，方便统一维护与复用。
 *
 * 使用方式：
 *   import { IconClose, IconZoom, IconCenter } from '@components/overlay/_shared/icons';
 */
import React from 'react';

// ─── OperationModalShell ──────────────────────────────────────────────────────

/** 关闭 × 图标（OperationModalShell 标题行关闭按钮使用） */
export const IconClose: React.FC = () => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
    >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

// ─── ImageCropModal ───────────────────────────────────────────────────────────

/** 搜索放大镜图标（ZoomControls 缩放滑块前缀使用） */
export const IconZoom: React.FC = () => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
    >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
    </svg>
);

/** 居中对齐图标（ZoomControls 重置位置按钮使用） */
export const IconCenter: React.FC = () => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <circle cx="12" cy="12" r="3" />
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="2" y1="12" x2="6" y2="12" />
        <line x1="18" y1="12" x2="22" y2="12" />
    </svg>
);
