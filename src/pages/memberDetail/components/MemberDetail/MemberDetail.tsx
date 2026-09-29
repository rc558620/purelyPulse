// 会员详情主体组件：区块组合与弹窗挂载，状态编排下沉到专用 hook。
import React, { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import PageHeader from '@components/ui/layout/PageHeader';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import MemberDetailHeroSection from './components/sections/MemberDetailHeroSection/MemberDetailHeroSection';
import MemberDetailMetricsGrid from './components/sections/MemberDetailMetricsGrid/MemberDetailMetricsGrid';
import MemberDetailPageState from './components/pageState/MemberDetailPageState/MemberDetailPageState';
import MemberDetailRechargePanel from './components/sections/MemberDetailRechargePanel/MemberDetailRechargePanel';
import MemberDetailRemarkCard from './components/sections/MemberDetailRemarkCard/MemberDetailRemarkCard';
import MemberDetailModals from './components/modals/MemberDetailModals/MemberDetailModals';
import { useMemberDetailMemberSummary } from './hooks/useMemberDetailMemberSummary';
import { useMemberDetailModals } from './hooks/useMemberDetailModals';
import { useMemberDetailPage } from '../../useMemberDetailPage';
import styles from '../../memberDetail.module.less';

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

  const isBannedMember = member?.status === 'banned';
  const handleBack = useCallback((): void => {
    navigate(-1);
  }, [navigate]);

  const {
    membershipExpiry,
    membershipExpiryText,
    subAccountBackfillState,
    subAccountAddOnPriceDisplay,
  } = useMemberDetailMemberSummary({
    member,
    memberLevel,
    memberExpiry,
    lifetimeMembershipDays,
  });

  const modals = useMemberDetailModals({
    isBannedMember,
    isSubmittingBan,
    handleBanMember,
    handleUnbanMember,
    handleCancelAccount,
  });

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
          onOpenMembershipModal={modals.handleOpenMembershipModal}
          onOpenRenewalPriceModal={modals.handleOpenRenewalPriceModal}
          onOpenStatusModal={modals.handleOpenStatusModal}
          onOpenSubAccountModal={modals.handleOpenSubAccountModal}
          onOpenSubAccountDetailModal={modals.handleOpenSubAccountDetailModal}
          onOpenClubStatsModal={modals.handleOpenClubStatsModal}
          onOpenSalesStatsModal={modals.handleOpenSalesStatsModal}
          onOpenCancelAccountModal={modals.handleOpenCancelAccountModal}
        />

        {/* 核心数据网格：积分、豆、充值额、邀请数 */}
        <MemberDetailMetricsGrid
          member={member}
          points={points}
          beans={beans}
          isSubmittingAction={isSubmittingAction}
          isSubmittingPoints={isSubmittingPoints}
          isSubmittingBeans={isSubmittingBeans}
          onOpenPointsModal={modals.handleOpenPointsModal}
          onOpenBeanModal={modals.handleOpenBeanModal}
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

      <MemberDetailModals
        member={member}
        points={points}
        beans={beans}
        memberLevel={memberLevel}
        membershipExpiry={membershipExpiry}
        lifetimeMembershipDays={lifetimeMembershipDays}
        lifetimeMembershipAmountDisplay={lifetimeMembershipAmountDisplay}
        annualMembershipAmountDisplay={annualMembershipAmountDisplay}
        isSubmittingBan={isSubmittingBan}
        isSubmittingSubAccount={isSubmittingSubAccount}
        isResettingLockedPrice={isResettingLockedPrice}
        isBackfillingSubAccount={isBackfillingSubAccount}
        isSubmittingRenewalPrice={isSubmittingRenewalPrice}
        isSubmittingCancel={isSubmittingCancel}
        modals={modals}
        handleAdjustPoints={handleAdjustPoints}
        handleAdjustBeans={handleAdjustBeans}
        handleSetMembership={handleSetMembership}
        handleSetSubAccountQuota={handleSetSubAccountQuota}
        handleResetLockedPrice={handleResetLockedPrice}
        handleBackfillSubAccountAmount={handleBackfillSubAccountAmount}
        handleUpdateRenewalPrices={handleUpdateRenewalPrices}
      />
    </div>
  );
};

export default MemberDetail;
