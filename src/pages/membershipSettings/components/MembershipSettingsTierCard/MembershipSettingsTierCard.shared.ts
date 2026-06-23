// 会员套餐卡片共享逻辑：统一维护 tone 样式映射与价格展示格式化。
import { normalizePriceText } from '../../membershipSettings.service';
import type { ToneName } from '../../membershipSettings.types';

export interface MembershipSettingsTierToneClasses {
  /** 卡片 tone 样式类名 */
  card: string;
  /** 图标 tone 样式类名 */
  icon: string;
  /** 保存按钮 tone 样式类名 */
  button: string;
}

export const TONE_CLASS_NAMES: Record<ToneName, MembershipSettingsTierToneClasses> = {
  blue: {
    card: 'tierCardBlue',
    icon: 'tierIconBlue',
    button: 'saveBtnBlue',
  },
  purple: {
    card: 'tierCardPurple',
    icon: 'tierIconPurple',
    button: 'saveBtnPurple',
  },
  amber: {
    card: 'tierCardAmber',
    icon: 'tierIconAmber',
    button: 'saveBtnAmber',
  },
  rose: {
    card: 'tierCardRose',
    icon: 'tierIconRose',
    button: 'saveBtnRose',
  },
};

// BUG-12 修复：收敛为调用 service 层的 normalizePriceText，消除重复逻辑
export const formatMembershipTierPriceDisplay = (rawPrice: string): string => {
  const formatted = normalizePriceText(rawPrice);
  return formatted || '0';
};
