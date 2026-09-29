// 会员模块写操作：积分 / 纯利豆调整、等级设置、锁价与续费价、封禁注销、子账号配额。
import { createKeyedInFlightRequest, http } from '@utils/http';
import { safeNum } from '@utils/utils';
import {
  ADJUST_MEMBER_POINTS_API_PATH,
  ADJUST_PARTNER_BEANS_API_PATH,
  BACKFILL_SUB_ACCOUNT_AMOUNT_API_PATH,
  MEMBER_BAN_API_PATH,
  MEMBER_CANCEL_API_PATH,
  MEMBER_RENEWAL_PRICE_API_PATH,
  MEMBER_UNBAN_API_PATH,
  PREVIEW_MEMBERSHIP_PRICE_API_PATH,
  RESET_MEMBER_LOCKED_PRICE_API_PATH,
  SET_MEMBERSHIP_API_PATH,
  SET_SUB_ACCOUNT_QUOTA_API_PATH,
  resolveMemberActionPath,
} from './memberList.apiPaths';
import { MEMBERSHIP_REVENUE_CONFIG } from './memberList.constants';
import { toMemberPricingPreview, toMemberRenewalPriceList } from './memberList.price.mapper';
import { emitMembershipRevenueSync } from './memberList.sync';
import type { MemberLevel, MemberStatus } from './memberList.types';
import type { MemberPricingPreview, MemberRenewalPrice, MemberRenewalPriceUpdateItem } from './memberList.pricing.types';

/** 调整类请求体：多种 id 字段与方向一并下发，兼容不同后端版本。 */
const buildAdjustPayload = (memberId: string, delta: number, reason: string): Record<string, unknown> => ({
  memberId,
  userId: memberId,
  id: memberId,
  delta,
  amount: safeNum(Math.abs(delta)),
  direction: delta >= 0 ? 'add' : 'subtract',
  reason,
});

/** 状态变更请求体：status 与 memberStatus 双写下發。 */
const buildMemberStatusPayload = (
  memberId: string,
  nextStatus: MemberStatus,
  reason?: string,
): Record<string, unknown> => ({
  memberId,
  userId: memberId,
  id: memberId,
  status: nextStatus,
  memberStatus: nextStatus,
  reason,
  remark: reason,
});

/** 封禁 / 解封共用提交：仅提示文案随目标状态变化。 */
const submitMemberStatusRequest = async (
  rawPath: string,
  memberId: string,
  nextStatus: MemberStatus,
  reason?: string,
): Promise<void> => {
  const requestTarget = resolveMemberActionPath(rawPath, memberId);
  await http.post<unknown, Record<string, unknown>>(requestTarget.url, buildMemberStatusPayload(memberId, nextStatus, reason), {
    params: requestTarget.params,
    skipGlobalErrorHandler: true,
    errorMessage: nextStatus === 'banned' ? '封禁会员失败，请稍后重试' : '解封会员失败，请稍后重试',
  });
};

/** 提交会员积分调整。 */
export const submitMemberPointsAdjustment = async (memberId: string, delta: number, reason: string): Promise<void> => {
  const requestTarget = resolveMemberActionPath(ADJUST_MEMBER_POINTS_API_PATH, memberId);
  await http.post<unknown, Record<string, unknown>>(requestTarget.url, buildAdjustPayload(memberId, delta, reason), {
    params: requestTarget.params,
    skipGlobalErrorHandler: true,
    errorMessage: '积分调整失败，请稍后重试',
  });
};

/** 提交会员纯利豆调整。 */
export const submitMemberBeansAdjustment = async (memberId: string, delta: number, reason: string): Promise<void> => {
  const requestTarget = resolveMemberActionPath(ADJUST_PARTNER_BEANS_API_PATH, memberId);
  await http.post<unknown, Record<string, unknown>>(requestTarget.url, buildAdjustPayload(memberId, delta, reason), {
    params: requestTarget.params,
    skipGlobalErrorHandler: true,
    errorMessage: '纯利豆调整失败，请稍后重试',
  });
};

