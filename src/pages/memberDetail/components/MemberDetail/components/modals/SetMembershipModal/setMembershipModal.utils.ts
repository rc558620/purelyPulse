// SetMembershipModal 纯函数：日期、金额、额度与提交参数的计算。
// fenToYuan 已删除：前端不做分转元转换。金额展示值由后端直接返回 xxxDisplay 字段。
import type { MemberLevel } from '@pages/memberList/memberList.types';
import {
  BASE_DURATION_OPTIONS,
  DAY_MS,
  LEVEL_RANK,
  MEMBERSHIP_LEVEL_LABELS,
  SUB_ACCOUNT_COUNT_MAX,
} from './SetMembershipModal.constants';
import type {
  DurationOption,
  MembershipConfirmOptions,
  ModalMembershipSelection,
} from './SetMembershipModal.types';

/** 合法金额格式：最多 2 位小数的正数，与后端 DTO 校验保持一致 */
const AMOUNT_INPUT_PATTERN = /^\d+(\.\d{1,2})?$/;

/** 验证用户输入的价格字符串是否合法 */
export const isValidAmountInput = (value: string): boolean => {
  const normalizedValue = value.trim();
  if (!normalizedValue) return false;
  if (!AMOUNT_INPUT_PATTERN.test(normalizedValue)) return false;
  const amount = Number(normalizedValue);
  return Number.isFinite(amount) && amount > 0;
};

export const formatMembershipExpiry = (ts: number): string => {
  const date = new Date(ts);
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
};

export const formatMembershipDaysLeft = (ts: number): string => {
  const diff = ts - Date.now();
  if (diff <= 0) return '已过期';
  const days = Math.ceil(diff / DAY_MS);
  if (days < 31) return `还有 ${days} 天`;
  if (days < 366) return `还有约 ${Math.round(days / 30)} 个月`;
  return `还有约 ${(days / 365).toFixed(1)} 年`;
};

/** 永久档位的天数由后端配置下发，其余档位直接用常量表 */
export const buildDurationOptions = (lifetimeMembershipDays: number): DurationOption[] =>
  BASE_DURATION_OPTIONS.map((option) => (
    option.value === 'lifetime'
      ? {
          ...option,
          daysBase: lifetimeMembershipDays,
          desc: `${lifetimeMembershipDays} 天订阅`,
        }
      : option
  ));

interface ResolveDefaultAmountDisplayParams {
  duration: ModalMembershipSelection;
  lifetimeMembershipAmountDisplay: string;
  annualMembershipAmountDisplay: string;
}

/** 读取指定档位的默认价格展示值；非自定义价格档位返回空串。 */
export const resolveDefaultAmountDisplay = ({
  duration,
  lifetimeMembershipAmountDisplay,
  annualMembershipAmountDisplay,
}: ResolveDefaultAmountDisplayParams): string => {
  if (duration === 'lifetime') return lifetimeMembershipAmountDisplay || '';
  if (duration === 'annual') return annualMembershipAmountDisplay || '';
  return '';
};

export const resolveLevelLabel = (level: MemberLevel): string => MEMBERSHIP_LEVEL_LABELS[level];

/**
 * 所选档位低于当前档位。
 *
 * 默认不降档——后端会把档位抬回原档、只按所选档位追加时长（等价于赠送时长）。
 * 对开了子账号的门店，真降档会造成「会员是月度、续费页只给年度、按月度下单又被拒」的死局，
 * 所以必须运营显式勾选才允许降。
 */
// 排除「免费」：降为免费走的是 confirmDowngradeToFree 与它自己的红色警告，
// 这里说的是「保持原档位、只追加时长」，对免费并不成立（免费没有时长可加），
// 混在一起会让运营看到「默认保持原档位、仅追加 0 天」这种自相矛盾的提示
export const isDowngradeSelection = (
  selectedDuration: ModalMembershipSelection,
  currentLevel: MemberLevel,
): boolean =>
  selectedDuration !== 'free'
  && (LEVEL_RANK[selectedDuration] ?? 0) < (LEVEL_RANK[currentLevel] ?? 0);

interface BuildPreviewRequestKeyParams {
  memberId: string;
  selectedDuration: ModalMembershipSelection;
  amountInput: string;
  subAccountCountInput: string;
  subAccountAmountInput: string;
}

