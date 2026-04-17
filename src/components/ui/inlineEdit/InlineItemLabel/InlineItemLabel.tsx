// 通用行内编辑列表项名称展示（部门、职位等）
import React, { memo } from 'react';
import styles from './InlineItemLabel.module.less';

export interface InlineItemLabelProps {
  name: string;
}

const InlineItemLabel: React.FC<InlineItemLabelProps> = ({ name }) => (
  <div className={styles.info}>
    <span className={styles.name}>{name}</span>
  </div>
);

export default memo(InlineItemLabel);
