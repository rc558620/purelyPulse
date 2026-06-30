// 地区卡片：负责渲染单个地区排行与汇总信息。
import React from 'react';
import { cx, safeNum } from '@utils/utils';
import {
  IconPromotionDetailChevronRight,
  IconPromotionDetailLocation,
} from '../_shared/icons/PromotionDetailIcons';
import styles from '../../promotionDetail.module.less';
import { formatPromotionDetailCount, getPromotionDetailProgressStyle } from '../../promotionDetail.utils';
import type { PromotionRegionItem } from '../../promotionDetail.types';

export interface PromotionRegionCardProps {
  regionItem: PromotionRegionItem;
  index: number;
  maxPartnerCount: number;
  onClick: (regionItem: PromotionRegionItem) => void;
}

const PromotionRegionCard: React.FC<PromotionRegionCardProps> = ({
  regionItem,
  index,
  maxPartnerCount,
  onClick,
}) => {
  const isTop = index < 3;

  return (
    <button
      type="button"
      className={cx(styles.regionCard, isTop && styles.regionCardTop)}
      onClick={() => onClick(regionItem)}
      aria-label={`查看${regionItem.province}合伙人详情`}
    >
      {isTop ? (
        <span
          className={cx(
            styles.regionRankBadge,
            index === 0 && styles.regionRankGold,
            index === 1 && styles.regionRankSilver,
            index === 2 && styles.regionRankBronze,
          )}
          aria-label={`第${index + 1}名`}
        >
          #{index + 1}
        </span>
      ) : null}

      <div className={styles.regionCardHeader}>
        <div className={styles.regionIconWrap} aria-hidden="true">
          <IconPromotionDetailLocation />
        </div>
        <span className={styles.regionProvince}>{regionItem.province}</span>
        <IconPromotionDetailChevronRight className={styles.regionArrow} />
      </div>

      <div className={styles.regionPartnerCount}>
        <span className={styles.regionPartnerNum}>{formatPromotionDetailCount(regionItem.partnerCount)}</span>
        <span className={styles.regionPartnerLabel}>位合伙人</span>
      </div>

      <div className={styles.regionStatsRow}>
        <div className={styles.regionStatItem}>
          <span className={styles.regionStatVal}>{formatPromotionDetailCount(regionItem.totalOrders)}</span>
          <span className={styles.regionStatLbl}>推广单</span>
        </div>
        <div className={styles.regionStatDivider} aria-hidden="true" />
        <div className={styles.regionStatItem}>
          <span className={cx(styles.regionStatVal, styles.regionStatRevenue)}>¥{regionItem.totalRevenueDisplay || '0'}</span>
          <span className={styles.regionStatLbl}>收益</span>
        </div>
        <div className={styles.regionStatDivider} aria-hidden="true" />
        <div className={styles.regionStatItem}>
          <span className={cx(styles.regionStatVal, safeNum(regionItem.growth) >= 15 && styles.regionGrowthHigh, safeNum(regionItem.growth) < 15 && styles.regionGrowthNormal)}>
            +{formatPromotionDetailCount(regionItem.growth)}%
          </span>
          <span className={styles.regionStatLbl}>增长</span>
        </div>
      </div>

      <div className={styles.regionProgressWrap} aria-hidden="true">
        <div className={styles.regionProgressBar} style={getPromotionDetailProgressStyle(regionItem.partnerCount, maxPartnerCount)} />
      </div>
    </button>
  );
};

export default React.memo(PromotionRegionCard);
