import type React from 'react';
import { cx } from '@utils/utils';
import sharedStyles from '../../revenueDetail.module.less';

export interface RevenueDetailChartCardProps {
  className?: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  toneClassName: string;
  children: React.ReactNode;
}

const RevenueDetailChartCard: React.FC<RevenueDetailChartCardProps> = ({
  className,
  title,
  subtitle,
  icon,
  toneClassName,
  children,
}): React.JSX.Element => (
  <section className={className}>
    <div className={sharedStyles.cardHeader}>
      <div className={cx(sharedStyles.cardHeaderIcon, toneClassName)} aria-hidden="true">
        {icon}
      </div>
      <div>
        <h2 className={sharedStyles.cardTitle}>{title}</h2>
        {subtitle ? <p className={sharedStyles.cardSub}>{subtitle}</p> : null}
      </div>
    </div>
    {children}
  </section>
);

export default RevenueDetailChartCard;
