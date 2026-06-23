// 会员套餐卡片头部：展示套餐信息、当前价格与保存状态。
import type { JSX } from 'react';
import { cx } from '@utils/utils';
import { IconMembershipCheck } from '../../../MembershipSettingsIcons/MembershipSettingsIcons';
import type { MembershipTierConfig } from '../../../../membershipSettings.types';
import type { MembershipSettingsTierToneClasses } from '../../MembershipSettingsTierCard.shared';
import styles from '../../MembershipSettingsTierCard.module.less';

interface MembershipSettingsTierCardHeaderProps {
  /** 套餐配置 */
  config: MembershipTierConfig;
  /** 当前 tone 样式类名集合 */
  toneClassNames: MembershipSettingsTierToneClasses;
  /** 是否展示当前价格 */
  shouldShowCurrentPrice: boolean;
  /** 格式化后的当前价格文本 */
  currentPriceText: string;
  /** 是否刚保存成功 */
  justSaved: boolean;
  /** 是否存在未保存改动 */
  isDirty: boolean;
}

// BUG-13 修复：移除无效 memo，父组件非 memo 且 props 每次输入都变，memo 无法拦截任何重渲染
const MembershipSettingsTierCardHeader = ({
  config,
  toneClassNames,
  shouldShowCurrentPrice,
  currentPriceText,
  justSaved,
  isDirty,
}: MembershipSettingsTierCardHeaderProps): JSX.Element => {
  const TierIcon = config.icon;

  return (
    <div className={styles.tierCardHeader}>
      <div className={cx(styles.tierIcon, styles[toneClassNames.icon])} aria-hidden="true">
        <TierIcon />
      </div>

      <div className={styles.tierInfo}>
        <span className={styles.tierLabel}>{config.label}</span>
        <span className={styles.tierSublabel}>{config.sublabel}</span>
      </div>

      {shouldShowCurrentPrice ? (
        <div className={styles.currentPriceBadge}>
          <span className={styles.currentPriceLabel}>当前价格</span>
          <span className={styles.currentPriceValue}>
            <span className={styles.currentPriceCurrency}>¥</span>
            <span className={styles.currentPriceNum}>{currentPriceText}</span>
          </span>
        </div>
      ) : null}

      {justSaved && !isDirty ? (
        <div className={styles.savedTag} aria-live="polite">
          <IconMembershipCheck />
          已保存
        </div>
      ) : null}

      {isDirty ? <span className={styles.dirtyDot} aria-label="有未保存的修改" /> : null}
    </div>
  );
};

export default MembershipSettingsTierCardHeader;
