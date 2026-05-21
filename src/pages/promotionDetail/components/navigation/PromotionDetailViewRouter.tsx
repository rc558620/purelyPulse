// 推广详情视图路由：根据页面层级分发地区、合伙人与详情区块。
import React from 'react';
import PromotionDetailPartnerDetailView, {
  type PromotionDetailPartnerDetailViewProps,
} from '../views/PromotionDetailPartnerDetailView';
import PromotionDetailPartnerView, {
  type PromotionDetailPartnerViewProps,
} from '../views/PromotionDetailPartnerView';
import PromotionDetailRegionView, {
  type PromotionDetailRegionViewProps,
} from '../views/PromotionDetailRegionView';
import type { PromotionViewMode } from '../../promotionDetail.types';

export interface PromotionDetailViewRouterProps {
  viewMode: PromotionViewMode;
  regionViewProps: PromotionDetailRegionViewProps;
  partnerViewProps: PromotionDetailPartnerViewProps | null;
  partnerDetailViewProps: PromotionDetailPartnerDetailViewProps | null;
}

const PromotionDetailViewRouter: React.FC<PromotionDetailViewRouterProps> = ({
  viewMode,
  regionViewProps,
  partnerViewProps,
  partnerDetailViewProps,
}) => {
  if (viewMode === 'detail' && partnerDetailViewProps) {
    return <PromotionDetailPartnerDetailView {...partnerDetailViewProps} />;
  }

  if (viewMode === 'partners' && partnerViewProps) {
    return <PromotionDetailPartnerView {...partnerViewProps} />;
  }

  return <PromotionDetailRegionView {...regionViewProps} />;
};

export default PromotionDetailViewRouter;
