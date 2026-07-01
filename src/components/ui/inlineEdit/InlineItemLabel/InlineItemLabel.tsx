// 通用行内编辑列表项名称展示（部门、职位等）
import React, { memo } from 'react';
import styles from './InlineItemLabel.module.less';

export interface InlineItemLabelProps {
  name: string;
}

/** 空值占位文案 */
const EMPTY_FALLBACK = '—';

const InlineItemLabel: React.FC<InlineItemLabelProps> = ({ name }) => {
  const displayText = name || EMPTY_FALLBACK;

  return (
    <div className={styles.info} aria-label={displayText}>
      <span className={styles.name}>{displayText}</span>
    </div>
  );
};

/**
 * 自定义比较函数：将 undefined 与 "" 视为等价，
 * 避免空值边界场景下的无意义重渲染。
 */
function areEqual(
  prev: InlineItemLabelProps,
  next: InlineItemLabelProps,
): boolean {
  const prevName = prev.name || '';
  const nextName = next.name || '';
  return prevName === nextName;
}

export default memo(InlineItemLabel, areEqual);
