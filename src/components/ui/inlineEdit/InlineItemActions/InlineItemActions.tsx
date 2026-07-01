// 通用行内编辑列表项操作按钮组（编辑 + 删除）
import React, { memo } from 'react';
import { IconEdit, IconTrash } from '@components/ui/_shared/icons';
import styles from './InlineItemActions.module.less';

// ─── Props ──────────────────────────────────────────────────────

export interface InlineItemActionsProps {
  /** 仅用于 aria-label */
  name: string;
  onEdit: () => void;
  onDelete: () => void;
}

// ─── 组件 ──────────────────────────────────────────────────────

const InlineItemActions: React.FC<InlineItemActionsProps> = ({ name, onEdit, onDelete }) => (
  <div className={styles.actions} role="group" aria-label="操作">
    <button
      type="button"
      className={styles.editBtn}
      onClick={onEdit}
      aria-label={name ? `编辑「${name}」` : '编辑'}
    >
      <IconEdit />
    </button>
    <button
      type="button"
      className={styles.deleteBtn}
      onClick={onDelete}
      aria-label={name ? `删除「${name}」` : '删除'}
    >
      <IconTrash />
    </button>
  </div>
);

export default memo(InlineItemActions);
