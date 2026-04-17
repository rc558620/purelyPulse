/**
 * EmptyState —— 通用空状态占位组件
 *
 * 图标圆圈 + 标题 + 描述文案 + 操作按钮，支持自定义 icon 和文案。
 * actionIcon 会渲染在按钮文字左侧；不传 onAction 时不显示按钮。
 */
import React, { type ReactNode } from 'react';
import styles from './EmptyState.module.less';

export interface EmptyStateProps {
  /** 中央圆形区域内的图标节点 */
  icon: ReactNode;
  /** 主标题 */
  title: string;
  /** 描述文案 */
  desc: string;
  /** 操作按钮文字 */
  actionText?: string;
  /** 操作按钮左侧图标 */
  actionIcon?: ReactNode;
  /** 点击操作按钮回调，不传则不显示按钮 */
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  desc,
  actionText,
  actionIcon,
  onAction,
}) => (
  <div className={styles.emptyState}>
    <div className={styles.emptyIcon}>{icon}</div>
    <p className={styles.emptyTitle}>{title}</p>
    <p className={styles.emptyDesc}>{desc}</p>
    {onAction != null && actionText != null && (
      <button type="button" className={styles.actionBtn} onClick={onAction}>
        {actionIcon}
        {actionText}
      </button>
    )}
  </div>
);

export default EmptyState;