/** 提交会员等级设置，成功后广播本次成交产生的收入。 */
export const submitMemberMembership = async (
  memberId: string,
  level: MemberLevel,
  membershipExpiry: number | null,
  options?: {
    memberName?: string;
    amountDisplay?: string;
    subAccountCount?: number;
    subAccountAmountDisplay?: string;
    confirmDowngradePlan?: boolean;
    countAsIncome?: boolean;
    /** 期数：后端据此按「每期额度 × 期数」赠送新客额度（年度 × 2 = 600 位） */
    multiplier?: number;
  },
): Promise<void> => {
  const requestTarget = resolveMemberActionPath(SET_MEMBERSHIP_API_PATH, memberId);
  const isNonExpiringLevel = level === 'free';

  if (!isNonExpiringLevel && (membershipExpiry === null || !Number.isFinite(membershipExpiry))) {
    throw new Error('缺少有效的会员到期时间');
  }

  const payload: Record<string, unknown> = {
    level,
  };

  if (isNonExpiringLevel) {
    payload.membershipExpiry = null;
    // 弹窗已提供两步显式确认，降级为免费会员需向后端传确认标记，否则后端返回 400
    payload.confirmDowngradeToFree = true;
  } else {
    payload.membershipExpiry = membershipExpiry;
    // 本次成交价：管理端设置视为一次显式成交，后端会覆盖该档位的成交价快照
    const priceDisplay = options?.amountDisplay?.trim();
    if (priceDisplay) {
      payload.priceDisplay = priceDisplay;
    }

    // 子账号：拆出加价供续费定价使用（标准总价 = 当前配置价 + 子账号加价）
    const trimmedSubAccountAmount = options?.subAccountAmountDisplay?.trim();
    if (trimmedSubAccountAmount) {
      payload.subAccountAmountDisplay = trimmedSubAccountAmount;
    }
    if (typeof options?.subAccountCount === 'number') {
      payload.subAccountCount = safeNum(options.subAccountCount);
    }

    // 所选档位低于当前档位时，默认后端会保持原档位、只追加时长；
    // 只有这里显式确认才真的降档
    if (options?.confirmDowngradePlan === true) {
      payload.confirmDowngradePlan = true;
    }

    // 是否计入收入：false 也要显式下发，后端据此按赠送处理（默认即赠送）
    if (typeof options?.countAsIncome === 'boolean') {
      payload.countAsIncome = options.countAsIncome;
    }

    // 期数：新客额度按它叠加（年度 × 2 = 600 位）；未传后端按 1 期处理，
    // 兼容旧版本弹窗与直接调用
    const multiplier = safeNum(options?.multiplier);
    if (typeof options?.multiplier === 'number' && Number.isInteger(multiplier) && multiplier > 0) {
      payload.multiplier = multiplier;
    }
  }

  await http.post<unknown, Record<string, unknown>>(requestTarget.url, payload, {
    params: requestTarget.params,
    skipGlobalErrorHandler: true,
    errorMessage: '会员等级设置失败，请稍后重试',
  });

  if (level !== 'free') {
    const config = MEMBERSHIP_REVENUE_CONFIG[level];
    // 年度会员 / 永久会员支持在弹窗内自定义价格，其余档位按固定配置价计入
    const supportsCustomAmountDisplay = level === 'annual' || level === 'lifetime';
    const customAmountDisplay = options?.amountDisplay?.trim();

    emitMembershipRevenueSync({
      memberId,
      memberName: options?.memberName?.trim() || `会员${memberId}`,
      level,
      amountDisplay: supportsCustomAmountDisplay && customAmountDisplay
        ? customAmountDisplay
        : config.amountDisplay,
      planName: config.planName,
      revenueTypeLabel: config.revenueTypeLabel,
      createdAt: Date.now(),
    });
  }
};

/**
 * 重置会员「首购锁定价」。
 *
 * 重置后该门店所有档位的锁定价被清除，下一次成交（商家端下单 / 设置会员等级）
 * 会重新锁定价格；关闭子账号能力时后端也会自动重置。
 */
export const resetMemberLockedPrice = async (memberId: string): Promise<void> => {
  const requestTarget = resolveMemberActionPath(RESET_MEMBER_LOCKED_PRICE_API_PATH, memberId);
  await http.post<unknown, Record<string, unknown>>(requestTarget.url, { memberId }, {
    params: requestTarget.params,
    skipGlobalErrorHandler: true,
    errorMessage: '重置锁定价失败，请稍后重试',
  });
};

/**
 * 拉取会员成交价预览。
 *
 * 只算不落库：弹窗里运营每改一次输入就要看到新的「下次续费价 / 当期应补」，
 * 但约定是前端不做金额计算，所以这两个数字由后端算好并以展示字符串下发，
 * 前端原样渲染即可。
 *
 * 同参数进行中请求合并：详情页 StrictMode 下 effect 双挂载会连发两次相同预览，
 * 组件的 cancelled 标志拦不住已发出的网络请求，这里按「memberId + 预览参数」
 * 复用同一个进行中的 Promise，请求落定即清除，不影响参数变化触发的新预览。
 */
export const fetchMembershipPricingPreview = createKeyedInFlightRequest(
  (memberId: string, params: {
    level?: MemberLevel;
    priceDisplay?: string;
    subAccountCount?: number;
    subAccountAmountDisplay?: string;
  }) => JSON.stringify([memberId, params.level ?? null, params.priceDisplay ?? null,
    params.subAccountCount ?? null, params.subAccountAmountDisplay ?? null]),
  async (
    memberId: string,
    params: {
      level?: MemberLevel;
      priceDisplay?: string;
      subAccountCount?: number;
      subAccountAmountDisplay?: string;
    },
  ): Promise<MemberPricingPreview> => {
    const requestTarget = resolveMemberActionPath(PREVIEW_MEMBERSHIP_PRICE_API_PATH, memberId);

    const response = await http.post<unknown, Record<string, unknown>>(
      requestTarget.url,
      {
        memberId,
        level: params.level,
        priceDisplay: params.priceDisplay,
        subAccountCount: params.subAccountCount,
        subAccountAmountDisplay: params.subAccountAmountDisplay,
      },
      {
        params: requestTarget.params,
        // 预览是「输入驱动的非破坏性请求」，失败时保留上一次结果即可，不必弹全局错误
        skipGlobalErrorHandler: true,
      },
    );

    return toMemberPricingPreview(response);
  },
);

