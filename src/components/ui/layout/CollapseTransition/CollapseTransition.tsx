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

  // Bug #8: 依赖数组需包含 expanded，确保展开/收起时重新测量子元素高度。
  // 仅靠 ResizeObserver 无法覆盖所有场景（如 display 变化触发的重排）。
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
  }, [expanded]);

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
