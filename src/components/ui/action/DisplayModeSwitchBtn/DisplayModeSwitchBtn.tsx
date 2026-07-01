// 视图模式切换按钮（三档：详细 / 简约 / 极简）
// 被 additional（销售追加）、stocktaking（库存盘点）、marketingCustomerList（会员用户）等共同使用
import React, { memo, useMemo } from 'react';
import { cx } from '@utils/utils';
import type { DisplayMode } from '@hooks/useDisplayMode';
import Tooltip from '@components/ui/feedback/Tooltip/Tooltip';
import { IconBars } from '@components/ui/_shared/icons';
import styles from './DisplayModeSwitchBtn.module.less';

type ModeEntry = { tooltip: string; aria: string; iconClass: string; btnClass: string; tooltipColor: 'cyan' | 'lime' | 'orange' };

/** 简约模式 icon/按钮配色：primary=绿色（默认）| default=黑色（初始即简约场景） */
export type CompactColorStyle = 'primary' | 'default';

const BASE_CONFIG: Record<DisplayMode, ModeEntry> = {
  detailed: {
    tooltip:      '详细模式',
    aria:         '切换简约模式',
    iconClass:    '',
    btnClass:     '',
    tooltipColor: 'cyan',
  },
  compact: {
    tooltip:      '简约模式',
    aria:         '切换极简模式',
    iconClass:    styles.iconWrapperCompact,
    btnClass:     styles.modeSwitchCompact,
    tooltipColor: 'lime',
  },
  minimal: {
    tooltip:      '极简模式',
    aria:         '切换详细模式',
    iconClass:    styles.iconWrapperMinimal,
    btnClass:     styles.modeSwitchMinimal,
    tooltipColor: 'orange',
  },
};

export interface DisplayModeSwitchBtnProps {
  /** 当前显示模式 */
  displayMode: DisplayMode;
  /** 循环切换显示模式回调 */
  onCycleDisplayMode: () => void;
  /**
   * 简约模式的配色风格
   * - "primary"（默认）：icon 变绿、Tooltip 绿色（详细→简约→极简场景）
   * - "default"：icon 保持黑色、Tooltip 绿色（初始即简约、仅简约↔极简切换场景）
   */
  compactColor?: CompactColorStyle;
  /** 自定义外层 className（可选，用于微调间距等） */
  className?: string;
}

const DisplayModeSwitchBtn: React.FC<DisplayModeSwitchBtnProps> = memo(
  ({ displayMode, onCycleDisplayMode, compactColor = 'primary', className }) => {
    const config = useMemo<ModeEntry>(() => {
      const base = BASE_CONFIG[displayMode];
      if (displayMode === 'compact' && compactColor === 'default') {
        return {
          ...base,
          btnClass: styles.modeSwitchCompactDefault,
          // 显式添加 iconWrapperCompactDefault，使 bar 填充色显式跟随 currentColor（黑色），
          // 不再依赖隐式 CSS 继承链，提高健壮性
          iconClass: styles.iconWrapperCompactDefault,
        };
      }
      return base;
    }, [displayMode, compactColor]);

    return (
      <Tooltip title={config.tooltip} color={config.tooltipColor}>
        <button
          className={cx(styles.modeSwitchBtn, config.btnClass, className)}
          onClick={onCycleDisplayMode}
          aria-label={config.aria}
          type="button"
        >
          <div className={cx(styles.iconWrapper, config.iconClass)}>
            <IconBars
              className={styles.morphIcon}
              barTopClass={styles.barTop}
              barMiddleClass={styles.barMiddle}
              barBottomClass={styles.barBottom}
            />
          </div>
        </button>
      </Tooltip>
    );
  },
);

DisplayModeSwitchBtn.displayName = 'DisplayModeSwitchBtn';

export default DisplayModeSwitchBtn;
