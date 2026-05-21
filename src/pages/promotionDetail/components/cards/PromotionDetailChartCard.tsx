import type React from 'react';
import styles from '../../promotionDetail.module.less';

export interface PromotionDetailChartCardProps {
  title: string;
  icon: React.ReactNode;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}

const PromotionDetailChartCard: React.FC<PromotionDetailChartCardProps> = ({
  title,
  icon,
  headerExtra,
  children,
}): React.JSX.Element => (
  <section className={styles.chartCard}>
    <div className={styles.chartCardHeader}>
      <div className={styles.chartCardTitleWrap}>
        <div className={styles.chartCardIcon} aria-hidden="true">
          {icon}
        </div>
        <span className={styles.chartCardTitle}>{title}</span>
      </div>
      {headerExtra}
    </div>
    {children}
  </section>
);

export default PromotionDetailChartCard;
