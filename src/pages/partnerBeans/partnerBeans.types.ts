// partnerBeans 页面共享类型定义。
import type { BeanRecord, BeanSource, PartnerBeansStats, UserSnapshot } from './partnerBeans.shared.types';

export type PartnerBeansFilterTab = 'all' | 'admin' | 'earn' | 'spend';

export interface PartnerBeansTabOption {
  /** Tab 值 */
  value: PartnerBeansFilterTab;
  /** Tab 文案 */
  label: string;
}

export interface PartnerBeansRecordMeta {
  /** 数量样式类名 */
  amountClassName: string;
  /** 图标样式类名 */
  iconClassName: string;
  /** 图标类型 */
  iconType: 'earn' | 'withdraw' | 'spend';
}

export type PartnerBeansPageRecord = BeanRecord;
export type PartnerBeansPageUser = UserSnapshot;
export type PartnerBeansPageStats = PartnerBeansStats;
export type PartnerBeansPageSource = BeanSource;
