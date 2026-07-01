import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { cx } from '@utils/utils';
import styles from './Tooltip.module.less';

export type TooltipColor = 'orange' | 'cyan' | 'green' | 'lime' | 'blue' | 'volcano' | 'magenta' | 'purple' | 'red';

export type TooltipPlacement = 'top' | 'bottom';

export interface TooltipProps {
  title: ReactNode;
  color?: TooltipColor;
  placement?: TooltipPlacement;
  children: React.ReactElement;
  className?: string;
}

const Tooltip = memo(function Tooltip({ title, color, placement = 'bottom', children, className }: TooltipProps) {
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
      className={cx(styles.tooltipTrigger)}
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
