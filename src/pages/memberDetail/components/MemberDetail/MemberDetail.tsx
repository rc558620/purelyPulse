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
import { formatMemberDate } from '../../memberDetail.utils';
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
const SubAccountDetailModal = lazy(() => import('./components/modals/SubAccountDetailModal/SubAccountDetailModal'));
const MemberDetailClubStatsModal = lazy(() => import('./components/modals/MemberDetailClubStatsModal/MemberDetailClubStatsModal'));
const MemberDetailSalesStatsModal = lazy(() => import('./components/modals/MemberDetailSalesStatsModal/MemberDetailSalesStatsModal'));

type ActiveModal = 'points' | 'beans' | 'membership' | 'status' | 'subAccount' | 'subAccountDetail' | 'clubStats' | 'salesStats' | null;

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
    lifetimeMembershipAmountFen,
    isSubmittingPoints,
    isSubmittingBeans,
    isSubmittingMembership,
    isSubmittingBan,
    isSubmittingSubAccount,
    isSubmittingAction,
    handleAdjustPoints,
    handleAdjustBeans,
    handleSetMembership,
    handleBanMember,
    handleUnbanMember,
    handleSetSubAccountQuota,
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

  const isBannedMember = member?.status === 'banned';
  const isPointsModalOpen = activeModal === 'points';
  const isBeanModalOpen = activeModal === 'beans';
  const isMembershipModalOpen = activeModal === 'membership';
  const isStatusModalOpen = activeModal === 'status';
  const isSubAccountModalOpen = activeModal === 'subAccount';
  const isSubAccountDetailModalOpen = activeModal === 'subAccountDetail';
  const isClubStatsModalOpen = activeModal === 'clubStats';
  const isSalesStatsModalOpen = activeModal === 'salesStats';

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
      <div className={styles.blurOrb} aria-hidden="true" />

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
          onOpenMembershipModal={handleOpenMembershipModal}
          onOpenStatusModal={handleOpenStatusModal}
          onOpenSubAccountModal={handleOpenSubAccountModal}
          onOpenSubAccountDetailModal={handleOpenSubAccountDetailModal}
          onOpenClubStatsModal={handleOpenClubStatsModal}
          onOpenSalesStatsModal={handleOpenSalesStatsModal}
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

        {/* 充值记录面板 */}
        <MemberDetailRechargePanel
          rechargeHistory={member.rechargeHistory}
          rechargeCount={member.rechargeCount}
        />

        {/* 会员备注卡（有备注才渲染） */}
        {member.remark ? <MemberDetailRemarkCard remark={member.remark} /> : null}
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
            currentLevel={memberLevel}
            currentExpiry={displayMemberExpiry}
            lifetimeMembershipDays={lifetimeMembershipDays}
            lifetimeMembershipAmountFen={lifetimeMembershipAmountFen}
            onClose={handleCloseModal}
            onConfirm={handleSetMembership}
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
      </Suspense>
    </div>
  );
};

export default MemberDetail;
