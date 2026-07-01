/**
 * SectionCard —— 通用白底卡片容器
 *
 * 包含两个子组件：
 *  - SectionCard.Header：标题行（左侧图标+文字，右侧任意节点）
 *  - SectionCard.DividedList：在列表项之间自动插入分割线
 *
 * 用法：
 * ```tsx
 * <SectionCard fullHeight>
 *   <SectionCard.Header
 *     icon={<IconLineChart />}
 *     title="利润趋势"
 *     extra={<Badge>共 ¥1,200</Badge>}
 *   />
 *   <SomeContent />
 * </SectionCard>
 *
 * // 带分割线列表：
 * <SectionCard>
 *   <SectionCard.DividedList items={menuItems} renderItem={(item) => <MenuRow {...item} />} />
 * </SectionCard>
 * ```
 */
import React, { memo } from 'react';
import { cx } from '@utils/utils';
import styles from './SectionCard.module.less';

// ─── SectionCard ─────────────────────────────────────────────

export interface SectionCardProps {
  children: React.ReactNode;
  /** 撑满父容器高度（用于并排卡片等高场景） */
  fullHeight?: boolean;
  /** 去除卡片内边距（用于 MenuRow 列表等自带 padding 的内容） */
  noPadding?: boolean;
  /** 裁切子元素溢出内容（默认 false，不裁切） */
  overflowHidden?: boolean;
  className?: string;
}

const SectionCard = memo<SectionCardProps>(({ children, fullHeight = false, noPadding = false, overflowHidden = false, className }) => (
  <div className={cx(styles.card, fullHeight && styles.cardFull, noPadding && styles.cardNoPadding, overflowHidden && styles.cardOverflowHidden, className)}>
    {children}
  </div>
));

SectionCard.displayName = 'SectionCard';

// ─── SectionCard.Header ──────────────────────────────────────

export interface SectionCardHeaderProps {
  /** 标题左侧图标（SVG 节点 或 emoji 字符串） */
  icon?: React.ReactNode;
  /** 标题文字 */
  title: string;
  /** 标题行右侧附加内容（徽标/操作 Tabs 等） */
  extra?: React.ReactNode;
  className?: string;
}

const SectionCardHeader = memo<SectionCardHeaderProps>(({ icon, title, extra, className }) => {
  const isEmoji = typeof icon === 'string';

  return (
    <div className={cx(styles.cardHeader, className)}>
      <h3 className={styles.cardTitle}>
        {icon && (
          isEmoji
            ? <span className={styles.titleEmoji}>{icon}</span>
            : icon
        )}
        {title}
      </h3>
      {extra ?? null}
    </div>
  );
});

SectionCardHeader.displayName = 'SectionCard.Header';

// ─── SectionCard.DividedList ─────────────────────────────────

export interface SectionCardDividedListProps<T> {
  /** 列表数据源。 */
  items: T[];
  /** 渲染每一条 item 的函数，接受 item 和 index。 */
  renderItem: (item: T, index: number) => React.ReactNode;
  /**
   * 获取每条 item 的唯一 key。
   * 默认取 `(item as any).id`，若数据结构不含 id 字段则需传入此函数。
   */
  keyExtractor?: (item: T, index: number) => string | number;
  /** 列表容器额外 className。 */
  className?: string;
  /** 分割线额外 className（用于覆盖默认分割线样式，如缩进效果）。 */
  dividerClassName?: string;
}

const _SectionCardDividedListInner = memo(function SectionCardDividedList<T>({
  items,
  renderItem,
  keyExtractor,
  className,
  dividerClassName,
}: SectionCardDividedListProps<T>): React.JSX.Element {
  return (
    <div className={cx(styles.dividedList, className)}>
      {items.map((item, index) => {
        const key = keyExtractor
          ? keyExtractor(item, index)
          : ((item as Record<string, unknown>).id as string | number) ?? index;
        return (
          <React.Fragment key={key}>
            {renderItem(item, index)}
            {index < items.length - 1 && (
              <div className={cx(styles.divider, dividerClassName)} aria-hidden="true" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
});

_SectionCardDividedListInner.displayName = 'SectionCard.DividedList';

const SectionCardDividedList = _SectionCardDividedListInner as <T>(
  props: SectionCardDividedListProps<T>,
) => React.JSX.Element;

// ─── 挂载子组件 ───────────────────────────────────────────────

const SectionCardWithHeader = Object.assign(SectionCard, {
  Header: SectionCardHeader,
  DividedList: SectionCardDividedList,
});

export default SectionCardWithHeader;
