// 群发短信管理页面静态配置：筛选 Tab、赠送方向、预设金额 / 原因
//
// 🎨 本功能主题色为紫罗兰 Violet（区别于短信余额的青色 Cyan），
// 常量集中在 THEME 对象内，禁止在 .module.less 里再硬编码色值。
import { safeNum } from '@utils/utils';
import type {
  SmsAccount,
  SmsBroadcastGrantOption,
  SmsBroadcastFilterTab,
  SmsBroadcastHealth,
  SmsBroadcastTabOption,
} from './smsBroadcast.types';

/** 主题色：紫罗兰 Violet（短信余额取值为青色 #0891b2 / #22d3ee，本功能刻意换色区分） */
export const SMS_BROADCAST_THEME = {
  /** 主色 */
  primary: '#7c3aed',
  /** 渐变第二色 */
  secondary: '#a78bfa',
  /** 金额 / 强调文字 */
  strong: '#6d28d9',
  /** 失败 / 回收 */
  danger: '#ef4444',
  /** 预警 */
  warning: '#f59e0b',
} as const;

/** 门店列表筛选 Tab：按余额健康度切分 */
export const SMS_BROADCAST_FILTER_TABS: SmsBroadcastTabOption[] = [
  { value: 'all', label: '全部门店' },
  { value: 'warning', label: '余额预警' },
  { value: 'exhausted', label: '已耗尽' },
];

export const SMS_BROADCAST_DEFAULT_FILTER_TAB: SmsBroadcastFilterTab = 'all';

/** 门店短信账户列表单页条数 */
export const SMS_BROADCAST_PAGE_SIZE = 20;

/** 短信余额健康度 → 展示文案 */
export const SMS_BROADCAST_HEALTH_LABELS: Record<SmsBroadcastHealth, string> = {
  none: '未赠送',
  exhausted: '已耗尽',
  warning: '余额预警',
  healthy: '余额充足',
};

/**
 * 短信余额健康度判定（列表行标签、Tab 筛选、顶部统计三处共用，口径必须一致）。
 *
 * 与后端（balanceFen === 0 → exhausted / balanceFen < warningThresholdFen → warning）
 * 保持同一口径。`balanceFen <= 0 && totalConsumedFen === 0` 表示平台从没赠送过
 * 也没花过钱（未赠送），不能算「已耗尽」，否则新商家会被误标红、
 * 并污染顶部「已耗尽」统计。
 */
export const resolveSmsAccountHealth = (account: SmsAccount): SmsBroadcastHealth => {
  const balanceFen = safeNum(account.balanceFen);
  if (balanceFen <= 0) {
    return safeNum(account.totalConsumedFen) > 0 ? 'exhausted' : 'none';
  }
  return balanceFen < safeNum(account.warningThresholdFen) ? 'warning' : 'healthy';
};

/** 平台余额调整方向：赠送 / 回收 */
export const SMS_BROADCAST_GRANT_OPTIONS: SmsBroadcastGrantOption[] = [
  { value: 'grant', label: '赠送额度', sign: '+', color: SMS_BROADCAST_THEME.primary },
  { value: 'revoke', label: '回收额度', sign: '−', color: SMS_BROADCAST_THEME.danger },
];

export const SMS_BROADCAST_DEFAULT_GRANT_DIR =
  SMS_BROADCAST_GRANT_OPTIONS[0].value;

/**
 * 赠送弹窗快捷金额（**单位：元**，提交时 ×100 转分）。
 * 与后端短信充值档位（1000 / 5000 / 10000 / 30000 / 50000 分）同源，
 * 即 10 / 50 / 100 / 300 / 500 元五档。
 */
export const SMS_BROADCAST_PRESET_VALUES = [10, 50, 100, 300, 500];

/**
 * 单次赠送 / 回收的金额上限（**单位：元**）。
 *
 * 必须与后端 `PULSE_ADMIN_SMS_MAX_GRANT_FEN`（1_000_000 分 = ¥10,000）一致：
 * 前端不拦的话，运营填 ¥50,000 会一路走到后端才被 400 拒掉。
 */
export const SMS_BROADCAST_MAX_GRANT_YUAN = 10_000;

/** 调整原因预设：写入钱包流水（type=grant / admin_adjust）说明，供商家端追溯 */
export const SMS_BROADCAST_REASON_PRESETS = [
  '平台运营赠送短信额度',
  '客服补偿短信额度',
  '活动赠送短信额度',
  '额度异常修正',
];
