import React, { memo, useLayoutEffect, useRef, useState } from 'react';
import { cx } from '@utils/utils';
import styles from './CollapseTransition.module.less';

export interface CollapseTransitionProps {
  expanded: boolean;
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}

const CollapseTransition = memo(function CollapseTransition({
  expanded,
  children,
  className,
  innerClassName,
}: CollapseTransitionProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const node = innerRef.current;
    if (!node) return;

    const updateHeight = () => {
      const nextHeight = node.scrollHeight;
      setHeight(prev => (prev === nextHeight ? prev : nextHeight));
    };

    updateHeight();

    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(() => {
      updateHeight();
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      className={cx(styles.wrapper, className)}
      style={{ height: expanded ? `${height}px` : '0px' }}
      aria-hidden={!expanded}
    >
      <div
        ref={innerRef}
        className={cx(styles.inner, expanded && styles.innerOpen, innerClassName)}
      >
        {children}
      </div>
    </div>
  );
});

export default CollapseTransition;
