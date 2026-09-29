// 调整续费价格弹窗的纯函数工具：档位换算、输入校验、覆盖率预览。
import type { MemberLevel } from '@pages/memberList/memberList.types';
import type { MemberRenewalPrice, RenewalPricePlanId } from '@pages/memberList/memberList.pricing.types';

/** 只有年 / 永久档位才含子账号加价，与后端 SUB_ACCOUNT_PRICING_PLAN_IDS 对齐。 */
const SUB_ACCOUNT_PLAN_IDS: readonly RenewalPricePlanId[] = ['yearly', 'lifetime'];

/** 该档位是否叠加子账号加价。 */
export const isSubAccountPlan = (planId: RenewalPricePlanId): boolean =>
  SUB_ACCOUNT_PLAN_IDS.includes(planId);

/**
 * 会员等级（`annual`）→ 续费档位标识（`yearly`）。
 *
 * 两套命名在后端并存：`MemberLevel` 是前端展示口径，档位标识走 Prisma 的 `yearly`，
 * 直接拿 `annual` 当档位提交会被后端判为非法。免费 / 未知等级返回 null。
 */
export const toRenewalPlanId = (level: MemberLevel): RenewalPricePlanId | null => {
  switch (level) {
    case 'monthly':
      return 'monthly';
    case 'quarterly':
      return 'quarterly';
    case 'annual':
      return 'yearly';
    case 'lifetime':
      return 'lifetime';
    default:
      return null;
  }
};

/** 金额输入格式：非负数字、最多两位小数；空串合法，代表清除覆盖、回落到配置价。 */
const PRICE_INPUT_PATTERN = /^\d+(\.\d{1,2})?$/;

/** 校验输入框内容是否可用于提交。 */
export const isPriceInputValid = (value: string): boolean => {
  const trimmed = value.trim();
  return trimmed === '' || PRICE_INPUT_PATTERN.test(trimmed);
};

/** 展示金额（元）→ 整数分；非法返回 null。 */
const parseYuanToCents = (value: string): number | null => {
  const trimmed = value.trim();
  if (!PRICE_INPUT_PATTERN.test(trimmed)) {
    return null;
  }

  const [integerPart, decimalPart = ''] = trimmed.split('.');
  const cents = Number(integerPart) * 100 + Number(`${decimalPart}00`.slice(0, 2));
  return Number.isFinite(cents) ? cents : null;
};

/**
 * 整数分 → 展示金额（元）。
 *
 * ⚠️ 必须与后端 `formatYuan`（`Money.toFixedOutputYuan()` + 去掉整元的 `.00`）
 * **逐字符对齐**：只裁整元的 `.00`，**不裁** `458.50` 里角位的那个 0。
 * 前端只要多裁一级，预览就会变成 `458.5` 而后端下发的是 `458.50`，
 * 任何拿「预览 === 现续费价」做判断的地方都会把没改过的行误判成已改动。
 */
const formatCents = (cents: number): string =>
  (cents / 100).toFixed(2).replace(/\.00$/, '');

/**
 * 预览「最终续费价」= max(配置价, 覆盖价输入) + 子账号加价。
 *
 * 与后端 `resolveRenewalPriceFen` 保持同一口径：配置价与议定价**取高者**，
 * 因此输入低于配置价时预览会回落到配置价——运营一眼就能看出这次改价不生效
 * （配置价涨到比议定价高之后，旧的议定价不再压价）。
 *
 * 仅用于输入过程中的即时预览；用整数分相加规避浮点误差
 * （0.1 + 0.2 = 0.30000000000000004）。
 * 权威金额仍以后端保存成功后下发的 `renewalPriceDisplay` 为准。
 * 输入非法时返回空串，由调用方决定是否隐藏预览。
 */
export const resolveRenewalPreviewDisplay = (
  planId: RenewalPricePlanId,
  configPriceDisplay: string,
  overrideInput: string,
  subAccountAmountDisplay: string,
): string => {
  const configCents = parseYuanToCents(configPriceDisplay);
  if (configCents === null) {
    return '';
  }

  const trimmedInput = overrideInput.trim();
  let baseCents = configCents;
  if (trimmedInput !== '') {
    const overrideCents = parseYuanToCents(trimmedInput);
    if (overrideCents === null) {
      return '';
    }
    baseCents = Math.max(configCents, overrideCents);
  }

  const surchargeCents = isSubAccountPlan(planId)
    ? parseYuanToCents(subAccountAmountDisplay) ?? 0
    : 0;

  return formatCents(baseCents + surchargeCents);
};

/** 输入是否等于「未覆盖」状态（空串与 null 等价）。 */
export const isClearedInput = (value: string): boolean => value.trim() === '';

/**
 * 输入框的初值 = **当前生效的定价基数** `max(配置价, 议定价)`；未议定时为空串。
 *
 * 配置价涨过议定价后，陈旧议定价不再生效（定价口径是取高者），
 * 输入框必须跟着显示配置价——否则运营会看到「已议价 ¥499」却按 ¥599 续费。
 * 回显的只是当前生效基数：不动这一行就不会把配置价写回议定价，
 * 因此配置价日后回落，原议定价仍会重新生效。
 */
export const resolveRenewalInputValue = (item: MemberRenewalPrice): string => {
  const overrideDisplay = item.overridePriceDisplay ?? '';
  if (isClearedInput(overrideDisplay)) {
    return '';
  }

  const overrideCents = parseYuanToCents(overrideDisplay);
  const configCents = parseYuanToCents(item.configPriceDisplay);
  if (overrideCents === null || configCents === null) {
    // 后端下发的展示值理论上一定合法；兜底回显议定价原值，不清空输入框
    return overrideDisplay;
  }

  return formatCents(Math.max(configCents, overrideCents));
};

