// 群发短信管理服务层：门店短信账户列表 / 平台赠送或回收余额（**金额单位：分**）
//
// 接口前缀 /pulse/marketing/admin/sms，读写的是 purelyprofit-server
// `sms.prisma` 的 store_sms_accounts + sms_wallet_logs。
// 与 purelyProfit 商家端 `/marketing/sms` 同源：这里调整成功后，
// 商家端短信余额页与下一次群发询价会立即按新余额生效。
//
// 💡 `grant` / `admin_adjust` 两种钱包流水类型此前在全系统**没有写入方**，
// 本模块的「平台赠送」是它们的第一个生产者——即「运营给商家补额度」这条链路的唯一入口。
import { createKeyedInFlightRequest, http, resolveEnvPath } from '@utils/http';
import { safeNum, safeStr } from '@utils/utils';
import { SMS_BROADCAST_PAGE_SIZE } from './smsBroadcast.constants';
import type {
  SmsAccount,
  SmsBroadcastListPageResult,
  SmsBroadcastListQuery,
  SmsBroadcastStats,
} from './smsBroadcast.types';

const SMS_ACCOUNTS_API_PATH = resolveEnvPath(
  import.meta.env.VITE_SMS_BROADCAST_ACCOUNTS_API_PATH,
  '/pulse/marketing/admin/sms/accounts',
);
/** 赠送 / 回收余额接口：`{storeId}` 占位符由 resolveSmsGrantPath 展开 */
const SMS_GRANT_API_PATH = resolveEnvPath(
  import.meta.env.VITE_GRANT_SMS_BALANCE_API_PATH,
  '/pulse/marketing/admin/sms/accounts/{storeId}/grant',
);

/** 后端未回传预警阈值时的兜底值（分），与 purelyProfit SMS_WARNING_THRESHOLD_FEN 一致 */
const DEFAULT_WARNING_THRESHOLD_FEN = 500;
const UNKNOWN_OWNER_NAME = '未命名账号';

// ─── 响应 DTO ────────────────────────────────────────────────────────

interface SmsAccountResponseDTO {
  storeId?: string | number | null;
  storeName?: string | null;
  ownerName?: string | null;
  ownerPhone?: string | null;
  ownerAvatarUrl?: string | null;
  balanceFen?: number | null;
  totalRechargedFen?: number | null;
  totalConsumedFen?: number | null;
  sentSmsCount?: number | null;
  warningThresholdFen?: number | null;
  updatedAt?: number | null;
}

interface SmsAccountsStatsResponseDTO {
  storeCount?: number | null;
  totalBalanceFen?: number | null;
  warningCount?: number | null;
  exhaustedCount?: number | null;
}

interface SmsAccountsResponseDTO {
  items?: SmsAccountResponseDTO[] | null;
  total?: number | null;
  page?: number | null;
  pageSize?: number | null;
  hasMore?: boolean | null;
  stats?: SmsAccountsStatsResponseDTO | null;
}

// ─── DTO → 领域模型 ─────────────────────────────────────────────────

const toSafeId = (rawId: string | number | null | undefined): string => {
  if (typeof rawId === 'number') {
    return Number.isFinite(rawId) ? String(rawId) : '';
  }
  return safeStr(rawId, '');
};

const mapSmsAccount = (response: SmsAccountResponseDTO, index: number): SmsAccount => ({
  id: toSafeId(response?.storeId) || `sms-account-${index}`,
  storeName: safeStr(response?.storeName, '') || '未命名门店',
  ownerName: safeStr(response?.ownerName, '') || UNKNOWN_OWNER_NAME,
  ownerPhone: safeStr(response?.ownerPhone, ''),
  ownerAvatarUrl: safeStr(response?.ownerAvatarUrl, ''),
  balanceFen: safeNum(response?.balanceFen, 0),
  totalRechargedFen: safeNum(response?.totalRechargedFen, 0),
  totalConsumedFen: safeNum(response?.totalConsumedFen, 0),
  sentSmsCount: safeNum(response?.sentSmsCount, 0),
  warningThresholdFen: safeNum(response?.warningThresholdFen, DEFAULT_WARNING_THRESHOLD_FEN),
  updatedAt: safeNum(response?.updatedAt, 0),
});

