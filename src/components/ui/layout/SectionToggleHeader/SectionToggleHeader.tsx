/**
 * SectionToggleHeader —— 通用区块标题行（含展开/收起按钮）
 *
 * 左侧标题 + 右侧展开/收起切换按钮，支持自定义图标。
 */
import React, { type ReactNode } from 'react';
import { cx } from '@utils/utils';
import styles from './SectionToggleHeader.module.less';

// ─── 默认折叠图标（柱状图三条线）──────────────────────────────────

const DefaultToggleIcon: React.FC = () => (
  <svg
    width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6"  y1="20" x2="6"  y2="14" />
  </svg>
);

// ─── Props ──────────────────────────────────────────────────────

export interface SectionToggleHeaderProps {
  /** 区块标题文字 */
  title: string;
  /** 当前展开状态 */
  visible: boolean;
  /** 切换回调 */
  onToggle: () => void;
  /** 按钮左侧自定义图标，默认使用柱状图图标 */
  toggleIcon?: ReactNode;
}

// ─── 组件 ──────────────────────────────────────────────────────

const SectionToggleHeader: React.FC<SectionToggleHeaderProps> = React.memo(({
  title,
  visible,
  onToggle,
  toggleIcon,
}) => (
  <div className={styles.sectionHeader}>
    <h3 className={styles.sectionTitle}>{title}</h3>
    <button
      type="button"
      className={cx(styles.toggleBtn, visible && styles.toggleBtnActive)}
      onClick={onToggle}
      aria-label={visible ? `收起${title}` : `展开${title}`}
      aria-pressed={visible}
    >
      {toggleIcon ?? <DefaultToggleIcon />}
      <span>{visible ? '收起' : '展开'}</span>
    </button>
  </div>
));

SectionToggleHeader.displayName = 'SectionToggleHeader';

export default SectionToggleHeader;
