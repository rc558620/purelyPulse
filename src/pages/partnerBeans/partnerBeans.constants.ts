// partnerBeans 页面共享常量与映射配置
import type { PartnerBeansFilterTab, PartnerBeansPageSource, PartnerBeansTabOption } from './partnerBeans.types';

export const PARTNER_BEANS_SOURCE_LABELS: Record<PartnerBeansPageSource, string> = {
  promo_reward: '推广奖励',
  deduct_payment: '抵扣消费',
  withdrawal: '提现扣除',
  admin_adjust: '管理员调整',
};

export const PARTNER_BEANS_FILTER_TABS: PartnerBeansTabOption[] = [
  { value: 'all', label: '全部' },
  { value: 'admin', label: '管理员调整' },
  { value: 'earn', label: '获得' },
  { value: 'spend', label: '消耗/提现' },
];

export const PARTNER_BEANS_EMPTY_STATS = {
  totalRecords: 0,
  adminAdjustCount: 0,
  withdrawCount: 0,
  promoRewardCount: 0,
};

export const PARTNER_BEANS_DEFAULT_FILTER_TAB: PartnerBeansFilterTab = 'all';

/** 纯利豆流水单页条数（与后端 cursor 分页默认口径一致）。 */
export const PARTNER_BEANS_PAGE_SIZE = 20;

/** 搜索输入防抖时长：连续输入只打最后一次请求。 */
export const PARTNER_BEANS_SEARCH_DEBOUNCE_MS = 250;

export const PARTNER_BEANS_ADJUST_PRESET_AMOUNTS = [50, 100, 200, 500];

export const PARTNER_BEANS_REASON_PRESETS = [
  '管理员手动补发纯利豆',
  '活动奖励纯利豆',
  '合伙人回馈纯利豆',
  '管理员手动扣减纯利豆',
  '系统错误修正',
];

export const PARTNER_BEANS_ADJUST_OPTIONS = [
  { value: 'add', label: '增加纯利豆', sign: '+', color: '#f59e0b' },
  { value: 'subtract', label: '减少纯利豆', sign: '-', color: '#ef4444' },
] as const;
