import React from 'react';
import { IconCircleChevronUp, IconWarningTriangle } from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
import styles from '../../SetMembershipModal.module.less';

interface SelectedOption {
  label: string;
  color: string;
}

interface SetMembershipConfirmStepProps {
  isLifetime: boolean;
  isCurrentLifetime: boolean;
  selectedOption: SelectedOption;
  multiplier: number;
  addedDays: number;
  newExpiry: number | null;
  formatMembershipExpiry: (timestamp: number) => string;
}

const SetMembershipConfirmStep: React.FC<SetMembershipConfirmStepProps> = ({
  isLifetime,
  isCurrentLifetime,
  selectedOption,
  multiplier,
  addedDays,
  newExpiry,
  formatMembershipExpiry,
}) => (
  <div className={styles.sheetBody}>
    <div className={styles.confirmContent}>
      <div className={styles.confirmIcon} style={{ color: selectedOption.color }} aria-hidden="true">
        <IconCircleChevronUp width={48} height={48} strokeWidth={1.5} />
      </div>
      <h2 className={styles.confirmTitle}>确认操作</h2>
      <p className={styles.confirmDesc}>您即将设置用户会员等级，请确认以下信息无误：</p>

      <div
        className={styles.confirmSummary}
        style={{ borderColor: `${selectedOption.color}33`, background: `${selectedOption.color}08` }}
      >
        {isLifetime ? (
          <>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>设置类型</span>
              <span
                className={styles.summaryValue}
                style={{
                  background: `${selectedOption.color}20`,
                  color: selectedOption.color,
                  borderColor: `${selectedOption.color}40`,
                }}
              >
                ♾ {selectedOption.label}
              </span>
            </div>
            <div className={styles.summaryDivider} />
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>会员状态</span>
              <span className={styles.summaryValue} style={{ color: selectedOption.color, fontWeight: 800 }}>
                永久有效
              </span>
            </div>
            <div className={styles.summaryDivider} />
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>续期需求</span>
              <span className={styles.summaryValue}>无需续期</span>
            </div>
          </>
        ) : (
          <>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>设置类型</span>
              <span
                className={styles.summaryValue}
                style={{
                  background: `${selectedOption.color}20`,
                  color: selectedOption.color,
                  borderColor: `${selectedOption.color}40`,
                }}
              >
                {selectedOption.label} × {multiplier}
              </span>
            </div>
            <div className={styles.summaryDivider} />
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>追加天数</span>
              <span className={styles.summaryValue} style={{ color: selectedOption.color, fontWeight: 800 }}>
                +{addedDays} 天
              </span>
            </div>
            <div className={styles.summaryDivider} />
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>新到期日期</span>
              <span className={styles.summaryValue}>{newExpiry ? formatMembershipExpiry(newExpiry) : '—'}</span>
            </div>
          </>
        )}
      </div>

      {isCurrentLifetime && !isLifetime ? (
        <div className={styles.confirmWarning}>
          <IconWarningTriangle width={16} height={16} strokeWidth={2} />
          <p>当前为永久会员，降级后账户到期需要续期</p>
        </div>
      ) : null}
    </div>
  </div>
);

export default SetMembershipConfirmStep;
