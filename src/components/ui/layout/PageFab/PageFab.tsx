/**
 * PageFab —— 通用页面悬浮操作按钮（FAB）
 *
 * 固定在页面右下角，带渐变背景和阴影动效。
 * 接受自定义图标和文字，支持 ariaLabel 无障碍。
 */
import React, { memo, type ReactNode } from 'react';
import styles from './PageFab.module.less';

export interface PageFabProps {
  /** 按钮左侧图标节点 */
  icon: ReactNode;
  /** 按钮文字 */
  label: string;
  /** 无障碍 aria-label，默认使用 label */
  ariaLabel?: string;
  /** 点击回调 */
  onClick: () => void;
}

const PageFab: React.FC<PageFabProps> = memo(({ icon, label, ariaLabel, onClick }) => (
  <button
    type="button"
    className={styles.fab}
    onClick={onClick}
    aria-label={ariaLabel ?? label}
  >
    {icon}
    <span>{label}</span>
  </button>
));

PageFab.displayName = 'PageFab';

export default PageFab;
