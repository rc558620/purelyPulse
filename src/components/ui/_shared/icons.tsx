/**
 * ui 层公共 SVG 图标集合
 *
 * 所有来自 src/components/ui 各子目录的内联图标统一在此定义并导出，
 * 避免在业务组件中散落内联 SVG，方便统一维护与复用。
 *
 * 使用方式：
 *   import { IconTrash, IconEdit, IconCheckmark } from '@components/ui/_shared/icons';
 */
import React, { memo } from 'react';

// ─── action ─────────────────────────────────────────────────────────────────

/** 加载 Spinner（Button loading 态使用） */
export const IconSpinner = memo<React.SVGProps<SVGSVGElement>>((props) => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        aria-hidden="true"
        {...props}
    >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
));

/** 三条横线形变图标，barTop/barMiddle/barBottom 供 CSS 动画驱动（DisplayModeSwitchBtn 使用） */
export const IconBars: React.FC<
    React.SVGProps<SVGSVGElement> & {
        barTopClass?: string;
        barMiddleClass?: string;
        barBottomClass?: string;
    }
> = ({ barTopClass, barMiddleClass, barBottomClass, ...props }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
        <rect className={barTopClass}    x="4" y="5.25"  width="16" height="1.5" rx="0.75" />
        <rect className={barMiddleClass} x="4" y="11.25" width="16" height="1.5" rx="0.75" />
        <rect className={barBottomClass} x="4" y="17.25" width="16" height="1.5" rx="0.75" />
    </svg>
);

// ─── data-display ────────────────────────────────────────────────────────────

/** 趋势上涨箭头（TrendBadge 使用） */
export const IconTrendUp: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        aria-hidden="true"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0 }}
        {...props}
    >
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
    </svg>
);

/** 趋势下跌箭头（TrendBadge 使用） */
export const IconTrendDown: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        aria-hidden="true"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0 }}
        {...props}
    >
        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
        <polyline points="17 18 23 18 23 12" />
    </svg>
);

/** 商品默认占位图标：购物袋（ProductAvatar 使用） */
export const IconProductBag: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
    >
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
);

/** 预警角标：三角形警告（ProductAvatar 使用） */
export const IconBadgeAlert: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        {...props}
    >
        <path d="M12 2L2 19h20L12 2z" />
        <line x1="12" y1="10" x2="12" y2="14" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="17" r="1" fill="#fff" />
    </svg>
);

// ─── feedback ────────────────────────────────────────────────────────────────

/** Toast 成功图标（Ant Design CheckCircleFilled 风格） */
export const IconToastSuccess = memo(function IconToastSuccess({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="64 64 896 896" fill="currentColor" aria-hidden="true">
            <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm193.5 301.7l-210.6 292a31.8 31.8 0 01-51.7 0L318.5 484.9c-3.8-5.3 0-12.7 6.5-12.7h46.9c10.2 0 19.9 4.9 25.9 13.3l71.2 98.8 157.2-218c6-8.3 15.6-13.3 25.9-13.3H699c6.5 0 10.3 7.4 6.5 12.7z" />
        </svg>
    );
});

/** Toast 警告图标（Ant Design ExclamationCircleFilled 风格） */
export const IconToastWarning = memo(function IconToastWarning({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="64 64 896 896" fill="currentColor" aria-hidden="true">
            <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm-32 232c0-4.4 3.6-8 8-8h48c4.4 0 8 3.6 8 8v272c0 4.4-3.6 8-8 8h-48c-4.4 0-8-3.6-8-8V296zm32 440a48.01 48.01 0 010-96 48.01 48.01 0 010 96z" />
        </svg>
    );
});

/** Toast 错误图标（Ant Design CloseCircleFilled 风格） */
export const IconToastError = memo(function IconToastError({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="64 64 896 896" fill="currentColor" aria-hidden="true">
            <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm165.4 618.2l-66-.3L512 563.4l-99.3 118.4-66.1.3c-4.4 0-8-3.5-8-8 0-1.9.7-3.7 1.9-5.2l130.1-155L340.5 359a8.32 8.32 0 01-1.9-5.2c0-4.4 3.6-8 8-8l66.1.3L512 464.6l99.3-118.4 66-.3c4.4 0 8 3.5 8 8 0 1.9-.7 3.7-1.9 5.2L553.5 514l130 155c1.2 1.5 1.9 3.3 1.9 5.2 0 4.4-3.6 8-8 8z" />
        </svg>
    );
});

/** Toast 信息图标（Ant Design InfoCircleFilled 风格） */
export const IconToastInfo = memo(function IconToastInfo({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="64 64 896 896" fill="currentColor" aria-hidden="true">
            <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm32 664c0 4.4-3.6 8-8 8h-48c-4.4 0-8-3.6-8-8V456c0-4.4 3.6-8 8-8h48c4.4 0 8 3.6 8 8v272zm-32-344a48.01 48.01 0 010-96 48.01 48.01 0 010 96z" />
        </svg>
    );
});

/** 垃圾桶图标（ConfirmDeleteBtn、InlineItemActions 使用） */
export const IconTrash: React.FC<React.SVGProps<SVGSVGElement> & { size?: string }> = ({
    size,
    ...rest
}) => (
    <svg
        {...(size ? { width: size, height: size } : {})}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...rest}
    >
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
);

// ─── filter ──────────────────────────────────────────────────────────────────

/** 日历图标（DateFilterRows 使用） */
export const IconCalendar: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
        {...props}
    >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8"  y1="2" x2="8"  y2="6" />
        <line x1="3"  y1="10" x2="21" y2="10" />
    </svg>
);

/** 日期范围图标（DateFilterRows 使用） */
export const IconDateRange: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
        {...props}
    >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8"  y1="2" x2="8"  y2="6" />
        <line x1="3"  y1="10" x2="21" y2="10" />
        <line x1="8"  y1="15" x2="16" y2="15" />
    </svg>
);

// ─── inlineEdit ──────────────────────────────────────────────────────────────

/** 编辑（铅笔）图标（InlineItemActions 使用） */
export const IconEdit: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
    >
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

/** 确认对勾图标（InlineEditForm 使用） */
export const IconCheckmark: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
    >
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

/** 关闭 × 图标（InlineEditForm 使用） */
export const IconClose: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
    >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

// ─── layout ──────────────────────────────────────────────────────────────────

/** 右箭头（MenuRow 使用） */
export const IconChevronRight: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
    >
        <path d="M9 18l6-6-6-6" />
    </svg>
);

/** 左箭头（PageHeader 返回按钮使用） */
export const IconChevronLeft: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
    >
        <path d="M15 18l-6-6 6-6" />
    </svg>
);

/** 柱状图三条线图标（SectionToggleHeader 默认折叠按钮使用） */
export const IconBarChart: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
    >
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6"  y1="20" x2="6"  y2="14" />
    </svg>
);
