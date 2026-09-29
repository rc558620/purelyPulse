// 会员详情页 Hook：编排详情请求、套餐配置与提交动作，对外暴露页面所需的统一状态。
import { useMemberDetailActions } from './hooks/useMemberDetailActions';
import { useMemberDetailMembershipSettings } from './hooks/useMemberDetailMembershipSettings';
import { useMemberDetailRequest } from './hooks/useMemberDetailRequest';
import type { MemberDetail, MemberLevel } from '../memberList/memberList.types';
import type { MemberRenewalPrice, MemberRenewalPriceUpdateItem } from '../memberList/memberList.pricing.types';

interface UseMemberDetailPageReturn {
  /** 当前会员详情。 */
  member: MemberDetail | null;
  /** 是否为首屏加载中。 */
  isLoading: boolean;
  /** 是否是接口未返回详情。 */
  isNotFound: boolean;
  /** 当前错误文案。 */
  errorMessage: string;
  /** 当前积分。 */
  points: number;
  /** 当前纯利豆。 */
  beans: number;
  /** 当前会员等级。 */
  memberLevel: MemberLevel;
  /** 当前会员到期时间。 */
  memberExpiry: number | null | undefined;
  /** 永久会员当前有效天数配置。 */
  lifetimeMembershipDays: number;
  /** 永久会员当前价格展示值（后端直接返回，前端不再分转元）。 */
  lifetimeMembershipAmountDisplay: string;
  /** 年度会员当前价格展示值（后端直接返回，前端不再分转元）。 */
  annualMembershipAmountDisplay: string;
  /** 是否正在提交积分调整。 */
  isSubmittingPoints: boolean;
  /** 是否正在提交纯利豆调整。 */
  isSubmittingBeans: boolean;
  /** 是否正在提交会员等级设置。 */
  isSubmittingMembership: boolean;
  /** 是否正在提交封禁或解封。 */
  isSubmittingBan: boolean;
  /** 是否正在提交子账号配额设置。 */
  isSubmittingSubAccount: boolean;
  /** 是否正在提交注销账号。 */
  isSubmittingCancel: boolean;
  /** 是否正在重置成交价快照。 */
  isResettingLockedPrice: boolean;
  /** 是否正在补录子账号加价。 */
  isBackfillingSubAccount: boolean;
  /** 是否正在提交续费价调整。 */
  isSubmittingRenewalPrice: boolean;
  /** 是否有任一提交动作进行中。 */
  isSubmittingAction: boolean;
  /** 调整积分并提交。 */
  handleAdjustPoints: (delta: number, reason: string) => Promise<void>;
  /** 调整纯利豆并提交。 */
  handleAdjustBeans: (delta: number, reason: string) => Promise<void>;
  /** 设置会员等级并提交。 */
  handleSetMembership: (
    newLevel: MemberLevel,
    newExpiry: number | null,
    options?: {
      amountDisplay?: string;
      subAccountCount?: number;
      subAccountAmountDisplay?: string;
      confirmDowngradePlan?: boolean;
      countAsIncome?: boolean;
    },
  ) => Promise<void>;
  /** 封禁当前会员。 */
  handleBanMember: (reason: string) => Promise<boolean>;
  /** 解封当前会员。 */
  handleUnbanMember: () => Promise<boolean>;
  /** 设置子账号配额并提交（平台侧）。角色分配由商家在 purelyProfit 端操作。 */
  handleSetSubAccountQuota: (quota: number) => Promise<boolean>;
  /** 注销当前会员账号（不可逆）。 */
  handleCancelAccount: () => Promise<boolean>;
  /** 重置成交价快照，让下一次成交重新记录。 */
  handleResetLockedPrice: () => Promise<boolean>;
  /**
   * 补录 / 撤销某档位的子账号加价。
   *
   * 只提交子账号数量与加价，不改写成交总额；金额传空串即撤销补录。
   */
  handleBackfillSubAccountAmount: (
    planId: string,
    payload: { subAccountCount?: number; subAccountAmountDisplay: string },
  ) => Promise<boolean>;
  /**
   * 调整该会员的续费价覆盖。
   *
   * 成功返回后端算好的最新档位列表（弹窗就地刷新），失败返回 null。
   */
  handleUpdateRenewalPrices: (
    items: MemberRenewalPriceUpdateItem[],
  ) => Promise<MemberRenewalPrice[] | null>;
  /** 重试拉取详情。 */
  retryLoadMember: () => void;
}

/** 会员详情页数据 Hook。 */
export const useMemberDetailPage = (memberId: string | undefined): UseMemberDetailPageReturn => {
  const {
    member,
    isLoading,
    isNotFound,
    errorMessage,
    loadMember,
    patchMember,
    retryLoadMember,
  } = useMemberDetailRequest(memberId);

  const {
    lifetimeMembershipDays,
    lifetimeMembershipAmountDisplay,
    annualMembershipAmountDisplay,
  } = useMemberDetailMembershipSettings();

  const {
    isSubmittingPoints,
    isSubmittingBeans,
    isSubmittingMembership,
    isSubmittingBan,
    isSubmittingSubAccount,
    isSubmittingCancel,
    isResettingLockedPrice,
    isBackfillingSubAccount,
    isSubmittingRenewalPrice,
    isSubmittingAction,
    handleAdjustPoints,
    handleAdjustBeans,
    handleSetMembership,
    handleBanMember,
    handleUnbanMember,
    handleSetSubAccountQuota,
    handleCancelAccount,
    handleResetLockedPrice,
    handleBackfillSubAccountAmount,
    handleUpdateRenewalPrices,
  } = useMemberDetailActions({ member, loadMember, patchMember });

  // 从 member 直接派生展示态，避免 useEffect 同步 setState 产生的级联渲染
  const points = member?.availablePoints ?? 0;
  const beans = member?.beanBalance ?? 0;
  const memberLevel: MemberLevel = member?.level ?? 'free';
  const memberExpiry: number | null | undefined = member ? member.membershipExpiry : undefined;

  return {
    member,
    isLoading,
    isNotFound,
    errorMessage,
    points,
    beans,
    memberLevel,
    memberExpiry,
    lifetimeMembershipDays,
    lifetimeMembershipAmountDisplay,
    annualMembershipAmountDisplay,
    isSubmittingPoints,
    isSubmittingBeans,
    isSubmittingMembership,
    isSubmittingBan,
    isSubmittingSubAccount,
    isSubmittingCancel,
    isResettingLockedPrice,
    isBackfillingSubAccount,
    isSubmittingRenewalPrice,
    isSubmittingAction,
    handleAdjustPoints,
    handleAdjustBeans,
    handleSetMembership,
    handleBanMember,
    handleUnbanMember,
    handleSetSubAccountQuota,
    handleCancelAccount,
    handleResetLockedPrice,
    handleBackfillSubAccountAmount,
    handleUpdateRenewalPrices,
    retryLoadMember,
  };
};
