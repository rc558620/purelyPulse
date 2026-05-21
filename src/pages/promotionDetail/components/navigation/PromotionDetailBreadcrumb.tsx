// 推广详情面包屑：负责地区层级与合伙人层级返回导航展示。
import React from 'react';
import {
  IconPromotionDetailChevronRight,
} from '../_shared/icons/PromotionDetailIcons';
import styles from '../../promotionDetail.module.less';
import type { PromotionViewMode } from '../../promotionDetail.types';

export interface PromotionDetailBreadcrumbProps {
  viewMode: PromotionViewMode;
  selectedRegionName?: string;
  selectedPartnerName?: string;
  onBackToRegion: () => void;
  onBackToPartners: () => void;
}

const PromotionDetailBreadcrumb: React.FC<PromotionDetailBreadcrumbProps> = ({
  viewMode,
  selectedRegionName,
  selectedPartnerName,
  onBackToRegion,
  onBackToPartners,
}) => {
  if (viewMode !== 'partners' && viewMode !== 'detail') {
    return null;
  }

  return (
    <nav className={styles.breadcrumb} aria-label="面包屑导航">
      <button
        type="button"
        className={styles.breadcrumbItem}
        onClick={onBackToRegion}
        aria-label="返回地区总览"
      >
        地区总览
      </button>
      <IconPromotionDetailChevronRight className={styles.breadcrumbSep} width={12} height={12} />
      {viewMode === 'detail' ? (
        <>
          <button
            type="button"
            className={styles.breadcrumbItem}
            onClick={onBackToPartners}
            aria-label={`返回${selectedRegionName ?? ''}合伙人列表`}
          >
            {selectedRegionName}
          </button>
          <IconPromotionDetailChevronRight className={styles.breadcrumbSep} width={12} height={12} />
          <span className={styles.breadcrumbCurrent}>{selectedPartnerName}</span>
        </>
      ) : (
        <span className={styles.breadcrumbCurrent}>{selectedRegionName}</span>
      )}
    </nav>
  );
};

export default PromotionDetailBreadcrumb;
