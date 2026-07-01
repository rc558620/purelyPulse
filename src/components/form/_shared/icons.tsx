// icons.tsx — form 组件库统一 SVG 图标
//
// 所有 icon 均为无状态函数组件，接受可选的 className / style / size prop。
// 使用 currentColor 继承父元素颜色，所有 icon 默认 aria-hidden="true"。
//
// 导出列表：
//   CalendarIcon       日历（MonthPicker / DayPicker / DatePicker / CustomModeBtnRow）
//   ClockIcon          时钟（TimePicker）
//   RangeIcon          日期范围（CustomModeBtnRow）
//   SearchIcon         放大镜（Search / SelectView / CascaderView 搜索框）
//   CloseIcon          × 关闭/清除（Search 清除、Picker 清除按钮）
//   SmallCloseIcon     小号 × 清除（SelectView / CascaderView / TimePicker 清除）
//   ChevronDownIcon    向下箭头（SelectView / CascaderView trigger 箭头）
//   ChevronLeftIcon    向左箭头（DatePicker 上月、YearMonthPicker 返回）
//   ChevronRightIcon   向右箭头（DatePicker 下月）
//   ChevronsLeftIcon   双向左（MonthPickerView 上一年）
//   ChevronsRightIcon  双向右（MonthPickerView 下一年）
//   CheckIcon          对勾（SelectView / CascaderView 单选选中标记）
//   SmallCheckIcon     小号对勾（SelectView / CascaderView 多选 checkbox）
//   CheckboxCheckIcon  Checkbox 内对勾（Checkbox 组件）

import React from 'react';

// ─── 公共 props ────────────────────────────────────────────────────────────────

interface IconProps {
  className?: string;
  style?: React.CSSProperties;
  /** 图标尺寸（width / height 相同），默认由各 icon 内部决定 */
  size?: number;
}

// ─── CalendarIcon ─────────────────────────────────────────────────────────────

export const CalendarIcon: React.FC<IconProps> = ({ className, style, size = 16 }) => (
  <svg
    className={className}
    style={style}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8"  y1="2" x2="8"  y2="6" />
    <line x1="3"  y1="10" x2="21" y2="10" />
  </svg>
);

// ─── ClockIcon ────────────────────────────────────────────────────────────────

export const ClockIcon: React.FC<IconProps> = ({ className, style, size = 16 }) => (
  <svg
    className={className}
    style={style}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

// ─── RangeIcon ────────────────────────────────────────────────────────────────

export const RangeIcon: React.FC<IconProps> = ({
  className,
  style,
  size = 13,
}) => (
  <svg
    className={className}
    style={style}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8"  y1="2" x2="8"  y2="6" />
    <line x1="3"  y1="10" x2="21" y2="10" />
    <line x1="7"  y1="15" x2="17" y2="15" />
    <polyline points="14 12 17 15 14 18" />
  </svg>
);

// ─── SearchIcon ───────────────────────────────────────────────────────────────

export const SearchIcon: React.FC<IconProps> = ({ className, style, size = 20 }) => (
  <svg
    className={className}
    style={style}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

// ─── CloseIcon（大号 ×，用于 Search 清除 / DayPicker+MonthPicker 清除）─────────

export const CloseIcon: React.FC<IconProps> = ({ className, style, size = 14 }) => (
  <svg
    className={className}
    style={style}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="18" y1="6"  x2="6"  y2="18" />
    <line x1="6"  y1="6"  x2="18" y2="18" />
  </svg>
);

// ─── SmallCloseIcon（小号 ×，path 形状，用于 SelectView / CascaderView / TimePicker / DatePicker 清除）──

export const SmallCloseIcon: React.FC<IconProps> = ({ className, style, size = 12 }) => (
  <svg
    className={className}
    style={style}
    width={size}
    height={size}
    viewBox="0 0 12 12"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M6 5.293L10.146 1.146a.5.5 0 01.708.708L6.707 6l4.147 4.146a.5.5 0 01-.708.708L6 6.707l-4.146 4.147a.5.5 0 01-.708-.708L5.293 6 1.146 1.854a.5.5 0 01.708-.708L6 5.293z" />
  </svg>
);

// ─── ChevronDownIcon（向下三角，用于 SelectView / CascaderView trigger 箭头 & CalendarNav 年月下拉）──

export const ChevronDownIcon: React.FC<IconProps> = ({ className, style, size = 12 }) => (
  <svg
    className={className}
    style={style}
    width={size}
    height={size}
    viewBox="0 0 12 12"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M6 8L2 4h8z" />
  </svg>
);

// ─── ChevronLeftIcon（向左，用于 DatePicker 上月 & YearMonthPicker 返回）─────

export const ChevronLeftIcon: React.FC<IconProps> = ({ className, style, size = 16 }) => (
  <svg
    className={className}
    style={style}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

// ─── ChevronRightIcon（向右，用于 DatePicker 下月）────────────────────────────

export const ChevronRightIcon: React.FC<IconProps> = ({ className, style, size = 16 }) => (
  <svg
    className={className}
    style={style}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M9 18l6-6-6-6" />
  </svg>
);

// ─── ChevronsLeftIcon（双向左，用于 MonthPickerView 上一年）─────────────────

export const ChevronsLeftIcon: React.FC<IconProps> = ({ className, style, size = 16 }) => (
  <svg
    className={className}
    style={style}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M11 17l-5-5 5-5M17 17l-5-5 5-5" />
  </svg>
);

// ─── ChevronsRightIcon（双向右，用于 MonthPickerView 下一年）────────────────

export const ChevronsRightIcon: React.FC<IconProps> = ({ className, style, size = 16 }) => (
  <svg
    className={className}
    style={style}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M13 17l5-5-5-5M7 17l5-5-5-5" />
  </svg>
);

// ─── CheckIcon（对勾，用于 SelectView / CascaderView 单选已选中标记）─────────

export const CheckIcon: React.FC<IconProps> = ({ className, style, size = 16 }) => (
  <svg
    className={className}
    style={style}
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M2.5 8l3.5 3.5 7-7" />
  </svg>
);

// ─── SmallCheckIcon（小号对勾，用于 SelectView / CascaderView 多选 checkbox）─

export const SmallCheckIcon: React.FC<IconProps> = ({ className, style, size = 10 }) => (
  <svg
    className={className}
    style={style}
    width={size}
    height={size}
    viewBox="0 0 10 10"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M1.5 5l2.5 2.5 4.5-4.5" />
  </svg>
);

// ─── CheckboxCheckIcon（Checkbox 内对勾）──────────────────────────────────────

export const CheckboxCheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M3.5 8.25L6.5 11.25L12.5 5.25"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
