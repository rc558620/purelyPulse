// 会员详情子账号能力映射：把后端子账号字段收敛成平台侧的能力快照。
import { safeNum } from '@utils/utils';
import { getNestedArray, getNestedRecord, isPlainObject, pickBooleanField, pickNumberField, pickStringField } from './memberList.normalize';
import type { SubAccountCapability, SubAccountRoleSummary } from './memberList.types';

const SUB_ACCOUNT_QUOTA_CANDIDATES = ['subAccountQuota', 'quota', 'subAccountCount'] as const;
const SUB_ACCOUNT_ELIGIBLE_CANDIDATES = ['subAccountEligible', 'eligible', 'canUseSubAccounts'] as const;
const SUB_ACCOUNT_CAPABILITY_ENABLED_CANDIDATES = ['subAccountCapabilityEnabled', 'enabled', 'isEnabled'] as const;
const SUB_ACCOUNT_QUOTA_MAX_CANDIDATES = ['subAccountQuotaMax', 'quotaMax', 'maxQuota', 'subAccountLimit'] as const;
const SUB_ACCOUNT_USED_COUNT_CANDIDATES = ['subAccountsUsedCount', 'usedCount', 'usedQuota'] as const;
const SUB_ACCOUNT_AVAILABLE_COUNT_CANDIDATES = ['subAccountsAvailableCount', 'availableCount', 'remainingQuota'] as const;

type SubAccountStatusValue = 'active' | 'inactive' | 'disabled';

/** 子账号角色归一：未知角色按收银员处理（最保守的权限）。 */
const normalizeSubAccountRole = (value: unknown): 'cashier' | 'finance' | 'manager' => {
  if (value === 'finance' || value === 'manager') {
    return value;
  }

  return 'cashier';
};

/** 子账号状态归一：未知状态按启用处理。 */
const normalizeSubAccountStatus = (value: unknown): SubAccountStatusValue => {
  if (value === 'inactive' || value === 'disabled') {
    return value;
  }

  return 'active';
};

/** 响应里是否携带子账号能力信号：没有相关字段时不下发能力快照。 */
const hasSubAccountCapabilitySignal = (value: unknown): value is Record<string, unknown> => {
  if (!isPlainObject(value)) {
    return false;
  }

  return [
    'subAccountCapability',
    'subAccountConfig',
    'subAccountEligible',
    'subAccountQuota',
    'quota',
    'subAccountCapabilityEnabled',
    'subAccountQuotaMax',
    'quotaMax',
    'subAccountsUsedCount',
    'subAccountsAvailableCount',
    'subAccountRoleSummary',
    'subAccountSlots',
  ].some((key) => key in value);
};

/** 单个槽位摘要映射。 */
const mapSubAccountRoleSummaryItem = (value: unknown, fallbackSlot: number): SubAccountRoleSummary => ({
  slot: pickNumberField(value, ['slot', 'slotIndex']) || fallbackSlot,
  role: normalizeSubAccountRole(pickStringField(value, ['role', 'subAccountRole']) || 'cashier'),
  status: normalizeSubAccountStatus(pickStringField(value, ['status', 'subAccountStatus']) || 'active'),
  isAssigned: pickBooleanField(value, ['isAssigned', 'assigned']),
});

/** 槽位摘要来源：优先后端下发的 roleSummary，缺失时回退 slots 列表。 */
const resolveSubAccountRoleSummary = (value: unknown): SubAccountRoleSummary[] => {
  const summarySource = getNestedArray(value, ['subAccountRoleSummary']);
  if (summarySource.length > 0) {
    return summarySource.map((item, index) => mapSubAccountRoleSummaryItem(item, index + 1));
  }

  const slotSource = getNestedArray(value, ['subAccountSlots', 'slots']);
  return slotSource.map((item, index) => mapSubAccountRoleSummaryItem(item, index + 1));
};

/** 子账号能力映射：无子账号字段时返回 undefined，避免 UI 渲染出全零的能力区。 */
export const mapSubAccountCapability = (value: unknown): SubAccountCapability | undefined => {
  if (!hasSubAccountCapabilitySignal(value)) {
    return undefined;
  }

  const capabilitySource = getNestedRecord(value, ['subAccountCapability', 'subAccountConfig']) ?? value;
  const roleSummary = resolveSubAccountRoleSummary(capabilitySource);
  const subAccountQuota = pickNumberField(capabilitySource, SUB_ACCOUNT_QUOTA_CANDIDATES);
  const subAccountQuotaMax = pickNumberField(capabilitySource, SUB_ACCOUNT_QUOTA_MAX_CANDIDATES);
  const subAccountsUsedCount = pickNumberField(capabilitySource, SUB_ACCOUNT_USED_COUNT_CANDIDATES);
  const subAccountsAvailableCount = pickNumberField(capabilitySource, SUB_ACCOUNT_AVAILABLE_COUNT_CANDIDATES);
  const subAccountEligible = pickBooleanField(capabilitySource, SUB_ACCOUNT_ELIGIBLE_CANDIDATES) || subAccountQuotaMax > 0;
  const subAccountCapabilityEnabled = pickBooleanField(capabilitySource, SUB_ACCOUNT_CAPABILITY_ENABLED_CANDIDATES) || subAccountQuota > 0;

  return {
    subAccountQuota,
    subAccountEligible,
    subAccountCapabilityEnabled,
    subAccountQuotaMax: subAccountQuotaMax || (subAccountEligible ? 10 : 0),
    subAccountsUsedCount,
    subAccountsAvailableCount: safeNum(subAccountsAvailableCount) || safeNum(Math.max(subAccountQuota - subAccountsUsedCount, 0)),
    subAccountRoleSummary: roleSummary,
  };
};
