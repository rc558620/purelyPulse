/**
 * CustomModeBtnRow —— 「选择年月日」+「日期范围」双按钮行
 *
 * 两个按钮并排均分宽度，点击切换进入/退出对应的自定义日期模式。
 * 适用于利润详情、报表中心等需要精确日期查询的场景。
 *
 * 用法：
 * ```tsx
 * <CustomModeBtnRow
 *   isCustomDate={period === 'custom_month'}
 *   isCustomRange={period === 'custom_range'}
 *   extraBtnText={isCustomDate ? '2024/03/15' : '选择年月日'}
 *   onToggleCustomDate={handleToggleCustomDate}
 *   onToggleCustomRange={handleToggleCustomRange}
 * />
 * ```
 */
import { memo } from 'react';
import { cx } from '@utils/utils';
import styles from './CustomModeBtnRow.module.less';

// ─── 内联图标（组件自洽，不依赖外部 icon 文件）─────────────────

const CalendarIcon = (
  <svg
    width="13" height="13" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" style={{ flexShrink: 0 }}
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8"  y1="2" x2="8"  y2="6" />
    <line x1="3"  y1="10" x2="21" y2="10" />
  </svg>
);

const RangeIcon = (
  <svg
    width="13" height="13" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" style={{ flexShrink: 0 }}
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8"  y1="2" x2="8"  y2="6" />
    <line x1="3"  y1="10" x2="21" y2="10" />
    <line x1="7"  y1="15" x2="17" y2="15" />
    <polyline points="14 12 17 15 14 18" />
  </svg>
);

// ─── Props ──────────────────────────────────────────────────────

export interface CustomModeBtnRowProps {
  /** 「选择年月日」按钮当前是否激活 */
  isCustomDate: boolean;
  /** 「日期范围」按钮当前是否激活 */
  isCustomRange: boolean;
  /**
   * 「选择年月日」按钮显示的文字。
   * 激活时通常显示已选日期（如 "2024/03/15"），否则显示默认文案。
   */
  extraBtnText: string;
  /** 点击「选择年月日」按钮的回调 */
  onToggleCustomDate: () => void;
  /** 点击「日期范围」按钮的回调 */
  onToggleCustomRange: () => void;
}

// ─── 组件 ─────────────────────────────────────────────────────

const CustomModeBtnRow = memo<CustomModeBtnRowProps>(({
  isCustomDate,
  isCustomRange,
  extraBtnText,
  onToggleCustomDate,
  onToggleCustomRange,
}) => (
  <div className={styles.customBtnRow}>
    <button
      type="button"
      className={cx(styles.customModeBtn, isCustomDate && styles.customModeBtnActive)}
      onClick={onToggleCustomDate}
      aria-pressed={isCustomDate}
      aria-label="选择年月日"
    >
      {CalendarIcon}
      <span>{extraBtnText}</span>
    </button>
    <button
      type="button"
      className={cx(styles.customModeBtn, isCustomRange && styles.customModeBtnActive)}
      onClick={onToggleCustomRange}
      aria-pressed={isCustomRange}
      aria-label="选择日期范围"
    >
      {RangeIcon}
      <span>日期范围</span>
    </button>
  </div>
));

CustomModeBtnRow.displayName = 'CustomModeBtnRow';

export default CustomModeBtnRow;
