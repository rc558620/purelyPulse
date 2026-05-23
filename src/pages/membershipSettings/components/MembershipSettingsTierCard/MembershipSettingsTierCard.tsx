// 会员套餐卡片：负责组合头部展示、字段输入与卡片状态路由。
import type { JSX } from 'react';
import { cx } from '@utils/utils';
import { useMembershipTierCard } from '../../hooks/useMembershipTierCard';
import type { MembershipTierCardProps } from '../../membershipSettings.types';
import MembershipSettingsTierCardBody from './components/MembershipSettingsTierCardBody/MembershipSettingsTierCardBody';
import MembershipSettingsTierCardHeader from './components/MembershipSettingsTierCardHeader/MembershipSettingsTierCardHeader';
import {
  formatMembershipTierPriceDisplay,
  TONE_CLASS_NAMES,
} from './MembershipSettingsTierCard.shared';
import styles from './MembershipSettingsTierCard.module.less';

const MembershipSettingsTierCard = ({
  config,
  initialValue,
  onSaveValue,
}: MembershipTierCardProps): JSX.Element => {
  const {
    value,
    savedValue,
    isDirty,
    isSaving,
    justSaved,
    handlePriceChange,
    handleDaysChange,
    handleSave,
  } = useMembershipTierCard(config, initialValue, onSaveValue);
  const toneClassNames = TONE_CLASS_NAMES[config.tone];
  const shouldShowCurrentPrice = !isDirty && !justSaved && Boolean(savedValue.price);
  const currentPriceText = formatMembershipTierPriceDisplay(savedValue.price);

  return (
    <section
      className={cx(
        styles.tierCard,
        styles[toneClassNames.card],
        isDirty && styles.tierCardDirty,
      )}
    >
      {/* 套餐卡片头部状态区 */}
      <MembershipSettingsTierCardHeader
        config={config}
        toneClassNames={toneClassNames}
        shouldShowCurrentPrice={shouldShowCurrentPrice}
        currentPriceText={currentPriceText}
        justSaved={justSaved}
        isDirty={isDirty}
      />

      {/* 套餐卡片表单与保存区 */}
      <MembershipSettingsTierCardBody
        config={config}
        value={value}
        toneClassNames={toneClassNames}
        isSaving={isSaving}
        isDirty={isDirty}
        onPriceChange={handlePriceChange}
        onDaysChange={handleDaysChange}
        onSave={handleSave}
      />
    </section>
  );
};

export default MembershipSettingsTierCard;
