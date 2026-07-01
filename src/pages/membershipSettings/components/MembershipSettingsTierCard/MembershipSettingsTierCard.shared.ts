// 会员套餐卡片共享逻辑：统一维护 tone 样式映射。
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

// 前端直读后端返回的 priceDisplay，不做任何处理，后端负责校验与格式化
export const formatMembershipTierPriceDisplay = (rawPrice: string): string => rawPrice || '0';
