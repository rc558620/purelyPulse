// 会员详情页主体组件：状态编排 + 事件处理 + 子组件组合。
import React, { Suspense, lazy, useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageHeader from '@components/ui/layout/PageHeader';
import type { SetMembershipModalProps } from './components/modals/SetMembershipModal/SetMembershipModal';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import MemberDetailHeroSection from './components/sections/MemberDetailHeroSection/MemberDetailHeroSection';
import MemberDetailMetricsGrid from './components/sections/MemberDetailMetricsGrid/MemberDetailMetricsGrid';
import MemberDetailPageState from './components/pageState/MemberDetailPageState/MemberDetailPageState';
import MemberDetailRechargePanel from './components/sections/MemberDetailRechargePanel/MemberDetailRechargePanel';
import MemberDetailRemarkCard from './components/sections/MemberDetailRemarkCard/MemberDetailRemarkCard';
import {
  formatMemberDate,
  resolveSubAccountAddOnPriceDisplay,
  resolveSubAccountBackfillState,
} from '../../memberDetail.utils';
import { useMemberDetailPage } from '../../useMemberDetailPage';
import styles from '../../memberDetail.module.less';

const AdjustBeanModal = lazy(() => import('./components/modals/AdjustBeanModal/AdjustBeanModal'));
const AdjustPointsModal = lazy(() => import('./components/modals/AdjustPointsModal/AdjustPointsModal'));
const MemberDetailStatusModal = lazy(() => import('./components/modals/MemberDetailStatusModal/MemberDetailStatusModal'));
const SetMembershipModal = lazy(async () => {
  const module = await import('./components/modals/SetMembershipModal/SetMembershipModal');
  return { default: module.default as React.ComponentType<SetMembershipModalProps> };
});
const SetSubAccountModal = lazy(() => import('./components/modals/SetSubAccountModal/SetSubAccountModal'));
const RenewalPriceModal = lazy(() => import('./components/modals/RenewalPriceModal/RenewalPriceModal'));
const SubAccountDetailModal = lazy(() => import('./components/modals/SubAccountDetailModal/SubAccountDetailModal'));
const MemberDetailClubStatsModal = lazy(() => import('./components/modals/MemberDetailClubStatsModal/MemberDetailClubStatsModal'));
const MemberDetailSalesStatsModal = lazy(() => import('./components/modals/MemberDetailSalesStatsModal/MemberDetailSalesStatsModal'));
const CancelAccountModal = lazy(() => import('./components/modals/CancelAccountModal/CancelAccountModal'));

type ActiveModal = 'points' | 'beans' | 'membership' | 'renewalPrice' | 'status' | 'subAccount' | 'subAccountDetail' | 'clubStats' | 'salesStats' | 'cancelAccount' | null;

const DAY_MS = 86_400_000;

const MemberDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useAnimatedNavigate();
  const {
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
    isSubmittingRenewalPrice,
    handleUpdateRenewalPrices,
    retryLoadMember,
  } = useMemberDetailPage(id);

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [banReason, setBanReason] = useState<string>('');

  const displayMemberExpiry = useMemo(() => {
    if (memberLevel !== 'lifetime' || memberExpiry || !member) {
      return memberExpiry;
    }

    const latestRechargeAt = member.rechargeHistory.reduce<number | null>((latest, record) => {
      if (!Number.isFinite(record.createdAt)) {
        return latest;
      }
      return latest === null ? record.createdAt : Math.max(latest, record.createdAt);
    }, null);

    const inferredStartAt = latestRechargeAt ?? member.registeredAt;
    return Number.isFinite(inferredStartAt) ? inferredStartAt + lifetimeMembershipDays * DAY_MS : null;
  }, [lifetimeMembershipDays, member, memberExpiry, memberLevel]);

  const membershipExpiryText =
    memberLevel === 'free' ? null :
    displayMemberExpiry ? `${formatMemberDate(displayMemberExpiry)} 到期` :
    memberLevel === 'lifetime' ? '永久有效' : null;

  // 子账号加价补录状态：会员级（不是某条记录的历史快照），
  // 子账号设置记录每行都用徽章区分「待补录 / 已补录」
  const subAccountBackfillState = useMemo(
    () => resolveSubAccountBackfillState(memberLevel, member?.lockedPrices),
    [member, memberLevel],
  );

  // 已补录的子账号加价：子账号记录行展示成「10 个 = ¥1000」，
  // 未补录时为 null，行内退回只展示额度
  const subAccountAddOnPriceDisplay = useMemo(
    () => resolveSubAccountAddOnPriceDisplay(memberLevel, member?.lockedPrices),
    [member, memberLevel],
  );

  const isBannedMember = member?.status === 'banned';
  const isPointsModalOpen = activeModal === 'points';
  const isBeanModalOpen = activeModal === 'beans';
  const isMembershipModalOpen = activeModal === 'membership';
  const isRenewalPriceModalOpen = activeModal === 'renewalPrice';
  const isStatusModalOpen = activeModal === 'status';
  const isSubAccountModalOpen = activeModal === 'subAccount';
  const isSubAccountDetailModalOpen = activeModal === 'subAccountDetail';
  const isClubStatsModalOpen = activeModal === 'clubStats';
  const isSalesStatsModalOpen = activeModal === 'salesStats';
  const isCancelAccountModalOpen = activeModal === 'cancelAccount';

  const handleBack = useCallback((): void => {
    navigate(-1);
  }, [navigate]);

  const handleOpenPointsModal = useCallback((): void => {
    setActiveModal('points');
  }, []);

  const handleOpenBeanModal = useCallback((): void => {
    setActiveModal('beans');
  }, []);

  const handleOpenMembershipModal = useCallback((): void => {
    setActiveModal('membership');
  }, []);

  const handleOpenRenewalPriceModal = useCallback((): void => {
    setActiveModal('renewalPrice');
  }, []);

  const handleCloseModal = useCallback((): void => {
    setActiveModal(null);
  }, []);

  const handleOpenStatusModal = useCallback((): void => {
    setBanReason('');
    setActiveModal('status');
  }, []);

  const handleOpenSubAccountModal = useCallback((): void => {
    setActiveModal('subAccount');
  }, []);

  const handleOpenSubAccountDetailModal = useCallback((): void => {
    setActiveModal('subAccountDetail');
  }, []);

  const handleOpenClubStatsModal = useCallback((): void => {
    setActiveModal('clubStats');
  }, []);

  const handleOpenSalesStatsModal = useCallback((): void => {
    setActiveModal('salesStats');
  }, []);

  const handleOpenCancelAccountModal = useCallback((): void => {
    setActiveModal('cancelAccount');
  }, []);

  const handleCancelAccountConfirm = useCallback(async (): Promise<void> => {
    const didCancel = await handleCancelAccount();
    if (didCancel) {
      setActiveModal(null);
    }
  }, [handleCancelAccount]);

  const handleCloseStatusModal = useCallback((): void => {
    if (isSubmittingBan) {
      return;
    }

    setActiveModal(null);
    setBanReason('');
  }, [isSubmittingBan]);

  const handleStatusConfirm = useCallback(async (): Promise<void> => {
    if (isBannedMember) {
      const didUnban = await handleUnbanMember();
      if (didUnban) {
        setActiveModal(null);
      }
      return;
    }

    const didBan = await handleBanMember(banReason);
    if (didBan) {
      setActiveModal(null);
    }
  }, [banReason, handleBanMember, handleUnbanMember, isBannedMember]);

  if (isLoading) {
    return <MemberDetailPageState message="会员详情加载中..." onBack={handleBack} />;
  }

  if (errorMessage) {
    return (
      <MemberDetailPageState
        message={errorMessage}
        onBack={handleBack}
        onRetry={retryLoadMember}
      />
    );
  }

  if (isNotFound || !member) {
    return <MemberDetailPageState message="找不到该会员信息" onBack={handleBack} />;
  }

  return (
    <div className={styles.pageContainer}>

      {/* 页面顶部导航 */}
      <PageHeader title="会员详情" onBack={handleBack} />

      <main className={styles.contentWrapper}>
        {/* 会员身份横幅：头像、等级、状态、操作按钮 */}
        <MemberDetailHeroSection
          member={member}
          memberLevel={memberLevel}
          membershipExpiryText={membershipExpiryText}
          isBannedMember={isBannedMember}
          isSubmittingAction={isSubmittingAction}
          isSubmittingMembership={isSubmittingMembership}
          isSubmittingBan={isSubmittingBan}
          isSubmittingSubAccount={isSubmittingSubAccount}
          isSubmittingCancel={isSubmittingCancel}
          isSubmittingRenewalPrice={isSubmittingRenewalPrice}
          onOpenMembershipModal={handleOpenMembershipModal}
          onOpenRenewalPriceModal={handleOpenRenewalPriceModal}
          onOpenStatusModal={handleOpenStatusModal}
          onOpenSubAccountModal={handleOpenSubAccountModal}
          onOpenSubAccountDetailModal={handleOpenSubAccountDetailModal}
          onOpenClubStatsModal={handleOpenClubStatsModal}
          onOpenSalesStatsModal={handleOpenSalesStatsModal}
          onOpenCancelAccountModal={handleOpenCancelAccountModal}
        />

        {/* 核心数据网格：积分、豆、充值额、邀请数 */}
        <MemberDetailMetricsGrid
          member={member}
          points={points}
          beans={beans}
          isSubmittingAction={isSubmittingAction}
          isSubmittingPoints={isSubmittingPoints}
          isSubmittingBeans={isSubmittingBeans}
          onOpenPointsModal={handleOpenPointsModal}
          onOpenBeanModal={handleOpenBeanModal}
        />

        {/* 记录面板：充值 / 设置会员等级 / 调整续费 / 子账号设置 四态切换 */}
        <MemberDetailRechargePanel
          rechargeHistory={member.rechargeHistory}
          rechargeCount={member.rechargeCount}
          adminGrantHistory={member.adminGrantHistory}
          adminGrantCount={member.adminGrantCount}
          renewalPriceAdjustHistory={member.renewalPriceAdjustHistory}
          renewalPriceAdjustCount={member.renewalPriceAdjustCount}
          subAccountQuotaRecordHistory={member.subAccountQuotaRecordHistory}
          subAccountQuotaRecordCount={member.subAccountQuotaRecordCount}
          subAccountBackfillState={subAccountBackfillState}
          subAccountAddOnPriceDisplay={subAccountAddOnPriceDisplay}
        />

        {/* 会员备注卡（有备注才渲染） */}
        {member.remark?.trim() ? <MemberDetailRemarkCard remark={member.remark} /> : null}
      </main>

      <Suspense fallback={null}>
        {/* 调整积分弹窗 */}
        {isPointsModalOpen ? (
          <AdjustPointsModal
            member={member}
            currentPoints={points}
            onClose={handleCloseModal}
            onConfirm={handleAdjustPoints}
          />
        ) : null}

        {/* 调整纯利豆弹窗 */}
        {isBeanModalOpen ? (
          <AdjustBeanModal
            member={member}
            currentBeans={beans}
            onClose={handleCloseModal}
            onConfirm={handleAdjustBeans}
          />
        ) : null}

        {/* 设置会员等级弹窗 */}
        {isMembershipModalOpen ? (
          <SetMembershipModal
            member={member}
            memberId={member.id}
            currentLevel={memberLevel}
            currentExpiry={displayMemberExpiry}
            lifetimeMembershipDays={lifetimeMembershipDays}
            lifetimeMembershipAmountDisplay={lifetimeMembershipAmountDisplay}
            annualMembershipAmountDisplay={annualMembershipAmountDisplay}
            onClose={handleCloseModal}
            onConfirm={handleSetMembership}
          />
        ) : null}

        {/* 调整续费价格弹窗：只改该账号以后的续费价，不动本次成交 */}
        {isRenewalPriceModalOpen ? (
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
        {isStatusModalOpen ? (
          <MemberDetailStatusModal
            isBannedMember={isBannedMember}
            isSubmittingBan={isSubmittingBan}
            banReason={banReason}
            onBanReasonChange={setBanReason}
            onClose={handleCloseStatusModal}
            onConfirm={handleStatusConfirm}
          />
        ) : null}

        {/* 子账号详情弹窗：查看 purelyProfit 端的角色分配快照 */}
        {isSubAccountDetailModalOpen ? (
          <SubAccountDetailModal
            capability={member.subAccountCapability}
            onClose={handleCloseModal}
            onEditQuota={handleOpenSubAccountModal}
          />
        ) : null}

        {/* 子账号配置弹窗（平台侧，年/永久会员专属；角色分配由商家在 purelyProfit 端操作） */}
        {isSubAccountModalOpen ? (
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
            onBackfillSubAccountAmount={async (item, payload) =>
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
        {isClubStatsModalOpen ? (
          <MemberDetailClubStatsModal
            memberId={member.id}
            memberName={member.name}
            onClose={handleCloseModal}
          />
        ) : null}

        {/* 营业详情弹窗：查看该商家今日/本周/本月/今年/去年的销售额与利润柱状图 */}
        {isSalesStatsModalOpen ? (
          <MemberDetailSalesStatsModal
            memberId={member.id}
            memberName={member.name}
            onClose={handleCloseModal}
          />
        ) : null}

        {/* 注销账号弹窗：二次确认不可逆的账号注销操作 */}
        {isCancelAccountModalOpen ? (
          <CancelAccountModal
            memberName={member.name}
            memberPhone={member.phone}
            isSubmitting={isSubmittingCancel}
            onClose={handleCloseModal}
            onConfirm={handleCancelAccountConfirm}
          />
        ) : null}
      </Suspense>
    </div>
  );
};

export default MemberDetail;