/** 统计概览 DTO → 领域模型（数值全部 safeNum 兜底） */
const mapSmsStats = (
  response: SmsAccountsStatsResponseDTO | null | undefined,
): SmsBroadcastStats => ({
  storeCount: safeNum(response?.storeCount, 0),
  totalBalanceFen: safeNum(response?.totalBalanceFen, 0),
  warningCount: safeNum(response?.warningCount, 0),
  exhaustedCount: safeNum(response?.exhaustedCount, 0),
});

/** 展开赠送 / 回收接口路径里的 `{storeId}` / `:storeId` 占位符 */
export const resolveSmsGrantPath = (storeId: string): string => {
  const encodedStoreId = encodeURIComponent(storeId);
  if (SMS_GRANT_API_PATH.includes('{storeId}')) {
    return SMS_GRANT_API_PATH.replace('{storeId}', encodedStoreId);
  }
  if (SMS_GRANT_API_PATH.includes(':storeId')) {
    return SMS_GRANT_API_PATH.replace(':storeId', encodedStoreId);
  }
  return `${SMS_GRANT_API_PATH.replace(/\/+$/, '')}/${encodedStoreId}/grant`;
};

// ─── 接口方法 ────────────────────────────────────────────────────────

/** 门店短信账户列表单页请求：搜索 / 余额健康度筛选 / 分页全部由后端权威处理 */
const requestSmsAccounts = async (
  query: SmsBroadcastListQuery,
  page: number,
): Promise<SmsBroadcastListPageResult> => {
  const response = await http.get<SmsAccountsResponseDTO>(SMS_ACCOUNTS_API_PATH, {
    params: {
      keyword: query.keyword || undefined,
      health: query.health ?? undefined,
      page,
      pageSize: SMS_BROADCAST_PAGE_SIZE,
    },
    skipGlobalErrorHandler: true,
    errorMessage: '获取门店短信余额失败，请稍后重试',
  });
  const rawItems = Array.isArray(response?.items) ? response.items : [];

  return {
    stores: rawItems.map(mapSmsAccount),
    stats: mapSmsStats(response?.stats),
    // 命中当前筛选条件的总数（含 health），列表头「N 家」的事实源；
    // 后端在无可访问门店等分支下可能不回传，退回已加载条数而不是 0
    total: safeNum(response?.total, rawItems.length),
    hasMore: response?.hasMore === true,
  };
};

/**
 * 拉取门店短信账户列表单页数据，并按「查询条件 + 页码」对并发请求做去重。
 *
 * 搜索 / 筛选 / 分页均由后端处理，前端不再做客户端过滤。
 */
export const fetchSmsBroadcastAccounts = createKeyedInFlightRequest(
  (query: SmsBroadcastListQuery, page: number) => JSON.stringify({ query, page }),
  async (query: SmsBroadcastListQuery, page: number): Promise<SmsBroadcastListPageResult> =>
    requestSmsAccounts(query, safeNum(page, 1)),
);

/**
 * 平台赠送 / 回收门店短信余额：`amountFen` 正数为赠送、负数为回收（余额不会低于 0）。
 *
 * 后端会写入一条 `grant`（赠送）或 `admin_adjust`（回收）钱包流水。
 * 响应体里没有可用 storeId 时返回 null，调用方据此跳过乐观更新——
 * 否则会把兜底的 0 当成真实余额写回列表。
 */
export const submitSmsBalanceGrant = async (
  storeId: string,
  amountFen: number,
  reason: string,
): Promise<SmsAccount | null> => {
  const response = await http.post<SmsAccountResponseDTO, { amountFen: number; reason?: string }>(
    resolveSmsGrantPath(storeId),
    { amountFen, reason: reason.trim() || undefined },
    {
      skipGlobalErrorHandler: true,
      errorMessage: '调整短信余额失败，请稍后重试',
    },
  );

  if (!toSafeId(response?.storeId)) {
    return null;
  }

  return mapSmsAccount(response, 0);
};