/** 档位行的议价状态：按配置价 / 已议价且生效 / 已议价但被配置价压过（未生效）。 */
export type RenewalPriceBadgeState = 'default' | 'effective' | 'inactive';

/**
 * 徽标状态。
 *
 * 「未生效」只可能来自**库里那份议定价**：定价基数取 `max(配置价, 议定价)`，
 * 配置价涨过议定价后旧议定价不再参与定价，但这条记录还在库里。
 * 判断基准因此分两种：
 *  - 这一行没被改动过 → 看后端下发的 `overridePriceDisplay`（库里的真实议定价）
 *  - 运营改过输入 → 看输入值，实时反馈这次改价会不会生效
 * 若统一看输入框，陈旧议定价会被 `resolveRenewalInputValue` 修正成配置价，
 * 徽标就永远显示「生效中」，运营无从察觉这条记录已经失效。
 */
export const resolveRenewalBadgeState = (
  item: MemberRenewalPrice,
  inputValue: string,
): RenewalPriceBadgeState => {
  if (isClearedInput(inputValue)) {
    return 'default';
  }

  // 未议价时收敛成空串：下面「非法 → 兜底生效中」的分支一并接住
  const overrideDisplay = item.overridePriceDisplay ?? '';
  const basisDisplay = isRowChanged(item, inputValue) ? inputValue : overrideDisplay;
  const basisCents = parseYuanToCents(basisDisplay);
  const configCents = parseYuanToCents(item.configPriceDisplay);

  // 后端下发的展示值理论上一定合法；异常时按「生效中」兜底，不制造无谓的告警
  if (basisCents === null || configCents === null) {
    return 'effective';
  }

  return basisCents < configCents ? 'inactive' : 'effective';
};

/** 展示金额是否大于 0；仅用于决定要不要展示「子账号加价」分项，不参与定价。 */
export const isPositiveDisplayAmount = (value: string): boolean => {
  const trimmed = value.trim();
  return /^\d/.test(trimmed) && Number(trimmed) > 0;
};

/**
 * 该行是否真的改了值，决定要不要提交。
 *
 * 比较基准与输入框初值同源（`resolveRenewalInputValue`），否则「配置价已涨过议定价」
 * 的行会因为初值被修正而凭空变成一次改动，点一次保存就把配置价写成新的议定价。
 * 按「分」比较而非字符串，避免运营把 `350` 写成 `350.00` 时产生一次无意义的写入与审计。
 * 输入非法一律视为已改（此时提交按钮本就禁用，这里只是不让它被当成「没改」而静默丢改动）。
 */
export const isRowChanged = (item: MemberRenewalPrice, inputValue: string): boolean => {
  const currentValue = resolveRenewalInputValue(item);
  if (!isPriceInputValid(inputValue)) {
    return true;
  }
  if (isClearedInput(inputValue) && isClearedInput(currentValue)) {
    return false;
  }

  return parseYuanToCents(inputValue) !== parseYuanToCents(currentValue);
};

/**
 * 行内提示的种类。
 *
 * - `adjusted`：有改动，且这次改动真的会抬价 → 展示「调整后续费价 ¥X（保存后立即生效）」
 * - `ineffective`：有改动，但输入低于配置价 → 改动会写库却**不生效**，必须点破，
 *   否则运营保存完发现价格没动，还以为系统坏了
 * - `stale`：没改动，库里的议定价已被配置价压过
 * - `effective`：没改动，议定价生效中
 * - `config`：没改动且未议价
 */
export type RenewalPriceHintKind =
  | 'adjusted'
  | 'ineffective'
  | 'stale'
  | 'effective'
  | 'config';

export interface RenewalPriceHint {
  kind: RenewalPriceHintKind;
  /** 提示里要强调的金额（元）：改动的输入值 / 库里的议定价 / 配置价。 */
  amountDisplay: string;
  /** 按当前输入（未改动时即现状）得出的最终续费价，含子账号加价。 */
  previewDisplay: string;
}

/**
 * 行内提示的判定。
 *
 * ⚠️ 「有没有改动」必须取 `isRowChanged`（与提交判定同源），
 * **不能**用「预览价是否变化」代替：输入低于配置价时最终价本来就等于配置价，
 * 预览不会变，但这一行确实要写库。曾因此出现「运营填了 450，
 * 提示却是『留空即按配置价续费』」的自相矛盾。
 */
export const resolveRenewalHint = (
  item: MemberRenewalPrice,
  inputValue: string,
): RenewalPriceHint => {
  const previewDisplay = resolveRenewalPreviewDisplay(
    item.planId,
    item.configPriceDisplay,
    inputValue,
    item.subAccountAmountDisplay,
  );
  const badgeState = resolveRenewalBadgeState(item, inputValue);
  const overrideDisplay = item.overridePriceDisplay ?? '';

  if (isRowChanged(item, inputValue)) {
    return badgeState === 'inactive'
      ? { kind: 'ineffective', amountDisplay: inputValue.trim(), previewDisplay }
      : { kind: 'adjusted', amountDisplay: previewDisplay, previewDisplay };
  }

  if (badgeState === 'inactive') {
    return { kind: 'stale', amountDisplay: overrideDisplay, previewDisplay };
  }

  // 未改动且判定为生效中的行，库里必然有议定价（否则徽标不会是「生效中」）
  if (badgeState === 'effective') {
    return { kind: 'effective', amountDisplay: overrideDisplay, previewDisplay };
  }

  return { kind: 'config', amountDisplay: item.configPriceDisplay, previewDisplay };
};
