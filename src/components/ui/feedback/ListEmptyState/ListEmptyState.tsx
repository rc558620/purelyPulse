// 通用列表空状态组件：无数据 / 无筛选结果两种状态的占位 UI。
// 适用于：库存盘点、成本管理、报表明细等各类列表页。
import React, { memo } from 'react';
import styles from './ListEmptyState.module.less';

export interface ListEmptyStateAction {
  /** 按钮文本（可包含 React 节点，如图标+文字） */
  label: React.ReactNode;
  /** 点击回调 */
  onClick: () => void;
  /**
   * 按钮样式变体：
   * - 'clear'（默认）：边框样式，用于"清除筛选"等次级操作
   * - 'primary'：实心主色，用于"立即添加"等主操作
   */
  variant?: 'clear' | 'primary';
}

export interface ListEmptyStateProps {
  /** 空状态图标（建议传入 SVG 组件） */
  icon: React.ReactNode;
  /** 有筛选条件时的标题，默认"没有符合条件的数据" */
  filteredTitle?: string;
  /** 无数据时的标题 */
  emptyTitle: string;
  /** 有筛选条件时的描述，默认"尝试调整搜索条件或清除筛选" */
  filteredDesc?: string;
  /** 无数据时的描述 */
  emptyDesc: string;
  /** 是否处于筛选过滤状态 */
  hasFilter?: boolean;
  /**
   * 按钮列表：可配置多个操作按钮（筛选态 / 无数据态各自的操作）。
   * 仅在对应状态（hasFilter / !hasFilter）时渲染。
   */
  filteredAction?: ListEmptyStateAction;
  emptyAction?: ListEmptyStateAction;
}

const ListEmptyState: React.FC<ListEmptyStateProps> = memo(({
  icon,
  filteredTitle = '没有符合条件的数据',
  emptyTitle,
  filteredDesc = '尝试调整搜索条件或清除筛选',
  emptyDesc,
  hasFilter = false,
  filteredAction,
  emptyAction,
}) => {
  const title  = hasFilter ? filteredTitle  : emptyTitle;
  const desc   = hasFilter ? filteredDesc   : emptyDesc;
  const action = hasFilter ? filteredAction : emptyAction;

  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>{icon}</div>

      <p className={styles.emptyTitle}>{title}</p>
      <p className={styles.emptyDesc}>{desc}</p>

      {action && (
        <button
          type="button"
          className={action.variant === 'primary' ? styles.actionBtn : styles.clearBtn}
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  );
});

ListEmptyState.displayName = 'ListEmptyState';

export default ListEmptyState;
