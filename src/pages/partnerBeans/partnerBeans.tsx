// 合伙人纯利豆管理页面
import React from 'react';
import PageHeader from '@components/ui/layout/PageHeader';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import AdjustBeanModal from './components/AdjustBeanModal/AdjustBeanModal';
import PartnerBeansFilterBar from './components/PartnerBeansFilterBar/PartnerBeansFilterBar';
import { IconPartnerBeansAdd } from './components/PartnerBeansIcons/PartnerBeansIcons';
import PartnerBeansPageState from './components/PartnerBeansPageState/PartnerBeansPageState';
import PartnerBeansRecordList from './components/PartnerBeansRecordList/PartnerBeansRecordList';
import PartnerBeansStatsOverview from './components/PartnerBeansStatsOverview/PartnerBeansStatsOverview';
import PartnerBeansSummaryCard from './components/PartnerBeansSummaryCard/PartnerBeansSummaryCard';
import PartnerBeansUserPicker from './components/PartnerBeansUserPicker/PartnerBeansUserPicker';
import { usePartnerBeansPage } from './usePartnerBeansPage';
import styles from './partnerBeans.module.less';

const PartnerBeans: React.FC = () => {
  const navigate = useAnimatedNavigate();
  const {
    filteredRecords,
    users,
    pickerUsers,
    activeTab,
    searchQuery,
    pickerSearchQuery,
    adjustTarget,
    showUserPicker,
    isLoading,
    isSubmitting,
    errorMessage,
    stats,
    setActiveTab,
    setSearchQuery,
    setPickerSearchQuery,
    openUserPicker,
    closeUserPicker,
    handleOpenAdjust,
    handleCloseAdjust,
    handleConfirmAdjust,
    retryLoad,
  } = usePartnerBeansPage();

  return (
    <div className={styles.pageContainer}>
      <div className={styles.blurOrb} aria-hidden="true" />
      <PageHeader
        title="合伙人纯利豆管理"
        onBack={() => navigate(-1)}
        rightExtra={(
          <button
            type="button"
            className={styles.adjustBtn}
            onClick={openUserPicker}
            aria-label="调整合伙人纯利豆"
            disabled={isSubmitting}
          >
            <IconPartnerBeansAdd />
            调整纯利豆
          </button>
        )}
      />

      <main className={styles.contentWrapper}>
        {isLoading ? <PartnerBeansPageState message="加载中..." variant="loading" /> : null}
        {!isLoading && errorMessage ? (
          <PartnerBeansPageState message={errorMessage} variant="error" onRetry={retryLoad} />
        ) : null}
        {!isLoading && !errorMessage ? (
          <>
            <PartnerBeansStatsOverview stats={stats} />
            <PartnerBeansSummaryCard
              isSubmitting={isSubmitting}
              users={users}
              onAdjust={handleOpenAdjust}
            />
            <PartnerBeansFilterBar
              activeTab={activeTab}
              searchQuery={searchQuery}
              setActiveTab={setActiveTab}
              setSearchQuery={setSearchQuery}
            />
            <PartnerBeansRecordList records={filteredRecords} />
          </>
        ) : null}
      </main>

      {showUserPicker ? (
        <PartnerBeansUserPicker
          isSubmitting={isSubmitting}
          searchQuery={pickerSearchQuery}
          users={pickerUsers}
          onClose={closeUserPicker}
          onSearchChange={setPickerSearchQuery}
          onSelect={handleOpenAdjust}
        />
      ) : null}

      {adjustTarget ? (
        <AdjustBeanModal
          user={adjustTarget}
          onClose={handleCloseAdjust}
          onConfirm={handleConfirmAdjust}
          isSubmitting={isSubmitting}
        />
      ) : null}
    </div>
  );
};

export default PartnerBeans;
