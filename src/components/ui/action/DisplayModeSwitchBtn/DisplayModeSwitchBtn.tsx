// 视图模式切换按钮（三档：详细 / 简约 / 极简）
// 被 additional（销售追加）和 stocktaking（库存盘点）共同使用
import React, { memo } from 'react';
import { cx } from '@utils/utils';
import type { DisplayMode } from '@hooks/useDisplayMode';
import Tooltip from '@components/ui/feedback/Tooltip/Tooltip';
import styles from './DisplayModeSwitchBtn.module.less';

/** 三条横线形变图标（barTop/barMiddle/barBottom 供 CSS 动画驱动）*/
const IconBars: React.FC<
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

const MODE_CONFIG: Record<DisplayMode, { tooltip: string; aria: string; iconClass: string; btnClass: string }> = {
  detailed: {
    tooltip: '详细模式',
    aria:    '切换简约模式',
    iconClass: '',
    btnClass:  '',
  },
  compact: {
    tooltip: '简约模式',
    aria:    '切换极简模式',
    iconClass: styles.iconWrapperCompact,
    btnClass:  styles.modeSwitchCompact,
  },
  minimal: {
    tooltip: '极简模式',
    aria:    '切换详细模式',
    iconClass: styles.iconWrapperMinimal,
    btnClass:  styles.modeSwitchMinimal,
  },
};

export interface DisplayModeSwitchBtnProps {
  /** 当前显示模式 */
  displayMode: DisplayMode;
  /** 循环切换显示模式回调 */
  onCycleDisplayMode: () => void;
  /** 自定义外层 className（可选，用于微调间距等） */
  className?: string;
}

const DisplayModeSwitchBtn: React.FC<DisplayModeSwitchBtnProps> = memo(
  ({ displayMode, onCycleDisplayMode, className }) => {
    const config = MODE_CONFIG[displayMode];

    return (
      <Tooltip title={config.tooltip} color="orange">
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
