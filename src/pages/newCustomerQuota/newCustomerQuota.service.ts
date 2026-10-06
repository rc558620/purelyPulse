// 新客额度管理服务层：门店额度列表 / 增减额度（增量语义）
//
// 接口口径与 purelyProfit `/marketing/new-customer-quota` 完全同源：
// 后端读写的都是 store_membership_profiles.new_customer_quota，
// 因此这里调整成功后，商家端额度页与 purelyClub 的新客下单闸门会立即按新额度生效。
import { createKeyedInFlightRequest, http, resolveEnvPath } from '@utils/http';
import { safeNum, safeStr } from '@utils/utils';
import { NEW_CUSTOMER_QUOTA_PAGE_SIZE } from './newCustomerQuota.constants';
import type {
  NewCustomerQuotaListPageResult,
  NewCustomerQuotaListQuery,
  NewCustomerQuotaStore,
  NewCustomerQuotaStats,
} from './newCustomerQuota.types';

const QUOTA_STORES_API_PATH = resolveEnvPath(
  import.meta.env.VITE_NEW_CUSTOMER_QUOTA_STORES_API_PATH,
  '/pulse/membership/admin/new-customer-quota/stores',
);
/** 增减额度接口：`{storeId}` 占位符由 resolveQuotaAdjustPath 展开 */
const QUOTA_ADJUST_PATH = resolveEnvPath(
  import.meta.env.VITE_ADJUST_NEW_CUSTOMER_QUOTA_API_PATH,
  '/pulse/membership/admin/new-customer-quota/stores/{storeId}/adjust',
);

// ─── 响应 DTO ────────────────────────────────────────────────────────

interface QuotaStoreResponseDTO {
  storeId?: string | number | null;
  storeName?: string | null;
  ownerName?: string | null;
  ownerPhone?: string | null;
  ownerAvatarUrl?: string | null;
  remaining?: number | null;
  consumed?: number | null;
  warningThreshold?: number | null;
  updatedAt?: number | null;
}

interface QuotaStoresStatsResponseDTO {
  storeCount?: number | null;
  totalRemaining?: number | null;
  warningCount?: number | null;
  exhaustedCount?: number | null;
}

interface QuotaStoresResponseDTO {
  items?: QuotaStoreResponseDTO[] | null;
  total?: number | null;
  page?: number | null;
  pageSize?: number | null;
  hasMore?: boolean | null;
  stats?: QuotaStoresStatsResponseDTO | null;
}

// ─── DTO → 领域模型 ─────────────────────────────────────────────────

const DEFAULT_WARNING_THRESHOLD = 100;
const UNKNOWN_OWNER_NAME = '未命名账号';

const toSafeId = (rawId: string | number | null | undefined): string => {
  if (typeof rawId === 'number') {
    return Number.isFinite(rawId) ? String(rawId) : '';
  }
  return safeStr(rawId, '');
};

const mapQuotaStore = (response: QuotaStoreResponseDTO, index: number): NewCustomerQuotaStore => ({
  id: toSafeId(response?.storeId) || `quota-store-${index}`,
  storeName: safeStr(response?.storeName, '') || '未命名门店',
  ownerName: safeStr(response?.ownerName, '') || UNKNOWN_OWNER_NAME,
  ownerPhone: safeStr(response?.ownerPhone, ''),
  ownerAvatarUrl: safeStr(response?.ownerAvatarUrl, ''),
  remaining: safeNum(response?.remaining, 0),
  consumed: safeNum(response?.consumed, 0),
  warningThreshold: safeNum(response?.warningThreshold, DEFAULT_WARNING_THRESHOLD),
  updatedAt: safeNum(response?.updatedAt, 0),
});

/** 展开增减额度接口路径里的 `{storeId}` / `:storeId` 占位符 */
export const resolveQuotaAdjustPath = (storeId: string): string => {
  const encodedStoreId = encodeURIComponent(storeId);
  if (QUOTA_ADJUST_PATH.includes('{storeId}')) {
    return QUOTA_ADJUST_PATH.replace('{storeId}', encodedStoreId);
  }
  if (QUOTA_ADJUST_PATH.includes(':storeId')) {
    return QUOTA_ADJUST_PATH.replace(':storeId', encodedStoreId);
  }
  return `${QUOTA_ADJUST_PATH.replace(/\/+$/, '')}/${encodedStoreId}/adjust`;
};

// ─── 接口方法 ────────────────────────────────────────────────────────

/** 统计概览 DTO → 领域模型（数值全部 safeNum 兜底） */
const mapQuotaStats = (response: QuotaStoresStatsResponseDTO | null | undefined): NewCustomerQuotaStats => ({
  storeCount: safeNum(response?.storeCount, 0),
  totalRemaining: safeNum(response?.totalRemaining, 0),
  warningCount: safeNum(response?.warningCount, 0),
  exhaustedCount: safeNum(response?.exhaustedCount, 0),
});

/** 门店额度列表单页请求：搜索 / 健康度筛选 / 分页全部由后端权威处理 */
const requestQuotaStores = async (
  query: NewCustomerQuotaListQuery,
  page: number,
): Promise<NewCustomerQuotaListPageResult> => {
  const response = await http.get<QuotaStoresResponseDTO>(QUOTA_STORES_API_PATH, {
    params: {
      keyword: query.keyword || undefined,
      health: query.health ?? undefined,
      page,
      pageSize: NEW_CUSTOMER_QUOTA_PAGE_SIZE,
    },
    skipGlobalErrorHandler: true,
    errorMessage: '获取门店新客额度失败，请稍后重试',
  });
  const rawItems = Array.isArray(response?.items) ? response.items : [];

  return {
    stores: rawItems.map(mapQuotaStore),
    stats: mapQuotaStats(response?.stats),
    // 命中当前筛选条件的总数（含 health），列表头「N 家」的事实源；
    // 后端在无可访问门店等分支下可能不回传，退回已加载条数而不是 0
    total: safeNum(response?.total, rawItems.length),
    hasMore: response?.hasMore === true,
  };
};

/**
 * 拉取门店新客额度列表单页数据，并按「查询条件 + 页码」对并发请求做去重。
 *
 * 搜索 / 筛选 / 分页均由后端处理，前端不再做客户端过滤。
 */
export const fetchNewCustomerQuotaStores = createKeyedInFlightRequest(
  (query: NewCustomerQuotaListQuery, page: number) => JSON.stringify({ query, page }),
  async (query: NewCustomerQuotaListQuery, page: number): Promise<NewCustomerQuotaListPageResult> =>
    requestQuotaStores(query, safeNum(page, 1)),
);

/**
 * 增减门店新客额度：`delta` 正数为发放、负数为回收（余额不会低于 0）。
 *
 * 返回调整后的门店额度快照；响应体里没有可用 storeId 时返回 null，
 * 调用方据此跳过乐观更新——否则会把兜底的 0 当成真实余额写回列表。
 */
export const submitNewCustomerQuotaAdjust = async (
  storeId: string,
  delta: number,
  reason: string,
): Promise<NewCustomerQuotaStore | null> => {
  const response = await http.post<QuotaStoreResponseDTO, { delta: number; reason?: string }>(
    resolveQuotaAdjustPath(storeId),
    { delta, reason: reason.trim() || undefined },
    {
      skipGlobalErrorHandler: true,
      errorMessage: '调整新客额度失败，请稍后重试',
    },
  );

  if (!toSafeId(response?.storeId)) {
    return null;
  }

  return mapQuotaStore(response, 0);
};
