// SetSubAccountEligibilityBanner：提示当前会员等级不具备子账号能力。
import React from 'react';
import { IconLock } from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
import styles from '../../SetSubAccountModal.module.less';

const SetSubAccountEligibilityBanner: React.FC = () => (
  <div className={styles.ineligibleBanner} role="alert">
    <div className={styles.ineligibleBannerIcon}>
      <IconLock width={17} height={17} strokeWidth={2.2} />
    </div>
    <div className={styles.ineligibleBannerText}>
      <div className={styles.ineligibleBannerTitle}>当前等级不支持子账号能力</div>
      <div className={styles.ineligibleBannerDesc}>
        只有<strong>年会员</strong>或<strong>永久会员</strong>才能开通子账号功能。
        如需使用，请先将该商家升级至对应等级。
      </div>
    </div>
  </div>
);

export default SetSubAccountEligibilityBanner;
