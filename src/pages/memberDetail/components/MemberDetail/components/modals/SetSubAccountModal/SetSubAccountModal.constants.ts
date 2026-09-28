// SetSubAccountModal 常量：配额上限与「子账号加价可补录」的档位集合。
/** 子账号数量上限，与后端 DTO 的 @Max(10) 对齐：不夹一次，输 99 就是一次必现的 400。 */
export const QUOTA_MAX = 10;

/** 子账号加价只对年 / 永久档位有意义：月 / 季会员开不了子账号，永远不需要补录。 */
export const SUB_ACCOUNT_PRICING_PLAN_IDS: ReadonlySet<string> = new Set<string>([
  'yearly',
  'lifetime',
]);

/** 后端加价金额校验：输入框已过滤非法字符，但仍可能拼出 "1.2.3" 这类串，需提前拦下。 */
export const SUB_ACCOUNT_AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;
