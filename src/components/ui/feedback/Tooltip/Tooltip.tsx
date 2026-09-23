import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { cx } from '@utils/utils';
import styles from './Tooltip.module.less';

export type TooltipColor = 'amber' | 'orange' | 'cyan' | 'green' | 'lime' | 'blue' | 'volcano' | 'magenta' | 'purple' | 'red';

export type TooltipPlacement = 'top' | 'bottom';

export interface TooltipProps {
  title: ReactNode;
  color?: TooltipColor;
  placement?: TooltipPlacement;
  children: React.ReactElement;
  /** 气泡（浮层）自定义类名。 */
  className?: string;
  /**
   * 触发器（包裹 children 的外层 div）自定义类名。
   * 触发器默认 `display: inline-flex`，作为 flex 子项时 `min-width: auto` 不会收缩，
   * 内部 nowrap 文本会被撑开导致 ellipsis 失效，需要撑满宽度/允许收缩时用它覆盖。
   */
  triggerClassName?: string;
}

const Tooltip = memo(function Tooltip({
  title,
  color,
  placement = 'bottom',
  children,
  className,
  triggerClassName,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);

  // Use a delay for hiding to simulate AntD behavior
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    timerRef.current = setTimeout(() => {
      setVisible(false);
    }, 100);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (title == null || title === '') {
    return children;
  }

  return (
    <div
      className={cx(styles.tooltipTrigger, triggerClassName)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <div
        className={cx(
          styles.tooltip,
          placement === 'top' && styles.tooltipTop,
          visible && styles.tooltipVisible,
          color && styles[`tooltip-${color}`],
          className
        )}
        role="tooltip"
      >
        <div className={styles.tooltipArrow} />
        <div className={styles.tooltipInner}>{title}</div>
      </div>
    </div>
  );
});

export default Tooltip;
