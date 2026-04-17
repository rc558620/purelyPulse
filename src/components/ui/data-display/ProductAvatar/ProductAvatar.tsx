// 通用商品头像组件：有图显示图片，无图显示渐变占位 + 图标；支持预警角标。
// 适用于：库存商品列表行、库存调整弹窗标题区等场景。
import React, { memo } from 'react';
import { cx, safeStr } from '@utils/utils';
import styles from './ProductAvatar.module.less';

// ─── 内置 SVG 图标 ───────────────────────────────────────────────

/** 商品默认占位图标：购物袋 */
const IconProductBag: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

/** 预警角标：三角形警告 */
const IconBadgeAlert: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    width="8" height="8"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    {...props}
  >
    <path d="M12 2L2 19h20L12 2z" />
    <line x1="12" y1="10" x2="12" y2="14" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="17" r="1" fill="#fff" />
  </svg>
);

// ─── 类型定义 ────────────────────────────────────────────────────

/** 预警级别 */
export type ProductAlertLevel = 'normal' | 'warning' | 'danger';

export interface ProductAvatarProps {
  /** 商品图片 URL（无图时显示占位） */
  image?: string;
  /** 商品名称（用于 alt 属性） */
  name: string;
  /** 预警级别，影响占位背景色及角标 */
  alertLevel?: ProductAlertLevel;
  /**
   * 尺寸（宽高相等的 CSS 值），默认 '4.8rem'。
   * 推荐直接通过 style 或 className 控制，
   * 此 prop 方便快捷设置正方形尺寸。
   */
  size?: string;
  /** 占位图标大小（传给内置 SVG 的 width/height），默认 '20' */
  iconSize?: string;
  /** 额外 class，应用于外层 wrapper */
  className?: string;
}

const ProductAvatar: React.FC<ProductAvatarProps> = memo(({
  image,
  name,
  alertLevel = 'normal',
  size = '4.8rem',
  iconSize = '20',
  className,
}) => (
  <div
    className={cx(styles.wrapper, className)}
    style={{ width: size, height: size }}
  >
    {image ? (
      <img src={image} alt={safeStr(name)} className={styles.img} />
    ) : (
      <div className={cx(
        styles.placeholder,
        alertLevel === 'warning' && styles.placeholderWarning,
        alertLevel === 'danger'  && styles.placeholderDanger,
      )}>
        <IconProductBag width={iconSize} height={iconSize} />
      </div>
    )}

    {alertLevel !== 'normal' && (
      <div className={cx(
        styles.badge,
        alertLevel === 'danger' ? styles.badgeDanger : styles.badgeWarning,
      )}>
        <IconBadgeAlert />
      </div>
    )}
  </div>
));

ProductAvatar.displayName = 'ProductAvatar';

export default ProductAvatar;
