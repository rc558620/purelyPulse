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
import { CalendarIcon, RangeIcon } from '@components/form/_shared/icons';

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
      <CalendarIcon size={13} style={{ flexShrink: 0 }} />
      <span>{extraBtnText}</span>
    </button>
    <button
      type="button"
      className={cx(styles.customModeBtn, isCustomRange && styles.customModeBtnActive)}
      onClick={onToggleCustomRange}
      aria-pressed={isCustomRange}
      aria-label="选择日期范围"
    >
      <RangeIcon size={13} style={{ flexShrink: 0 }} />
      <span>日期范围</span>
    </button>
  </div>
));

CustomModeBtnRow.displayName = 'CustomModeBtnRow';

export default CustomModeBtnRow;
