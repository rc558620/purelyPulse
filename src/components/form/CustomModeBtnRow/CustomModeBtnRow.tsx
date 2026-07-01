/**
 * CustomModeBtnRow —— 自定义日期模式双按钮行
 *
 * 两个按钮并排均分宽度，点击切换进入/退出对应的自定义日期模式。
 * 适用于利润详情、报表中心等需要精确日期查询的场景。
 *
 * 互斥保护：isCustomDate 与 isCustomRange 不应同时为 true。
 * 若同时传入 true，组件内部优先激活 isCustomDate，将 isCustomRange 视为 false。
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
import { CalendarIcon, RangeIcon } from '@components/form/_shared/icons';

// ─── Props ──────────────────────────────────────────────────────

export interface CustomModeBtnRowProps {
  /** 第一个按钮（自定义日期）当前是否激活 */
  isCustomDate: boolean;
  /** 第二个按钮（日期范围）当前是否激活 */
  isCustomRange: boolean;
  /**
   * 第一个按钮显示的文字。
   * 激活时通常显示已选日期（如 "2024/03/15"），否则显示默认文案。
   * 同时用作该按钮的 aria-label，确保屏幕阅读器朗读内容与视觉一致。
   */
  extraBtnText: string;
  /** 点击第一个按钮（自定义日期）的回调 */
  onToggleCustomDate: () => void;
  /** 点击第二个按钮（日期范围）的回调 */
  onToggleCustomRange: () => void;
}

// ─── 组件 ─────────────────────────────────────────────────────

const CustomModeBtnRow = memo<CustomModeBtnRowProps>(({
  isCustomDate: isCustomDateRaw,
  isCustomRange: isCustomRangeRaw,
  extraBtnText,
  onToggleCustomDate,
  onToggleCustomRange,
}) => {
  // Bug6 互斥保护：isCustomDate 与 isCustomRange 不应同时为 true
  // 若同时为 true，优先激活 isCustomDate，将 isCustomRange 视为 false
  const isCustomDate  = isCustomDateRaw;
  const isCustomRange = isCustomDateRaw ? false : isCustomRangeRaw;

  // Bug2 互斥 disabled：一种模式激活时，另一种模式按钮视觉变淡并标记 aria-disabled
  const isDateBtnDisabled  = isCustomRange;
  const isRangeBtnDisabled = isCustomDate;

  return (
    <div className={styles.customBtnRow}>
      <button
        type="button"
        className={cx(
          styles.customModeBtn,
          isCustomDate && styles.customModeBtnActive,
          isDateBtnDisabled && styles.customModeBtnDisabled,
        )}
        onClick={onToggleCustomDate}
        aria-pressed={isCustomDate}
        aria-label={extraBtnText}
        aria-disabled={isDateBtnDisabled || undefined}
      >
        <CalendarIcon size={13} style={{ flexShrink: 0 }} />
        <span className={styles.customModeBtnText}>{extraBtnText}</span>
      </button>
      <button
        type="button"
        className={cx(
          styles.customModeBtn,
          isCustomRange && styles.customModeBtnActive,
          isRangeBtnDisabled && styles.customModeBtnDisabled,
        )}
        onClick={onToggleCustomRange}
        aria-pressed={isCustomRange}
        aria-label="选择日期范围"
        aria-disabled={isRangeBtnDisabled || undefined}
      >
        <RangeIcon size={13} style={{ flexShrink: 0 }} />
        <span className={styles.customModeBtnText}>日期范围</span>
      </button>
    </div>
  );
});

CustomModeBtnRow.displayName = 'CustomModeBtnRow';

export default CustomModeBtnRow;
