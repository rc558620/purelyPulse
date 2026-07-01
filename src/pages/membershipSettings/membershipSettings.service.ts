// 会员设置服务层：负责套餐配置接口请求、字段映射与保存载荷组装。
import { createKeyedInFlightRequest, http, resolveEnvPath } from '@utils/http';
import { MEMBERSHIP_TIER_DEFAULT_VALUES } from './membershipSettings.constants';
import type {
  MembershipTierValuesMap,
  TierId,
  TierValue,
} from './membershipSettings.types';

const MEMBERSHIP_SETTINGS_API_PATH = resolveEnvPath(
  import.meta.env.VITE_MEMBERSHIP_SETTINGS_API_PATH,
  '/pulse/membership-settings',
);
const UPDATE_MEMBERSHIP_SETTINGS_API_PATH = resolveEnvPath(
  import.meta.env.VITE_UPDATE_MEMBERSHIP_SETTINGS_API_PATH,
  '/pulse/membership-settings/{level}',
);

// BUG-08 修复：从 TierId 类型自动推导，避免与类型不同步
const MEMBERSHIP_SETTING_PLAN_IDS: readonly TierId[] = (
  Object.keys(MEMBERSHIP_TIER_DEFAULT_VALUES) as TierId[]
);

interface MembershipSettingItemResponse {
  /** 套餐标识。 */
  planId: TierId;
  /** 套餐名称。 */
  planName: string;
  /** 套餐价格展示值（后端直接返回，前端不再分转元）。 */
  priceDisplay: string;
  /** 套餐有效天数，仅永久会员使用。 */
  validDays: number | null;
  /** 最近更新时间，单位 ms。 */
  updatedAt: number;
}

interface MembershipSettingsResponse {
  /** 后端返回的套餐配置列表。 */
  items: MembershipSettingItemResponse[];
}

interface UpdateMembershipPricePayload {
  /** 套餐价格展示值（元字符串，前端不做转换）。 */
  priceDisplay: string;
}

interface UpdateLifetimeMembershipPayload extends UpdateMembershipPricePayload {
  /** 永久会员有效期天数。 */
  validDays: number;
}

// BUG-11 修复：非 lifetime 套餐不应包含 lifetimeDays 键
const cloneTierValue = (value: TierValue): TierValue => {
  if ('lifetimeDays' in value && value.lifetimeDays !== undefined) {
    return { price: value.price, lifetimeDays: value.lifetimeDays };
  }

  return { price: value.price };
};

export const createDefaultMembershipTierValues = (): MembershipTierValuesMap => ({
  monthly: cloneTierValue(MEMBERSHIP_TIER_DEFAULT_VALUES.monthly),
  quarterly: cloneTierValue(MEMBERSHIP_TIER_DEFAULT_VALUES.quarterly),
  yearly: cloneTierValue(MEMBERSHIP_TIER_DEFAULT_VALUES.yearly),
  lifetime: cloneTierValue(MEMBERSHIP_TIER_DEFAULT_VALUES.lifetime),
});

const isPlainObject = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const isTierId = (value: unknown): value is TierId => (
  typeof value === 'string' && MEMBERSHIP_SETTING_PLAN_IDS.includes(value as TierId)
);

// normalizePriceText 已删除：前端不做任何金额文本处理。
// 后端返回的 priceDisplay 已是规范化字符串，前端直读直传，校验与格式化由后端负责。

const normalizeLifetimeDaysText = (rawValue: string | undefined): string => {
  const normalizedValue = rawValue?.trim() ?? '';
  if (!normalizedValue) {
    return MEMBERSHIP_TIER_DEFAULT_VALUES.lifetime.lifetimeDays ?? '730';
  }

  const parsedValue = Number.parseInt(normalizedValue, 10);
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return MEMBERSHIP_TIER_DEFAULT_VALUES.lifetime.lifetimeDays ?? '730';
  }

  return String(parsedValue);
};

// fenToYuanText / toFenAmount 已删除：前端不做分转元/元转分转换。金额展示值由后端直接返回 priceDisplay 字段。

const isMembershipSettingItemResponse = (value: unknown): value is MembershipSettingItemResponse => (
  isPlainObject(value)
  && isTierId(value.planId)
  && typeof value.planName === 'string'
  && typeof value.priceDisplay === 'string'
  && (value.validDays === null || (typeof value.validDays === 'number' && Number.isInteger(value.validDays)))
  && typeof value.updatedAt === 'number'
  && Number.isFinite(value.updatedAt)
);

