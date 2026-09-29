import { safeNum } from '@utils/utils';
import { SUB_ACCOUNT_PRICING_PLAN_IDS } from './components/MemberDetail/components/modals/SetSubAccountModal/SetSubAccountModal.constants';
import type { MemberLevel } from '../memberList/memberList.types';
import type { MemberLockedPrice } from '../memberList/memberList.pricing.types';

// 前端禁止金额转换。formatMemberAmount 已删除，会员金额展示值由后端直接返回 xxxDisplay 字段。

/** 格式化会员详情中的日期文案（yyyy.MM.dd）。 */
export function formatMemberDate(timestamp: number): string {
  const date = new Date(safeNum(timestamp));
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

/**
 * 格式化会员详情中的日期+时分文案（yyyy.MM.dd HH:mm）。
 *
 * 记录类列表（充值 / 设置会员等级 / 调整续费记录）同一天可能有多笔，
 * 只到「日」分不清先后，因此这几处统一带上时分。
 * 与 formatMemberDate 一样按浏览器本地时区渲染。
 */
export function formatMemberDateTime(timestamp: number): string {
  const date = new Date(safeNum(timestamp));
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${formatMemberDate(timestamp)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// formatMemberAmount 已删除：前端不做分转元转换。消费方应直接使用后端返回的 xxxDisplay 字段。

/**
 * 子账号加价补录状态。
 *
 * - `pending`    = 有子账号权益但年 / 永久档位缺子账号加价，续费会按纯配置价收（白送子账号）
 * - `backfilled` = 已补录（或档位本身不需要补录）
 * - `notEligible` = 免费 / 月 / 季会员，开不了子账号，不展示徽章
 */
export type SubAccountBackfillState = 'pending' | 'backfilled' | 'notEligible';

/**
 * 判断子账号加价的补录状态。
 *
 * 判据与会员列表的「待补录子账号加价」筛选、成交价快照卡里的告警保持一致：
 * 有子账号权益（年 / 永久）**且**存在年 / 永久档位的成交价快照缺子账号加价。
 *
 * ⚠️ 月 / 季档位的快照永远不需要补录：门店端根本开不了子账号，
 * 把它们算进来会让每个年度会员都误报「待补录」。
 */
export function resolveSubAccountBackfillState(
  memberLevel: MemberLevel,
  lockedPrices: MemberLockedPrice[] | undefined,
): SubAccountBackfillState {
  if (memberLevel !== 'annual' && memberLevel !== 'lifetime') {
    return 'notEligible';
  }

  const hasPendingBackfill = (lockedPrices ?? []).some(
    (item) =>
      SUB_ACCOUNT_PRICING_PLAN_IDS.has(item.planId) &&
      item.subAccountAmountDisplay === null,
  );

  return hasPendingBackfill ? 'pending' : 'backfilled';
}

/** 会员等级 → 对应的成交价快照档位（前端等级用 annual，后端档位是 yearly） */
const LEVEL_TO_PRICING_PLAN_ID: Partial<Record<MemberLevel, string>> = {
  annual: 'yearly',
  lifetime: 'lifetime',
};

/**
 * 取该会员**已补录**的子账号加价展示值（元），用于在子账号记录行里展示
 * 「N 个 = ¥xxx」。
 *
 * 优先取与当前会员等级同档位的快照（年度 → 年卡、永久 → AGES 卡），
 * 同档位没有时回落到第一条已补录的年 / 永久档位快照——
 * 续费定价是按当前档位算的，拿另一档位的加价会跟顶部的「续费价」胶囊对不上。
 * 一条都没补录时返回 null，由调用方退回只展示额度。
 */
export function resolveSubAccountAddOnPriceDisplay(
  memberLevel: MemberLevel,
  lockedPrices: MemberLockedPrice[] | undefined,
): string | null {
  const backfilled = (lockedPrices ?? []).filter(
    (item) =>
      SUB_ACCOUNT_PRICING_PLAN_IDS.has(item.planId) &&
      item.subAccountAmountDisplay !== null,
  );

  if (backfilled.length === 0) {
    return null;
  }

  const preferredPlanId = LEVEL_TO_PRICING_PLAN_ID[memberLevel];
  const preferred = backfilled.find((item) => item.planId === preferredPlanId);

  return (preferred ?? backfilled[0]).subAccountAmountDisplay;
}

/** 格式化最近活跃的相对时间文案。 */
export function formatMemberRelativeTime(timestamp: number): string {
  const diff = Date.now() - safeNum(timestamp);
  const dayMs = 86_400_000;
  if (diff < dayMs) return '今天';
  if (diff < 2 * dayMs) return '昨天';
  if (diff < 7 * dayMs) return `${Math.floor(diff / dayMs)} 天前`;
  if (diff < 30 * dayMs) return `${Math.floor(diff / (7 * dayMs))} 周前`;
  if (diff < 365 * dayMs) return `${Math.floor(diff / (30 * dayMs))} 个月前`;
  return `${Math.floor(diff / (365 * dayMs))} 年前`;
}
