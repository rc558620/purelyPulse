// 推广详情合伙人视图：负责地区概况、合伙人列表与空态展示。
import React from 'react';
import { EmptyState } from '@components/ui/feedback';
import { cx, fmtAmount, isNonEmptyArray, safeNum } from '@utils/utils';
import {
  IconPromotionDetailEmpty,
  IconPromotionDetailLocation,
  IconPromotionDetailUser,
} from '../_shared/icons/PromotionDetailIcons';
import PromotionPartnerCard from '../cards/PromotionPartnerCard';
import styles from '../../promotionDetail.module.less';
import { formatPromotionDetailCount } from '../../promotionDetail.utils';
import type { PromotionPartnerItem, PromotionRegionItem } from '../../promotionDetail.types';

export interface PromotionDetailPartnerViewProps {
  selectedRegion: PromotionRegionItem;
  dateDisplayText: string;
  currentPartners: PromotionPartnerItem[];
  showEmptyState: boolean;
  onBackToRegion: () => void;
  onPartnerClick: (partner: PromotionPartnerItem) => void;
}

const PromotionDetailPartnerView: React.FC<PromotionDetailPartnerViewProps> = ({
  selectedRegion,
  dateDisplayText,
  currentPartners,
  showEmptyState,
  onBackToRegion,
  onPartnerClick,
}) => {
  const renderSummary = (
    <div className={styles.regionSummaryCard}>
      <div className={styles.regionSummaryLeft}>
        <div className={styles.regionSummaryIcon} aria-hidden="true">
          <IconPromotionDetailLocation width={18} height={18} />
        </div>
        <div className={styles.regionSummaryInfo}>
          <span className={styles.regionSummaryName}>{selectedRegion.province}</span>
          <span className={styles.regionSummaryDate}>{dateDisplayText}</span>
        </div>
      </div>
      <div className={styles.regionSummaryStats}>
        <div className={styles.regionSummaryStatItem}>
          <span className={styles.regionSummaryNum}>{formatPromotionDetailCount(selectedRegion.partnerCount)}</span>
          <span className={styles.regionSummaryLbl}>合伙人</span>
        </div>
        <div className={styles.regionSummaryStatItem}>
          <span className={cx(styles.regionSummaryNum, styles.colorGreen)}>{formatPromotionDetailCount(selectedRegion.totalOrders)}</span>
          <span className={styles.regionSummaryLbl}>推广单</span>
        </div>
        <div className={styles.regionSummaryStatItem}>
          <span className={cx(styles.regionSummaryNum, styles.colorEmerald)}>¥{fmtAmount(selectedRegion.totalRevenue)}</span>
          <span className={styles.regionSummaryLbl}>总收益</span>
        </div>
      </div>
    </div>
  );

  if (showEmptyState) {
    return (
      <>
        {renderSummary}
        <div className={styles.detailListCard}>
          <EmptyState
            icon={<IconPromotionDetailEmpty />}
            title="该地区暂无合伙人数据"
            desc="当前地区下还没有可展示的合伙人推广记录。"
            actionText="返回地区"
            onAction={onBackToRegion}
          />
        </div>
      </>
    );
  }

  return (
    <>
      {renderSummary}
      <div className={styles.partnerListHint}>
        <IconPromotionDetailUser width={13} height={13} />
        点击合伙人可查看推广详情
      </div>

      <div className={styles.partnerList}>
        {isNonEmptyArray(currentPartners) ? currentPartners.map((partner) => (
          <PromotionPartnerCard
            key={partner.id}
            partner={partner}
            maxOrders={safeNum(currentPartners[0]?.orders) || 1}
            onClick={onPartnerClick}
          />
        )) : null}
      </div>
    </>
  );
};

export default React.memo(PromotionDetailPartnerView);
