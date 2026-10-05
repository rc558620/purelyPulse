// 新客额度管理服务层：门店额度列表 / 增减额度（增量语义）
//
// 接口口径与 purelyProfit `/marketing/new-customer-quota` 完全同源：
// 后端读写的都是 store_membership_profiles.new_customer_quota，
// 因此这里调整成功后，商家端额度页与 purelyClub 的新客下单闸门会立即按新额度生效。
import { createKeyedInFlightRequest, http, resolveEnvPath } from '@utils/http';
import { safeNum, safeStr } from '@utils/utils';
import type { NewCustomerQuotaStore } from './newCustomerQuota.types';

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

interface QuotaStoresResponseDTO {
  items?: QuotaStoreResponseDTO[] | null;
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

const requestQuotaStores = async (): Promise<NewCustomerQuotaStore[]> => {
  const response = await http.get<QuotaStoresResponseDTO>(QUOTA_STORES_API_PATH, {
    skipGlobalErrorHandler: true,
    errorMessage: '获取门店新客额度失败，请稍后重试',
  });
  const rawItems = Array.isArray(response?.items) ? response.items : [];
  return rawItems.map(mapQuotaStore);
};

/** 拉取门店新客额度列表（并发去重） */
export const fetchNewCustomerQuotaStores = createKeyedInFlightRequest(
  () => 'new-customer-quota-stores',
  async (): Promise<NewCustomerQuotaStore[]> => requestQuotaStores(),
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
