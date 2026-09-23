// 全局通知堆栈容器：固定定位承载多条通知卡片的通用挂载容器（服务呼叫/团购券/自助下单等共用）。
import type { ReactElement, ReactNode } from 'react';
import styles from './GlobalNoticeStack.module.less';

export type GlobalNoticeStackPlacement = 'top-right' | 'top-left' | 'bottom-right';

export interface GlobalNoticeStackProps {
  /** 通知卡片列表（由业务侧 map 渲染各自的通知卡片）。 */
  children: ReactNode;
  /** 无障碍标签（描述通知类型）。 */
  label: string;
  /** 屏幕停靠位置；默认右上角（保持既有业务表现不变）。 */
  placement?: GlobalNoticeStackPlacement;
}

/** 各停靠位置对应的容器样式类（默认右上角无需附加类）。 */
const PLACEMENT_CLASS_MAP: Record<GlobalNoticeStackPlacement, string | undefined> = {
  'top-right': undefined,
  'top-left': styles.stackTopLeft,
  'bottom-right': styles.stackBottomRight,
};

/** 全局通知堆栈容器：仅承担固定定位与布局，卡片内容由业务侧注入。 */
export function GlobalNoticeStack({
  children,
  label,
  placement = "top-right",
}: GlobalNoticeStackProps): ReactElement {
  const placementClass = PLACEMENT_CLASS_MAP[placement];
  return (
    <div
      className={[styles.stack, placementClass].filter(Boolean).join(" ")}
      aria-live="polite"
      aria-label={label}
    >
      {children}
    </div>
  );
}
