// 会员详情弹窗层：按当前激活的弹窗惰性挂载对应组件，业务数据与提交动作由页面注入。
import React, { Suspense, lazy } from 'react';
import type { MemberDetail, MemberLevel } from '@pages/memberList/memberList.types';
import type {
  MemberLockedPrice,
  MemberRenewalPrice,
  MemberRenewalPriceUpdateItem,
} from '@pages/memberList/memberList.pricing.types';
import type {
  MembershipConfirmOptions,
  SetMembershipModalProps,
} from '../SetMembershipModal/SetMembershipModal.types';
import type { UseMemberDetailModalsReturn } from '../../../hooks/useMemberDetailModals';

const AdjustBeanModal = lazy(() => import('../AdjustBeanModal/AdjustBeanModal'));
const AdjustPointsModal = lazy(() => import('../AdjustPointsModal/AdjustPointsModal'));
const MemberDetailStatusModal = lazy(() => import('../MemberDetailStatusModal/MemberDetailStatusModal'));
// 设置会员等级弹窗的 props 契约较宽且在 SSR 分包边界上丢失推断，这里手动固定成对外类型
const SetMembershipModal = lazy(async () => {
  const module = await import('../SetMembershipModal/SetMembershipModal');
  return { default: module.default as React.ComponentType<SetMembershipModalProps> };
});
const SetSubAccountModal = lazy(() => import('../SetSubAccountModal/SetSubAccountModal'));
const RenewalPriceModal = lazy(() => import('../RenewalPriceModal/RenewalPriceModal'));
const SubAccountDetailModal = lazy(() => import('../SubAccountDetailModal/SubAccountDetailModal'));
const MemberDetailClubStatsModal = lazy(() => import('../MemberDetailClubStatsModal/MemberDetailClubStatsModal'));
const MemberDetailSalesStatsModal = lazy(() => import('../MemberDetailSalesStatsModal/MemberDetailSalesStatsModal'));
const CancelAccountModal = lazy(() => import('../CancelAccountModal/CancelAccountModal'));

interface MemberDetailModalsProps {
  /** 当前会员详情（非空：弹窗只在详情就绪后挂载）。 */
  member: MemberDetail;
  /** 当前积分。 */
  points: number;
  /** 当前纯利豆。 */
  beans: number;
  /** 当前会员等级。 */
  memberLevel: MemberLevel;
  /** 会员到期时间戳，作为设置等级弹窗的当前到期时间。 */
  membershipExpiry: number | null | undefined;
  /** 永久会员当前有效天数配置。 */
  lifetimeMembershipDays: number;
  /** 永久会员当前价格展示值（后端直接返回，前端不再分转元）。 */
  lifetimeMembershipAmountDisplay: string;
  /** 年度会员当前价格展示值（后端直接返回，前端不再分转元）。 */
  annualMembershipAmountDisplay: string;
  /** 是否正在提交封禁或解封。 */
  isSubmittingBan: boolean;
  /** 是否正在提交子账号配额设置。 */
  isSubmittingSubAccount: boolean;
  /** 是否正在重置成交价快照。 */
  isResettingLockedPrice: boolean;
  /** 是否正在补录子账号加价。 */
  isBackfillingSubAccount: boolean;
  /** 是否正在提交续费价调整。 */
  isSubmittingRenewalPrice: boolean;
  /** 是否正在提交注销账号。 */
  isSubmittingCancel: boolean;
  /** 弹窗开关与确认流程的状态机。 */
  modals: UseMemberDetailModalsReturn;
  /** 调整积分并提交。 */
  handleAdjustPoints: (delta: number, reason: string) => Promise<void>;
  /** 调整纯利豆并提交。 */
  handleAdjustBeans: (delta: number, reason: string) => Promise<void>;
  /** 设置会员等级并提交。 */
  handleSetMembership: (
    newLevel: MemberLevel,
    newExpiry: number | null,
    options?: MembershipConfirmOptions,
  ) => Promise<void>;
  /** 设置子账号配额并提交（平台侧）。角色分配由商家在 purelyProfit 端操作。 */
  handleSetSubAccountQuota: (quota: number) => Promise<boolean>;
  /** 重置成交价快照，让下一次成交重新记录。 */
  handleResetLockedPrice: () => Promise<boolean>;
  /** 补录 / 撤销某档位的子账号加价。 */
  handleBackfillSubAccountAmount: (
    planId: string,
    payload: { subAccountCount?: number; subAccountAmountDisplay: string },
  ) => Promise<boolean>;
  /** 调整该会员的续费价覆盖。 */
  handleUpdateRenewalPrices: (
    items: MemberRenewalPriceUpdateItem[],
  ) => Promise<MemberRenewalPrice[] | null>;
}

