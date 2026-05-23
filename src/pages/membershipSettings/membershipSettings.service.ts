// 会员设置服务层：负责套餐配置接口请求、字段映射与保存载荷组装。
import { createKeyedInFlightRequest, http, resolveEnvPath } from '@utils/http';
import { safeNum } from '@utils/utils';
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

const MEMBERSHIP_SETTING_PLAN_IDS: TierId[] = [
  'monthly',
  'quarterly',
  'yearly',
  'lifetime',
];

interface MembershipSettingItemResponse {
  /** 套餐标识。 */
  planId: TierId;
  /** 套餐名称。 */
  planName: string;
  /** 套餐价格，单位分。 */
  price: number;
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
  /** 套餐价格，单位分。 */
  price: number;
}

interface UpdateLifetimeMembershipPayload extends UpdateMembershipPricePayload {
  /** 永久会员有效期天数。 */
  validDays: number;
}

const cloneTierValue = (value: TierValue): TierValue => ({
  price: value.price,
  lifetimeDays: value.lifetimeDays,
});

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

const normalizePriceText = (rawPrice: string): string => {
  const normalizedPrice = rawPrice.trim();
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

const fenToYuanText = (fen: number): string => {
  const amountYuan = safeNum(fen) / 100;
  return Number.isInteger(amountYuan) ? String(amountYuan) : amountYuan.toFixed(2);
};

const toFenAmount = (rawPrice: string): number => Math.round(safeNum(Number.parseFloat(rawPrice), 0) * 100);

const isMembershipSettingItemResponse = (value: unknown): value is MembershipSettingItemResponse => (
  isPlainObject(value)
  && isTierId(value.planId)
  && typeof value.planName === 'string'
  && typeof value.price === 'number'
  && Number.isFinite(value.price)
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

const assertMembershipSettingItemResponse = (value: unknown): MembershipSettingItemResponse => {
  if (!isMembershipSettingItemResponse(value)) {
    throw new Error('会员套餐配置保存响应结构不符合预期');
  }

  return value;
};

const mapSettingItemToTierValue = (item: MembershipSettingItemResponse): TierValue => ({
  price: normalizePriceText(fenToYuanText(item.price)),
  lifetimeDays: item.planId === 'lifetime'
    ? normalizeLifetimeDaysText(item.validDays === null ? undefined : String(item.validDays))
    : undefined,
});

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

const resolveUpdateTierPath = (tierId: TierId): string => {
  if (UPDATE_MEMBERSHIP_SETTINGS_API_PATH.includes('{level}')) {
    return UPDATE_MEMBERSHIP_SETTINGS_API_PATH.replace('{level}', tierId);
  }

  if (UPDATE_MEMBERSHIP_SETTINGS_API_PATH.includes(':level')) {
    return UPDATE_MEMBERSHIP_SETTINGS_API_PATH.replace(':level', tierId);
  }

  return `${UPDATE_MEMBERSHIP_SETTINGS_API_PATH.replace(/\/$/, '')}/${tierId}`;
};

const buildUpdatePayload = (
  tierId: TierId,
  value: TierValue,
): UpdateMembershipPricePayload | UpdateLifetimeMembershipPayload => {
  const normalizedPrice = normalizePriceText(value.price);
  if (tierId === 'lifetime') {
    return {
      price: toFenAmount(normalizedPrice),
      validDays: Number.parseInt(normalizeLifetimeDaysText(value.lifetimeDays), 10),
    };
  }

  return {
    price: toFenAmount(normalizedPrice),
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

  return mapSettingItemToTierValue(assertMembershipSettingItemResponse(response));
};
