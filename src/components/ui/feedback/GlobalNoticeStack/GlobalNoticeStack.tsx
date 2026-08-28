// 全局通知堆栈容器：固定右上角承载多条通知卡片的通用挂载容器（服务呼叫/团购券新订单等共用）。
import type { ReactElement, ReactNode } from 'react';
import styles from './GlobalNoticeStack.module.less';

export interface GlobalNoticeStackProps {
  /** 通知卡片列表（由业务侧 map 渲染各自的通知卡片）。 */
  children: ReactNode;
  /** 无障碍标签（描述通知类型）。 */
  label: string;
}

/** 全局通知堆栈容器：仅承担固定定位与布局，卡片内容由业务侧注入。 */
export function GlobalNoticeStack({
  children,
  label,
}: GlobalNoticeStackProps): ReactElement {
  return (
    <div className={styles.stack} aria-live="polite" aria-label={label}>
      {children}
    </div>
  );
}