const MemberDetailModals: React.FC<MemberDetailModalsProps> = ({
  member,
  points,
  beans,
  memberLevel,
  membershipExpiry,
  lifetimeMembershipDays,
  lifetimeMembershipAmountDisplay,
  annualMembershipAmountDisplay,
  isSubmittingBan,
  isSubmittingSubAccount,
  isResettingLockedPrice,
  isBackfillingSubAccount,
  isSubmittingRenewalPrice,
  isSubmittingCancel,
  modals: {
    activeModal,
    banReason,
    handleBanReasonChange,
    handleCloseModal,
    handleCloseStatusModal,
    handleStatusConfirm,
    handleCancelAccountConfirm,
    handleOpenSubAccountModal,
  },
  handleAdjustPoints,
  handleAdjustBeans,
  handleSetMembership,
  handleSetSubAccountQuota,
  handleResetLockedPrice,
  handleBackfillSubAccountAmount,
  handleUpdateRenewalPrices,
}) => (
  <Suspense fallback={null}>
    {/* 调整积分弹窗 */}
    {activeModal === 'points' ? (
      <AdjustPointsModal
        member={member}
        currentPoints={points}
        onClose={handleCloseModal}
        onConfirm={handleAdjustPoints}
      />
    ) : null}

    {/* 调整纯利豆弹窗 */}
    {activeModal === 'beans' ? (
      <AdjustBeanModal
        member={member}
        currentBeans={beans}
        onClose={handleCloseModal}
        onConfirm={handleAdjustBeans}
      />
    ) : null}

    {/* 设置会员等级弹窗 */}
    {activeModal === 'membership' ? (
      <SetMembershipModal
        member={member}
        memberId={member.id}
        currentLevel={memberLevel}
        currentExpiry={membershipExpiry}
        lifetimeMembershipDays={lifetimeMembershipDays}
        lifetimeMembershipAmountDisplay={lifetimeMembershipAmountDisplay}
        annualMembershipAmountDisplay={annualMembershipAmountDisplay}
        onClose={handleCloseModal}
        onConfirm={handleSetMembership}
      />
    ) : null}

    {/* 调整续费价格弹窗：只改该账号以后的续费价，不动本次成交 */}
    {activeModal === 'renewalPrice' ? (
      <RenewalPriceModal
        memberId={member.id}
        memberName={member.name}
        currentLevel={memberLevel}
        isSubmitting={isSubmittingRenewalPrice}
        onClose={handleCloseModal}
        onSubmit={handleUpdateRenewalPrices}
      />
    ) : null}

    {/* 封禁 / 解封确认弹窗 */}
    {activeModal === 'status' ? (
      <MemberDetailStatusModal
        isBannedMember={member.status === 'banned'}
        isSubmittingBan={isSubmittingBan}
        banReason={banReason}
        onBanReasonChange={handleBanReasonChange}
        onClose={handleCloseStatusModal}
        onConfirm={handleStatusConfirm}
      />
    ) : null}

    {/* 子账号详情弹窗：查看 purelyProfit 端的角色分配快照 */}
    {activeModal === 'subAccountDetail' ? (
      <SubAccountDetailModal
        capability={member.subAccountCapability}
        onClose={handleCloseModal}
        onEditQuota={handleOpenSubAccountModal}
      />
    ) : null}

    {/* 子账号配置弹窗（平台侧，年/永久会员专属；角色分配由商家在 purelyProfit 端操作） */}
    {activeModal === 'subAccount' ? (
      <SetSubAccountModal
        member={member}
        currentLevel={memberLevel}
        currentCapability={member.subAccountCapability}
        isSubmitting={isSubmittingSubAccount}
        isResettingLockedPrice={isResettingLockedPrice}
        onResetLockedPrice={async () => {
          await handleResetLockedPrice();
        }}
        isBackfillingSubAccount={isBackfillingSubAccount}
        onBackfillSubAccountAmount={async (item: MemberLockedPrice, payload) =>
          handleBackfillSubAccountAmount(item.planId, payload)
        }
        onClose={handleCloseModal}
        onConfirm={async (quota) => {
          const didSucceed = await handleSetSubAccountQuota(quota);
          if (didSucceed) {
            handleCloseModal();
          }
        }}
      />
    ) : null}

    {/* 会员运营情况弹窗：查看该商家在 purelyClub C 端的储值与等级分布 */}
    {activeModal === 'clubStats' ? (
      <MemberDetailClubStatsModal
        memberId={member.id}
        memberName={member.name}
        onClose={handleCloseModal}
      />
    ) : null}

    {/* 营业详情弹窗：查看该商家今日/本周/本月/今年/去年的销售额与利润柱状图 */}
    {activeModal === 'salesStats' ? (
      <MemberDetailSalesStatsModal
        memberId={member.id}
        memberName={member.name}
        onClose={handleCloseModal}
      />
    ) : null}

    {/* 注销账号弹窗：二次确认不可逆的账号注销操作 */}
    {activeModal === 'cancelAccount' ? (
      <CancelAccountModal
        memberName={member.name}
        memberPhone={member.phone}
        isSubmitting={isSubmittingCancel}
        onClose={handleCloseModal}
        onConfirm={handleCancelAccountConfirm}
      />
    ) : null}
  </Suspense>
);

export default MemberDetailModals;
