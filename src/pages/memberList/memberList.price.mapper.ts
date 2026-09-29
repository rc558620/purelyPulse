// 会员定价映射：首购锁定价、续费价、成交价预览三类「后端算好、前端只渲染」的价格结构。
import { isPlainObject, pickBooleanField, pickDisplayField, pickNumberField, pickStringField } from './memberList.normalize';
import type {
  LockedPriceSource,
  MemberLockedPrice,
  MemberPricingPreview,
  MemberRenewalPrice,
  RenewalPricePlanId,
} from './memberList.pricing.types';

/** 档位展示名：与商家端文案保持一致（永久档位统一展示为 AGES会员）。 */
const LOCKED_PRICE_PLAN_NAMES: Record<string, string> = {
  monthly: '月度会员',
  quarterly: '季度会员',
  yearly: '年度会员',
  lifetime: 'AGES会员',
};

const LOCKED_PRICE_SOURCE_LABELS: Record<LockedPriceSource, string> = {
  purchase: '商家续费成交',
  admin: '平台设置等级',
};

const normalizeLockedPriceSource = (value: string): LockedPriceSource =>
  value === 'admin' ? 'admin' : 'purchase';

/** 缺少档位或价格展示值（后端已格式化）时丢弃该条，避免渲染空行。 */
const mapLockedPriceItem = (value: unknown): MemberLockedPrice | null => {
  const planId = pickStringField(value, ['planId', 'plan']);
  const priceDisplay = pickStringField(value, ['priceDisplay', 'priceText']);
  if (!planId || !priceDisplay) {
    return null;
  }

  const source = normalizeLockedPriceSource(pickStringField(value, ['source']));
  // 未补录时后端下发 null；null / 空串统一归一成 null，供 UI 提示补录
  const rawSubAccountAmount = pickStringField(value, ['subAccountAmountDisplay']);
  const subAccountAmountDisplay =
    rawSubAccountAmount && rawSubAccountAmount.trim() ? rawSubAccountAmount : null;
  const rawSubAccountCount = pickNumberField(value, ['subAccountCount']);

  // 续费价同样做空串归一：后端未下发（null）时 pickStringField 返回 ''，
  // 直接透传会渲染成「= ¥」空值
  const rawRenewalPriceDisplay = pickStringField(value, ['renewalPriceDisplay']);
  const renewalPriceDisplay =
    rawRenewalPriceDisplay && rawRenewalPriceDisplay.trim()
      ? rawRenewalPriceDisplay
      : null;

  return {
    planId,
    planName: LOCKED_PRICE_PLAN_NAMES[planId] ?? planId,
    priceDisplay,
    subAccountAmountDisplay,
    subAccountCount: subAccountAmountDisplay === null ? null : (rawSubAccountCount || null),
    renewalPriceDisplay,
    source,
    sourceLabel: LOCKED_PRICE_SOURCE_LABELS[source],
    lockedAt: pickNumberField(value, ['lockedAt', 'lockedAtMs']),
  };
};

/** 从详情响应中取出首购锁定价快照。 */
export const resolveLockedPrices = (value: unknown): MemberLockedPrice[] => {
  const source = isPlainObject(value) ? value.lockedPrices : null;

  return (Array.isArray(source) ? source : [])
    .map((item) => mapLockedPriceItem(item))
    .filter((item): item is MemberLockedPrice => item !== null);
};

/** 可改价档位白名单：与后端 MembershipPlanCycle 对齐，过滤脏档位。 */
const RENEWAL_PRICE_PLAN_IDS: readonly RenewalPricePlanId[] = [
  'monthly',
  'quarterly',
  'yearly',
  'lifetime',
];

const isRenewalPricePlanId = (value: string): value is RenewalPricePlanId =>
  (RENEWAL_PRICE_PLAN_IDS as readonly string[]).includes(value);

/** 单行续费价映射：档位非法或缺最终价时丢弃，避免渲染空行。 */
const mapMemberRenewalPrice = (value: unknown): MemberRenewalPrice | null => {
  const rawPlanId = pickStringField(value, ['planId']);
  const renewalPriceDisplay = pickDisplayField(value, ['renewalPriceDisplay']);
  if (!isRenewalPricePlanId(rawPlanId) || !renewalPriceDisplay) {
    return null;
  }

  // 覆盖价为空串 / null 统一归一成 null，供 UI 区分「已覆盖」与「按配置价」
  const overridePriceDisplay =
    pickDisplayField(value, ['overridePriceDisplay']) || null;

  return {
    planId: rawPlanId,
    planName: pickStringField(value, ['planName']) || LOCKED_PRICE_PLAN_NAMES[rawPlanId],
    configPriceDisplay: pickDisplayField(value, ['configPriceDisplay']) || '0',
    overridePriceDisplay,
    subAccountAmountDisplay: pickDisplayField(value, ['subAccountAmountDisplay']) || '0',
    renewalPriceDisplay,
    // 后端未下发 editable 时按不可编辑处理：宁可不给改价入口，也不放出一个改了不生效的输入框
    editable: pickBooleanField(value, ['editable']),
    editableReason: pickStringField(value, ['editableReason']) || null,
  };
};

/** 从 `{ items: [...] }` 归一化出续费价列表，保持后端档位顺序。 */
export const toMemberRenewalPriceList = (payload: unknown): MemberRenewalPrice[] => {
  const source = isPlainObject(payload) ? payload.items : payload;

  return (Array.isArray(source) ? source : [])
    .map((item) => mapMemberRenewalPrice(item))
    .filter((item): item is MemberRenewalPrice => item !== null);
};

const EMPTY_PRICING_PREVIEW: MemberPricingPreview = {
  targetPlanId: null,
  configPriceDisplay: '0',
  subAccountAmountDisplay: '0',
  renewalPriceDisplay: '0',
  dealPriceDisplay: null,
};

/** 成交价预览映射：响应结构异常时回落到全零预览，保证弹窗不崩。 */
export const toMemberPricingPreview = (value: unknown): MemberPricingPreview => {
  if (!isPlainObject(value)) {
    return EMPTY_PRICING_PREVIEW;
  }

  // ⚠️ 一律用 `||` 而非 `??`：pickStringField 对缺失 / null 返回空串，
  // `'' ?? null` 仍是 ''，兜底会永远不生效（详情页面把 '' 当成「有值」渲染）
  return {
    targetPlanId: pickStringField(value, ['targetPlanId']) || null,
    configPriceDisplay: pickStringField(value, ['configPriceDisplay']) || '0',
    subAccountAmountDisplay:
      pickStringField(value, ['subAccountAmountDisplay']) || '0',
    renewalPriceDisplay: pickStringField(value, ['renewalPriceDisplay']) || '0',
    dealPriceDisplay: pickStringField(value, ['dealPriceDisplay']) || null,
  };
};
