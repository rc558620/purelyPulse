// 会员设置页面类型：统一承载套餐配置、表单值与卡片状态类型。
import type * as React from 'react';

export type TierId = 'monthly' | 'quarterly' | 'yearly' | 'lifetime';
export type ToneName = 'blue' | 'purple' | 'amber' | 'rose';

export interface MembershipTierConfig {
  /** 套餐标识 */
  id: TierId;
  /** 套餐名称 */
  label: string;
  /** 套餐副标题 */
  sublabel: string;
  /** 套餐图标组件 */
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  /** 卡片视觉色调 */
  tone: ToneName;
}

export interface TierValue {
  /** 会员价格，单位为元的字符串 */
  price: string;
  /** 永久会员有效天数，仅永久会员使用 */
  lifetimeDays?: string;
}

export interface MembershipTierCardProps {
  /** 套餐配置 */
  config: MembershipTierConfig;
  /** 卡片初始值 */
  initialValue: TierValue;
  /** 保存当前卡片配置 */
  onSaveValue: (tierId: TierId, value: TierValue) => Promise<TierValue>;
}

export type MembershipTierValuesMap = Record<TierId, TierValue>;

export interface UseMembershipSettingsPageResult {
  /** 当前套餐配置值集合 */
  tierValues: MembershipTierValuesMap;
  /** 是否处于首屏加载中 */
  isLoading: boolean;
  /** 当前错误文案 */
  errorMessage: string;
  /** 重试拉取配置 */
  retryLoad: () => void;
  /** 保存单个套餐配置 */
  handleSaveTierValue: (tierId: TierId, value: TierValue) => Promise<TierValue>;
}

export interface UseMembershipTierCardResult {
  /** 当前正在编辑的值 */
  value: TierValue;
  /** 最近一次成功保存的值 */
  savedValue: TierValue;
  /** 是否存在未保存改动 */
  isDirty: boolean;
  /** 是否处于保存中 */
  isSaving: boolean;
  /** 是否显示刚保存成功态 */
  justSaved: boolean;
  /** 价格输入处理函数 */
  handlePriceChange: (rawValue: string) => void;
  /** 有效期输入处理函数 */
  handleDaysChange: (rawValue: string) => void;
  /** 保存当前卡片配置 */
  handleSave: () => Promise<void>;
}
