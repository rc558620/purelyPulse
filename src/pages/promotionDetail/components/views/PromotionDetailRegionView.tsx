// 推广详情地区视图：负责地区汇总、地区排行与地区态反馈。
import React from 'react';
import { InertiaSpinner } from '@components/ui/feedback';
import { cx, fmtAmount, isNonEmptyArray, safeNum } from '@utils/utils';
import { IconPromotionDetailLocation } from '../_shared/icons/PromotionDetailIcons';
import PromotionRegionCard from '../cards/PromotionRegionCard';
import styles from '../../promotionDetail.module.less';
import { formatPromotionDetailCount } from '../../promotionDetail.utils';
import type { PromotionRegionItem } from '../../promotionDetail.types';

export interface PromotionDetailRegionViewProps {
  isLoading: boolean;
  errorMessage: string;
  regionDisplayText: string;
  dateDisplayText: string;
  filteredRegions: PromotionRegionItem[];
  totalPartners: number;
  totalOrders: number;
  totalRevenue: number;
  onRetry: () => void;
  onRegionClick: (regionItem: PromotionRegionItem) => void;
}

const PromotionDetailRegionView: React.FC<PromotionDetailRegionViewProps> = ({
  isLoading,
  errorMessage,
  regionDisplayText,
  dateDisplayText,
  filteredRegions,
  totalPartners,
  totalOrders,
  totalRevenue,
  onRetry,
  onRegionClick,
}) => {
  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <InertiaSpinner spinning size="lg" variant="brand" />
        <span>正在加载推广详情...</span>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className={styles.statusCard} role="alert">
        <div className={styles.statusIcon} aria-hidden="true">!</div>
        <div className={styles.statusBody}>
          <div className={styles.statusTitle}>加载失败</div>
          <div className={styles.statusDesc}>{errorMessage}</div>
        </div>
        <button type="button" className={styles.retryBtn} onClick={onRetry}>
          重新加载
        </button>
      </div>
    );
  }

  if (!isNonEmptyArray(filteredRegions)) {
    return null;
  }

  const maxPartnerCount = safeNum(filteredRegions[0]?.partnerCount) || 1;

  return (
    <>
      <div className={styles.resultSummary}>
        <div className={styles.resultSummaryLeft}>
          <span className={styles.resultSummaryTitle}>地区合伙人分布</span>
          <span className={styles.resultSummaryMeta}>
            {regionDisplayText} · {dateDisplayText}
          </span>
        </div>
        <span className={styles.resultCount}>{formatPromotionDetailCount(filteredRegions.length)} 个地区</span>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <span className={styles.statNum}>{formatPromotionDetailCount(totalPartners)}</span>
          <span className={styles.statLabel}>总合伙人</span>
        </div>
        <div className={styles.statDivider} aria-hidden="true" />
        <div className={styles.statItem}>
          <span className={cx(styles.statNum, styles.statNumOrders)}>{formatPromotionDetailCount(totalOrders)}</span>
          <span className={styles.statLabel}>总推广单</span>
        </div>
        <div className={styles.statDivider} aria-hidden="true" />
        <div className={styles.statItem}>
          <span className={cx(styles.statNum, styles.statNumRevenue)}>¥{fmtAmount(totalRevenue)}</span>
          <span className={styles.statLabel}>总收益</span>
        </div>
      </div>

      <div className={styles.regionSectionTitle}>
        <IconPromotionDetailLocation />
        点击地区查看合伙人详情
      </div>

      <div className={styles.regionGrid}>
        {filteredRegions.map((regionItem, index) => (
          <PromotionRegionCard
            key={regionItem.province}
            regionItem={regionItem}
            index={index}
            maxPartnerCount={maxPartnerCount}
            onClick={onRegionClick}
          />
        ))}
      </div>
    </>
  );
};

export default React.memo(PromotionDetailRegionView);