/** 预览请求的参数指纹：任何一项变化都视为「另一次预览」。 */
// memberId 必须参与——结果归属某个会员，漏了会让上一位会员的价格被判为有效
export const buildPreviewRequestKey = ({
  memberId,
  selectedDuration,
  amountInput,
  subAccountCountInput,
  subAccountAmountInput,
}: BuildPreviewRequestKeyParams): string =>
  [
    memberId,
    selectedDuration,
    amountInput.trim(),
    subAccountCountInput,
    subAccountAmountInput.trim(),
  ].join('|');

// 子账号数量上限与后端 DTO 的 @Max(10) 对齐：不夹一次，输 99 就是一次必现的 400
export const clampSubAccountCountInput = (value: string): string => {
  const digits = value.replace(/[^\d]/g, '');
  if (!digits) {
    return '';
  }

  return String(Math.min(SUB_ACCOUNT_COUNT_MAX, Number.parseInt(digits, 10)));
};

// 只保留「数字 + 最多一位小数点 + 两位小数」：过滤掉非法字符后仍可能拼出
// "1.2.3"，直发后端就是 400，而且预览也会失败
export const normalizeSubAccountAmountInput = (value: string): string => {
  const digits = value.replace(/[^\d.]/g, '');
  const matched = digits.match(/^\d*(\.\d{0,2})?/);
  return matched ? matched[0] : '';
};

// 留空是合法的（本次不涉及子账号）；填了就必须与后端 DTO 的
// `^\d+(\.\d{1,2})?$` 一致，否则提交 400
export const resolveSubAccountAmountError = (
  subAccountAmountInput: string,
  requiresAmountInput: boolean,
): string => {
  if (!requiresAmountInput) {
    return '';
  }

  const trimmedAmount = subAccountAmountInput.trim();
  if (!trimmedAmount || AMOUNT_INPUT_PATTERN.test(trimmedAmount)) {
    return '';
  }

  return '请输入有效加价，最多保留 2 位小数';
};

interface BuildConfirmOptionsParams {
  isFree: boolean;
  isLifetime: boolean;
  requiresAmountInput: boolean;
  isAmountInputValid: boolean;
  amountInput: string;
  subAccountCountInput: string;
  subAccountAmountInput: string;
  multiplier: number;
  countAsIncome: boolean;
  isDowngradePlan: boolean;
  confirmDowngradePlan: boolean;
}

/**
 * 组装 onConfirm 的附加参数。
 *
 * 全部字段都留空时返回 undefined——「按当前档位原样提交」不需要任何附加参数。
 */
export const buildConfirmOptions = ({
  isFree,
  isLifetime,
  requiresAmountInput,
  isAmountInputValid,
  amountInput,
  subAccountCountInput,
  subAccountAmountInput,
  multiplier,
  countAsIncome,
  isDowngradePlan,
  confirmDowngradePlan,
}: BuildConfirmOptionsParams): MembershipConfirmOptions | undefined => {
  const options: MembershipConfirmOptions = {};

  // 设置为免费不是充值，无需计入收入
  if (!isFree) {
    options.countAsIncome = countAsIncome;
    // 期数：后端据此按「每期额度 × 期数」赠送新客额度，与追加天数同一口径。
    // 永久会员没有「期」的概念，固定 1 期
    options.multiplier = isLifetime ? 1 : multiplier;
  }

  if (requiresAmountInput && isAmountInputValid) {
    options.amountDisplay = amountInput.trim();
    const trimmedSubAccountAmount = subAccountAmountInput.trim();
    if (trimmedSubAccountAmount) {
      options.subAccountAmountDisplay = trimmedSubAccountAmount;
    }
    const parsedSubAccountCount = Number.parseInt(subAccountCountInput, 10);
    if (Number.isFinite(parsedSubAccountCount)) {
      options.subAccountCount = parsedSubAccountCount;
    }
  }

  // 默认保持原档位；只有运营显式勾选才真的降档
  if (isDowngradePlan && confirmDowngradePlan) {
    options.confirmDowngradePlan = true;
  }

  return Object.keys(options).length > 0 ? options : undefined;
};
