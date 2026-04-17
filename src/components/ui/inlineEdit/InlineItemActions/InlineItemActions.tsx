// 通用行内编辑列表项操作按钮组（编辑 + 删除）
import React, { memo } from 'react';
import styles from './InlineItemActions.module.less';

// ─── 图标（内联 SVG，不依赖各模块 Icons 文件）──────────────────

const IconEdit: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconTrash: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

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
      aria-label={`编辑「${name}」`}
    >
      <IconEdit />
    </button>
    <button
      type="button"
      className={styles.deleteBtn}
      onClick={onDelete}
      aria-label={`删除「${name}」`}
    >
      <IconTrash />
    </button>
  </div>
);

export default memo(InlineItemActions);
