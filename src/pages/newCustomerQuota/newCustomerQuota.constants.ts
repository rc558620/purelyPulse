// 新客额度管理页面静态配置：筛选 Tab、调整方向、预设数量/原因
import { safeNum } from '@utils/utils';
import type {
  NewCustomerQuotaAdjustOption,
  NewCustomerQuotaFilterTab,
  NewCustomerQuotaHealth,
  NewCustomerQuotaStore,
  NewCustomerQuotaTabOption,
} from './newCustomerQuota.types';

/** 门店列表筛选 Tab：按额度健康度切分 */
export const NEW_CUSTOMER_QUOTA_FILTER_TABS: NewCustomerQuotaTabOption[] = [
  { value: 'all', label: '全部门店' },
  { value: 'warning', label: '额度预警' },
  { value: 'exhausted', label: '已耗尽' },
];

export const NEW_CUSTOMER_QUOTA_DEFAULT_FILTER_TAB: NewCustomerQuotaFilterTab = 'all';

/** 门店额度列表单页条数 */
export const NEW_CUSTOMER_QUOTA_PAGE_SIZE = 20;

/** 额度健康度 → 展示文案 */
export const NEW_CUSTOMER_QUOTA_HEALTH_LABELS: Record<NewCustomerQuotaHealth, string> = {
  none: '未发放',
  exhausted: '已耗尽',
  warning: '额度预警',
  healthy: '额度充足',
};

/**
 * 额度健康度判定（列表行标签、Tab 筛选、顶部统计三处共用，口径必须一致）。
 *
 * `consumed === 0 && remaining === 0` 表示平台从没发过额度（未发放），
 * 不能算「已耗尽」，否则新商家会被误标红、并污染顶部「已耗尽」统计。
 */
export const resolveQuotaHealth = (store: NewCustomerQuotaStore): NewCustomerQuotaHealth => {
  const remaining = safeNum(store.remaining);
  if (remaining <= 0) {
    return safeNum(store.consumed) > 0 ? 'exhausted' : 'none';
  }
  return remaining < safeNum(store.warningThreshold) ? 'warning' : 'healthy';
};

/** 额度调整方向：发放 / 回收 */
export const NEW_CUSTOMER_QUOTA_ADJUST_OPTIONS: NewCustomerQuotaAdjustOption[] = [
  { value: 'add', label: '增加额度', sign: '+', color: '#0891b2' },
  { value: 'subtract', label: '减少额度', sign: '−', color: '#ef4444' },
];

export const NEW_CUSTOMER_QUOTA_DEFAULT_ADJUST_DIR = NEW_CUSTOMER_QUOTA_ADJUST_OPTIONS[0].value;

/**
 * 调整弹窗快捷数量（位新客）。
 * 与后端会员档位赠送额度同源：月度 50 / 季度 100 / 年度 300，
 * 另补 500 / 1000 两个运营常用档，方便按档位一键填写。
 */
export const NEW_CUSTOMER_QUOTA_PRESET_VALUES = [50, 100, 300, 500, 1000];

/** 调整原因预设：写入额度流水说明，供商家端追溯 */
export const NEW_CUSTOMER_QUOTA_REASON_PRESETS = [
  '平台运营发放活动额度',
  '客服补偿新客额度',
  '会员赠送额度补发',
  '额度异常修正',
];