/**
 * 补录 / 撤销存量门店的子账号加价。
 *
 * 只更新成交价快照里的子账号字段，不改写成交总额——补录是把当初没拆出来的
 * 那部分补上，而不是重新议价。不传 `subAccountAmountDisplay` 即撤销补录。
 */
export const backfillMemberSubAccountAmount = async (
  memberId: string,
  planId: string,
  payload: { subAccountAmountDisplay?: string; subAccountCount?: number },
): Promise<void> => {
  const requestTarget = resolveMemberActionPath(
    BACKFILL_SUB_ACCOUNT_AMOUNT_API_PATH,
    memberId,
  );

  await http.patch<unknown, Record<string, unknown>>(
    requestTarget.url,
    {
      memberId,
      planId,
      ...(payload.subAccountAmountDisplay !== undefined
        ? { subAccountAmountDisplay: payload.subAccountAmountDisplay }
        : {}),
      ...(payload.subAccountCount !== undefined
        ? { subAccountCount: payload.subAccountCount }
        : {}),
    },
    {
      params: requestTarget.params,
      skipGlobalErrorHandler: true,
      errorMessage: '补录子账号加价失败，请稍后重试',
    },
  );
};

/**
 * 拉取该会员各档位的续费价现状。
 *
 * 打开「调整续费价格」弹窗时调用：读的是已落库的覆盖价，
 * 不是一个临时成交价，因此运营看到的就是门店端此刻真实的续费价。
 */
export const fetchMemberRenewalPrices = createKeyedInFlightRequest(
  (memberId: string) => `member-renewal-price:${memberId}`,
  async (memberId: string): Promise<MemberRenewalPrice[]> => {
    const requestTarget = resolveMemberActionPath(
      MEMBER_RENEWAL_PRICE_API_PATH,
      memberId,
    );

    const response = await http.get<unknown>(requestTarget.url, {
      params: requestTarget.params,
      skipGlobalErrorHandler: true,
      errorMessage: '获取续费价格失败',
    });

    return toMemberRenewalPriceList(response);
  },
);

/**
 * 提交续费价调整。
 *
 * 只提交运营改过的档位，未提交的档位保持原样；
 * `priceDisplay` 传空串即清除该档位覆盖、恢复配置价。
 * 返回后端算好的最新列表，调用方直接渲染即可，无需再拉一次。
 */
export const submitMemberRenewalPrices = async (
  memberId: string,
  items: MemberRenewalPriceUpdateItem[],
): Promise<MemberRenewalPrice[]> => {
  const requestTarget = resolveMemberActionPath(
    MEMBER_RENEWAL_PRICE_API_PATH,
    memberId,
  );

  const response = await http.patch<unknown, Record<string, unknown>>(
    requestTarget.url,
    { memberId, items },
    {
      params: requestTarget.params,
      skipGlobalErrorHandler: true,
      errorMessage: '调整续费价格失败，请稍后重试',
    },
  );

  return toMemberRenewalPriceList(response);
};

/** 提交会员封禁。 */
export const submitMemberBan = async (memberId: string, reason: string): Promise<void> => {
  await submitMemberStatusRequest(MEMBER_BAN_API_PATH, memberId, 'banned', reason);
};

/** 提交会员解封。 */
export const submitMemberUnban = async (memberId: string): Promise<void> => {
  await submitMemberStatusRequest(MEMBER_UNBAN_API_PATH, memberId, 'active');
};

/** 提交注销会员账号（不可逆，注销后视同未注册）。 */
export const submitMemberCancelAccount = async (memberId: string): Promise<void> => {
  const requestTarget = resolveMemberActionPath(MEMBER_CANCEL_API_PATH, memberId);
  await http.post<unknown, Record<string, unknown>>(requestTarget.url, { memberId, userId: memberId, id: memberId }, {
    params: requestTarget.params,
    skipGlobalErrorHandler: true,
    errorMessage: '注销账号失败，请稍后重试',
  });
};

/** 提交子账号配额设置（平台侧，仅允许年/永久会员商家）。角色分配由商家在 purelyProfit 端操作。 */
export const submitSubAccountQuota = async (
  memberId: string,
  quota: number,
): Promise<void> => {
  const requestTarget = resolveMemberActionPath(SET_SUB_ACCOUNT_QUOTA_API_PATH, memberId);
  await http.post<unknown, Record<string, unknown>>(
    requestTarget.url,
    { memberId, quota: safeNum(quota), subAccountQuota: safeNum(quota) },
    {
      params: requestTarget.params,
      skipGlobalErrorHandler: true,
      errorMessage: '子账号配额设置失败，请稍后重试',
    },
  );
};
