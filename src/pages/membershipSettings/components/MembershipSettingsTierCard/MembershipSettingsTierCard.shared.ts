// 会员套餐卡片共享逻辑：统一维护 tone 样式映射与价格展示格式化。
import { safeNum, safeStr } from '@utils/utils';
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

export const formatMembershipTierPriceDisplay = (rawPrice: string): string => {
  const normalizedPrice = safeStr(rawPrice).trim();

  if (!normalizedPrice) {
    return '0';
  }

  const priceValue = safeNum(Number.parseFloat(normalizedPrice), 0);
  const decimalLength = normalizedPrice.split('.')[1]?.length ?? 0;

  if (decimalLength === 0) {
    return String(priceValue);
  }

  return priceValue.toFixed(Math.min(decimalLength, 2));
};
