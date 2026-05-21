// 通用菜单行组件
import React, { memo } from 'react';
import { cx } from '@utils/utils';
import { IconChevronRight } from '@components/ui/_shared/icons';
import styles from './MenuRow.module.less';

export type BadgeVariant = 'success' | 'warning' | 'info' | 'danger';

export interface MenuRowProps {
    /** 显示标签 */
    label: string;
    /** 描述文案（可选） */
    description?: string;
    /** 徽标文案 */
    badge?: string;
    /** 徽标颜色变体 */
    badgeVariant?: BadgeVariant;
    /** 左侧图标 */
    icon?: React.ReactNode;
    /** 是否显示右箭头，默认 true */
    showArrow?: boolean;
    /** 是否危险操作（红色样式） */
    danger?: boolean;
    /** 点击回调 */
    onClick: () => void;
    /** 自定义类名 */
    className?: string;
}

/** 单条菜单项组件 */
const MenuRow = memo(function MenuRow({
    label,
    description,
    badge,
    badgeVariant = 'info',
    icon,
    showArrow = true,
    danger = false,
    onClick,
    className,
}: MenuRowProps) {
    return (
        <button
            className={cx(styles.menuRow, danger && styles.menuRowDanger, className)}
            onClick={onClick}
            type="button"
        >
            {icon && (
                <div className={cx(styles.menuIcon, danger && styles.menuIconDanger)} aria-hidden="true">
                    {icon}
                </div>
            )}
            <div className={styles.menuText}>
                <span className={styles.menuLabel}>{label}</span>
                {description && <span className={styles.menuDesc}>{description}</span>}
            </div>
            <div className={styles.menuRight}>
                {badge && (
                    <span className={cx(styles.menuBadge, styles[`badge--${badgeVariant}`])}>
                        {badge}
                    </span>
                )}
                {showArrow && <span className={styles.menuArrow}><IconChevronRight /></span>}
            </div>
        </button>
    );
});

export default MenuRow;
