// 会员套餐卡片内容区：负责渲染字段输入与保存按钮。
import { memo } from 'react';
import type { JSX } from 'react';
import { cx } from '@utils/utils';
import {
  IconMembershipCalendar,
  IconMembershipSave,
} from '../../../MembershipSettingsIcons/MembershipSettingsIcons';
import type {
  MembershipTierConfig,
  TierValue,
} from '../../../../membershipSettings.types';
import type { MembershipSettingsTierToneClasses } from '../../MembershipSettingsTierCard.shared';
import styles from '../../MembershipSettingsTierCard.module.less';

interface MembershipSettingsTierCardBodyProps {
  /** 套餐配置 */
  config: MembershipTierConfig;
  /** 当前输入值 */
  value: TierValue;
  /** 当前 tone 样式类名集合 */
  toneClassNames: MembershipSettingsTierToneClasses;
  /** 是否处于保存中 */
  isSaving: boolean;
  /** 是否存在未保存改动 */
  isDirty: boolean;
  /** 价格输入处理函数 */
  onPriceChange: (rawValue: string) => void;
  /** 有效期输入处理函数 */
  onDaysChange: (rawValue: string) => void;
  /** 保存处理函数 */
  onSave: () => Promise<void>;
}

const MembershipSettingsTierCardBody = memo(({
  config,
  value,
  toneClassNames,
  isSaving,
  isDirty,
  onPriceChange,
  onDaysChange,
  onSave,
}: MembershipSettingsTierCardBodyProps): JSX.Element => (
  <div className={styles.tierFields}>
    <div className={styles.fieldGroup}>
      <label className={styles.fieldLabel} htmlFor={`price-${config.id}`}>
        会员价格
      </label>

      <div className={styles.priceInputWrap}>
        <span className={styles.priceCurrencyPrefix}>¥</span>
        <input
          id={`price-${config.id}`}
          type="text"
          inputMode="decimal"
          className={styles.priceInput}
          value={value.price}
          onChange={(event) => onPriceChange(event.target.value)}
          placeholder="0.00"
          autoComplete="off"
        />
      </div>
    </div>

    {config.id === 'lifetime' ? (
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel} htmlFor={`lifetime-days-${config.id}`}>
          <span className={styles.calendarIcon} aria-hidden="true">
            <IconMembershipCalendar />
          </span>
          有效期（天）
        </label>

        <div className={styles.daysInputWrap}>
          <input
            id={`lifetime-days-${config.id}`}
            type="text"
            inputMode="numeric"
            className={styles.daysInput}
            value={value.lifetimeDays ?? ''}
            onChange={(event) => onDaysChange(event.target.value)}
            placeholder="例：36500"
            autoComplete="off"
          />
          <span className={styles.daysSuffix}>天</span>
        </div>

        <span className={styles.fieldHint}>购买后的会员权益有效天数</span>
      </div>
    ) : null}

    <div className={styles.cardSaveRow}>
      <button
        type="button"
        className={cx(
          styles.cardSaveBtn,
          styles[toneClassNames.button],
          isSaving && styles.cardSaveBtnLoading,
        )}
        onClick={onSave}
        disabled={isSaving || !isDirty}
        aria-label={`保存${config.label}设置`}
      >
        {isSaving ? (
          <span className={styles.cardSaveBtnSpinner} aria-hidden="true" />
        ) : (
          <span className={styles.cardSaveBtnIcon} aria-hidden="true">
            <IconMembershipSave />
          </span>
        )}
        {isSaving ? '保存中…' : isDirty ? '保存此项' : '已是最新'}
      </button>
    </div>
  </div>
));

MembershipSettingsTierCardBody.displayName = 'MembershipSettingsTierCardBody';

export default MembershipSettingsTierCardBody;
