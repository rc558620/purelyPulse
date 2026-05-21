// 推广详情视图状态 hook：负责层级切换、选中项与标题派生。
import { useCallback, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type {
  PromotionPartnerItem,
  PromotionPeriodTab,
  PromotionRegionItem,
  PromotionViewMode,
} from '../promotionDetail.types';

export interface UsePromotionDetailViewStateReturn {
  viewMode: PromotionViewMode;
  selectedRegion: PromotionRegionItem | null;
  selectedPartner: PromotionPartnerItem | null;
  periodTab: PromotionPeriodTab;
  pageTitle: string;
  resetViewState: () => void;
  handleRegionClick: (regionItem: PromotionRegionItem) => void;
  handlePartnerClick: (partner: PromotionPartnerItem) => void;
  handleBreadcrumbBack: (target: PromotionViewMode) => void;
  setPeriodTab: Dispatch<SetStateAction<PromotionPeriodTab>>;
}

export const usePromotionDetailViewState = (): UsePromotionDetailViewStateReturn => {
  const [viewMode, setViewMode] = useState<PromotionViewMode>('region');
  const [selectedRegion, setSelectedRegion] = useState<PromotionRegionItem | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<PromotionPartnerItem | null>(null);
  const [periodTab, setPeriodTab] = useState<PromotionPeriodTab>('month');

  const pageTitle = useMemo(() => {
    if (viewMode === 'detail') {
      return `${selectedPartner?.name ?? ''} 的推广详情`;
    }

    if (viewMode === 'partners') {
      return `${selectedRegion?.province ?? ''} · 合伙人`;
    }

    return '推广详情';
  }, [selectedPartner?.name, selectedRegion?.province, viewMode]);

  const resetViewState = useCallback((): void => {
    setViewMode('region');
    setSelectedRegion(null);
    setSelectedPartner(null);
    setPeriodTab('month');
  }, []);

  const handleRegionClick = useCallback((regionItem: PromotionRegionItem): void => {
    setSelectedRegion(regionItem);
    setSelectedPartner(null);
    setViewMode('partners');
  }, []);

  const handlePartnerClick = useCallback((partner: PromotionPartnerItem): void => {
    setSelectedPartner(partner);
    setPeriodTab('month');
    setViewMode('detail');
  }, []);

  const handleBreadcrumbBack = useCallback((target: PromotionViewMode): void => {
    if (target === 'region') {
      setViewMode('region');
      setSelectedRegion(null);
      setSelectedPartner(null);
      return;
    }

    if (target === 'partners') {
      setViewMode('partners');
      setSelectedPartner(null);
    }
  }, []);

  return {
    viewMode,
    selectedRegion,
    selectedPartner,
    periodTab,
    pageTitle,
    resetViewState,
    handleRegionClick,
    handlePartnerClick,
    handleBreadcrumbBack,
    setPeriodTab,
  };
};