const isMembershipSettingsResponse = (value: unknown): value is MembershipSettingsResponse => (
  isPlainObject(value)
  && Array.isArray(value.items)
  && value.items.every((item) => isMembershipSettingItemResponse(item))
);

const assertMembershipSettingsResponse = (value: unknown): MembershipSettingsResponse => {
  if (!isMembershipSettingsResponse(value)) {
    throw new Error('会员套餐配置返回结构不符合预期');
  }

  return value;
};

// BUG-11 修复：非 lifetime 套餐不附加 lifetimeDays 字段
const mapSettingItemToTierValue = (item: MembershipSettingItemResponse): TierValue => {
  if (item.planId === 'lifetime') {
    return {
      price: item.priceDisplay,
      lifetimeDays: normalizeLifetimeDaysText(item.validDays === null ? undefined : String(item.validDays)),
    };
  }

  return {
    price: item.priceDisplay,
  };
};

const mapMembershipSettingsResponse = (payload: MembershipSettingsResponse): MembershipTierValuesMap => {
  const nextValues = createDefaultMembershipTierValues();
  const receivedPlanIds = new Set<TierId>();

  for (const item of payload.items) {
    nextValues[item.planId] = mapSettingItemToTierValue(item);
    receivedPlanIds.add(item.planId);
  }

  const hasAllPlans = MEMBERSHIP_SETTING_PLAN_IDS.every((planId) => receivedPlanIds.has(planId));
  if (!hasAllPlans) {
    throw new Error('会员套餐配置缺少必要套餐项');
  }

  return nextValues;
};

// BUG-09 修复：对 tierId 进行 URL 编码
const resolveUpdateTierPath = (tierId: TierId): string => {
  const encodedTierId = encodeURIComponent(tierId);
  if (UPDATE_MEMBERSHIP_SETTINGS_API_PATH.includes('{level}')) {
    return UPDATE_MEMBERSHIP_SETTINGS_API_PATH.replace('{level}', encodedTierId);
  }

  if (UPDATE_MEMBERSHIP_SETTINGS_API_PATH.includes(':level')) {
    return UPDATE_MEMBERSHIP_SETTINGS_API_PATH.replace(':level', encodedTierId);
  }

  return `${UPDATE_MEMBERSHIP_SETTINGS_API_PATH.replace(/\/$/, '')}/${encodedTierId}`;
};

const buildUpdatePayload = (
  tierId: TierId,
  value: TierValue,
): UpdateMembershipPricePayload | UpdateLifetimeMembershipPayload => {
  // 前端直传用户输入，后端负责校验与格式化
  if (tierId === 'lifetime') {
    return {
      priceDisplay: value.price,
      validDays: Number.parseInt(normalizeLifetimeDaysText(value.lifetimeDays), 10),
    };
  }

  return {
    priceDisplay: value.price,
  };
};

const requestMembershipSettings = async (): Promise<MembershipTierValuesMap> => {
  const response = await http.get<unknown>(MEMBERSHIP_SETTINGS_API_PATH, {
    skipGlobalErrorHandler: true,
    errorMessage: '获取会员套餐配置失败，请稍后重试',
  });

  return mapMembershipSettingsResponse(assertMembershipSettingsResponse(response));
};

export const fetchMembershipSettings = createKeyedInFlightRequest(
  () => 'membership-settings',
  async (): Promise<MembershipTierValuesMap> => requestMembershipSettings(),
);

// BUG-04 修复：对 PATCH 返回值添加兜底映射，当后端返回不完整时回退到提交值
export const updateMembershipTierSetting = async (
  tierId: TierId,
  value: TierValue,
): Promise<TierValue> => {
  const response = await http.patch<unknown, UpdateMembershipPricePayload | UpdateLifetimeMembershipPayload>(
    resolveUpdateTierPath(tierId),
    buildUpdatePayload(tierId, value),
    {
      skipGlobalErrorHandler: true,
      errorMessage: '保存会员套餐配置失败，请稍后重试',
    },
  );

  // 优先尝试按完整 MembershipSettingItemResponse 解析
  if (isMembershipSettingItemResponse(response)) {
    return mapSettingItemToTierValue(response);
  }

  // 兜底：后端返回部分字段时，直接用提交值回写
  if (tierId === 'lifetime') {
    return {
      price: value.price,
      lifetimeDays: normalizeLifetimeDaysText(value.lifetimeDays),
    };
  }

  return {
    price: value.price,
  };
};
