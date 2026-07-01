/**
 * PageFab —— 通用页面悬浮操作按钮（FAB）
 *
 * 固定在页面右下角，带渐变背景和阴影动效。
 * 接受自定义图标和文字，支持 ariaLabel 无障碍。
 * 支持 disabled / loading 态，loading 时显示 spinner 并禁止交互。
 * 支持外部 className 覆盖样式。
 */
import React, { memo, useCallback, type ReactNode } from 'react';
import { cx } from '@utils/utils';
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
  /** 是否禁用，禁用后不可点击且样式变灰 */
  disabled?: boolean;
  /** 是否加载中，加载时显示 spinner 并自动禁用 */
  loading?: boolean;
  /** 额外 className，用于外部覆盖或扩展样式 */
  className?: string;
}

const PageFab: React.FC<PageFabProps> = memo(({
  icon,
  label,
  ariaLabel,
  onClick,
  disabled = false,
  loading = false,
  className,
}) => {
  const isDisabled = disabled || loading;

  const handleClick = useCallback(() => {
    if (!isDisabled) {
      onClick();
    }
  }, [isDisabled, onClick]);

  return (
    <button
      type="button"
      className={cx(styles.fab, loading && styles.loading, className)}
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={ariaLabel ?? label}
      aria-busy={loading || undefined}
    >
      {loading ? <span className={styles.spinner} data-testid="fab-spinner" aria-hidden="true" /> : icon}
      <span>{label}</span>
    </button>
  );
});

PageFab.displayName = 'PageFab';

export default PageFab;
