// 会员积分管理页面：负责状态编排、模块组合与弹窗分发。
import React, { useCallback } from 'react';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import AdjustPointsModal from './components/AdjustPointsModal/AdjustPointsModal';
import MemberPointsFilterBar from './components/MemberPointsFilterBar/MemberPointsFilterBar';
import MemberPointsPageHeader from './components/MemberPointsPageHeader/MemberPointsPageHeader';
import MemberPointsPageState from './components/MemberPointsPageState/MemberPointsPageState';
import MemberPointsRecordList from './components/MemberPointsRecordList/MemberPointsRecordList';
import MemberPointsStatsOverview from './components/MemberPointsStatsOverview/MemberPointsStatsOverview';
import UserPickerModal from './components/UserPickerModal/UserPickerModal';
import { useMemberPointsPage } from './useMemberPointsPage';
import styles from './memberPoints.module.less';

const MemberPoints: React.FC = () => {
  const navigate = useAnimatedNavigate();
  const {
    filteredRecords,
    filteredUsers,
    activeTab,
    recordSearchQuery,
    pickerKeyword,
    adjustTarget,
    showUserPicker,
    isLoading,
    isSubmitting,
    errorMessage,
    stats,
    setActiveTab,
    setRecordSearchQuery,
    setPickerKeyword,
    openUserPicker,
    closeUserPicker,
    handleOpenAdjust,
    handleCloseAdjust,
    handleConfirmAdjust,
    retryLoad,
  } = useMemberPointsPage();

  const handleBack = useCallback((): void => {
    navigate(-1);
  }, [navigate]);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.blurOrb} aria-hidden="true" />
      <MemberPointsPageHeader
        isSubmitting={isSubmitting}
        onBack={handleBack}
        onOpenUserPicker={openUserPicker}
      />

      <main className={styles.contentWrapper}>
        {isLoading ? <MemberPointsPageState message="加载中..." variant="loading" /> : null}
        {!isLoading && errorMessage ? (
          <MemberPointsPageState message={errorMessage} variant="error" onRetry={retryLoad} />
        ) : null}
        {!isLoading && !errorMessage ? (
          <>
            <MemberPointsStatsOverview stats={stats} />
            <MemberPointsFilterBar
              activeTab={activeTab}
              searchQuery={recordSearchQuery}
              onTabChange={setActiveTab}
              onSearchChange={setRecordSearchQuery}
            />
            <MemberPointsRecordList records={filteredRecords} />
          </>
        ) : null}
      </main>

      {showUserPicker ? (
        <UserPickerModal
          users={filteredUsers}
          keyword={pickerKeyword}
          isSubmitting={isSubmitting}
          onKeywordChange={setPickerKeyword}
          onClose={closeUserPicker}
          onSelect={handleOpenAdjust}
        />
      ) : null}

      {adjustTarget ? (
        <AdjustPointsModal
          user={adjustTarget}
          onClose={handleCloseAdjust}
          onConfirm={handleConfirmAdjust}
          isSubmitting={isSubmitting}
        />
      ) : null}
    </div>
  );
};

export default MemberPoints;
