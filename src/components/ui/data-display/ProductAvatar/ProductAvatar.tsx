// 通用商品头像组件：有图显示图片，无图显示渐变占位 + 图标；支持预警角标。
// 适用于：库存商品列表行、库存调整弹窗标题区等场景。
import React, { memo, useState, useCallback } from 'react';
import { cx, safeStr } from '@utils/utils';
import { IconProductBag, IconBadgeAlert } from '@components/ui/_shared/icons';
import styles from './ProductAvatar.module.less';

// ─── 辅助函数 ────────────────────────────────────────────────────

/**
 * 将 CSS size 值（如 '4.8rem'、'48px'）转换为像素数（基于 1rem = 10px）。
 * 无法解析时返回 fallback。
 */
function sizeToPx(size: string, fallback: number): number {
  const m = size.match(/^([\d.]+)(rem|px)$/);
  if (!m) return fallback;
  const val = parseFloat(m[1]);
  return m[2] === 'rem' ? val * 10 : val;
}

/** 根据容器像素尺寸计算角标容器尺寸（约 33%，最小 14px，最大 22px） */
function badgeSize(containerPx: number): number {
  return Math.max(14, Math.min(22, Math.round(containerPx * 0.33)));
}

/** 角标内 SVG 图标尺寸（角标容器尺寸 × 0.5，向下取整） */
function badgeIconSize(badgePx: number): number {
  return Math.floor(badgePx * 0.5);
}

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
}) => {
  // BUG-1 fix: 图片加载失败时回退到占位模式
  const [imgFailed, setImgFailed] = useState(false);
  const handleImgError = useCallback(() => setImgFailed(true), []);

  // 是否显示占位（无图片 URL 或图片加载失败）
  const showPlaceholder = !image || imgFailed;

  // BUG-4 fix: 根据 size 动态计算角标尺寸
  const containerPx = sizeToPx(size, 48);
  const badgePx = badgeSize(containerPx);
  const badgeIconPx = badgeIconSize(badgePx);

  return (
    <div
      className={cx(styles.wrapper, className)}
      style={{ width: size, height: size }}
    >
      {showPlaceholder ? (
        <div className={cx(
          styles.placeholder,
          alertLevel === 'warning' && styles.placeholderWarning,
          alertLevel === 'danger'  && styles.placeholderDanger,
        )}>
          <IconProductBag width={iconSize} height={iconSize} />
        </div>
      ) : (
        // BUG-3 fix: 禁止图片拖拽；BUG-1 fix: onError 回退到占位
        <img
          src={image}
          alt={safeStr(name)}
          className={styles.img}
          draggable={false}
          onError={handleImgError}
        />
      )}

      {alertLevel !== 'normal' && (
        <div
          className={cx(
            styles.badge,
            alertLevel === 'danger' ? styles.badgeDanger : styles.badgeWarning,
          )}
          style={{ width: badgePx, height: badgePx }}
        >
          <IconBadgeAlert width={String(badgeIconPx)} height={String(badgeIconPx)} />
        </div>
      )}
    </div>
  );
});

ProductAvatar.displayName = 'ProductAvatar';

export default ProductAvatar;
