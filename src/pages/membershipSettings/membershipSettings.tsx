// 会员设置页面：负责装配头部、说明区与各套餐配置卡片。
import React, { useCallback } from 'react';
import { EmptyState, InertiaSpinner } from '@components/ui/feedback';
import PageHeader from '@components/ui/layout/PageHeader';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import { isNonEmptyArray } from '@utils/utils';
import MembershipSettingsHero from './components/MembershipSettingsHero/MembershipSettingsHero';
import { IconMembershipSettings } from './components/MembershipSettingsIcons/MembershipSettingsIcons';
import MembershipSettingsTierCard from './components/MembershipSettingsTierCard/MembershipSettingsTierCard';
import { MEMBERSHIP_TIER_CONFIGS } from './membershipSettings.constants';
import { useMembershipSettingsPage } from './hooks/useMembershipSettingsPage';
import styles from './membershipSettings.module.less';

const MembershipSettings: React.FC = () => {
  const navigate = useAnimatedNavigate();
  const {
    tierValues,
    isLoading,
    errorMessage,
    retryLoad,
    handleSaveTierValue,
  } = useMembershipSettingsPage();

  const handleBack = useCallback((): void => {
    navigate(-1);
  }, [navigate]);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.blurOrb} aria-hidden="true" />
      <div className={styles.blurOrb2} aria-hidden="true" />

      <PageHeader title="会员管理" onBack={handleBack} />

      <main className={styles.contentWrapper}>
        {/* 会员套餐页面说明区 */}
        <MembershipSettingsHero />

        {isLoading ? (
          <div className={styles.loadingState} role="status">
            <InertiaSpinner spinning size="lg" variant="brand" />
            <span>正在加载会员套餐配置...</span>
          </div>
        ) : null}

        {!isLoading && errorMessage ? (
          <div className={styles.errorState} role="alert">
            <EmptyState
              icon={<IconMembershipSettings />}
              title="会员套餐加载失败"
              desc={errorMessage}
              actionText="重新加载"
              onAction={retryLoad}
            />
          </div>
        ) : null}

        {/* 会员套餐配置卡片列表 */}
        {!isLoading && !errorMessage && isNonEmptyArray(MEMBERSHIP_TIER_CONFIGS) ? (
          <div className={styles.tierList}>
            {MEMBERSHIP_TIER_CONFIGS.map((config) => (
              <MembershipSettingsTierCard
                key={config.id}
                config={config}
                initialValue={tierValues[config.id]}
                onSaveValue={handleSaveTierValue}
              />
            ))}
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default MembershipSettings;
