// 会员详情页主体组件：状态编排 + 事件处理 + 子组件组合。
import React, { Suspense, lazy, useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageHeader from '@components/ui/layout/PageHeader';
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
const SetMembershipModal = lazy(() => import('./components/modals/SetMembershipModal/SetMembershipModal'));

type ActiveModal = 'points' | 'beans' | 'membership' | 'status' | null;

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
    isSubmittingPoints,
    isSubmittingBeans,
    isSubmittingMembership,
    isSubmittingBan,
    isSubmittingAction,
    handleAdjustPoints,
    handleAdjustBeans,
    handleSetMembership,
    handleBanMember,
    handleUnbanMember,
    retryLoadMember,
  } = useMemberDetailPage(id);

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [banReason, setBanReason] = useState<string>('');

  const membershipExpiryText =
    memberLevel === 'free' ? null :
    memberLevel === 'lifetime' ? '永久有效' :
    memberExpiry ? `${formatMemberDate(memberExpiry)} 到期` : null;

  const isBannedMember = member?.status === 'banned';
  const isPointsModalOpen = activeModal === 'points';
  const isBeanModalOpen = activeModal === 'beans';
  const isMembershipModalOpen = activeModal === 'membership';
  const isStatusModalOpen = activeModal === 'status';

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
          onOpenMembershipModal={handleOpenMembershipModal}
          onOpenStatusModal={handleOpenStatusModal}
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
            currentExpiry={memberExpiry}
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
      </Suspense>
    </div>
  );
};

export default MemberDetail;
