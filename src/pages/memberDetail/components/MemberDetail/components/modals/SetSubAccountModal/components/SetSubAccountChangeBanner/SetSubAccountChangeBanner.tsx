// SetSubAccountChangeBanner：展示配额变更后的风险与影响提示。
import React from 'react';
import { cx, safeNum } from '@utils/utils';
import { IconWarningTriangle } from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
import styles from '../../SetSubAccountModal.module.less';

interface SetSubAccountChangeBannerProps {
  initialQuota: number;
  selectedQuota: number;
}

const getChangeDescription = (initialQuota: number, selectedQuota: number): string => {
  if (selectedQuota < initialQuota && initialQuota > 0) {
    return '缩减额度后，超出部分的子账号槽位将被禁用，已分配的员工将无法继续使用子账号登录。';
  }

  if (selectedQuota === 0) {
    return '关闭后所有子账号将立即失效，员工将只能使用主账号登录。';
  }

  return '新增额度后商家可在 purelyProfit 端立即为新槽位分配员工。';
};

const SetSubAccountChangeBanner: React.FC<SetSubAccountChangeBannerProps> = ({
  initialQuota,
  selectedQuota,
}) => (
  <div className={cx(styles.ineligibleBanner, styles.ineligibleBannerInfo)} role="status">
    <div className={cx(styles.ineligibleBannerIcon, styles.ineligibleBannerIconInfo)}>
      <IconWarningTriangle width={17} height={17} strokeWidth={2} />
    </div>
    <div className={styles.ineligibleBannerText}>
      <div className={cx(styles.ineligibleBannerTitle, styles.ineligibleBannerTitleInfo)}>
        配额将从 {safeNum(initialQuota)} 变更为 {safeNum(selectedQuota)}
      </div>
      <div className={styles.ineligibleBannerDesc}>
        {getChangeDescription(initialQuota, selectedQuota)}
      </div>
    </div>
  </div>
);

export default SetSubAccountChangeBanner;
