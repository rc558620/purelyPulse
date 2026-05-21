import type { CascadeValue, CascaderOption } from '@components/form/CascaderView/types';
import type { FormInstance } from '@components/form';
import type { PromotionQueryMode } from '../../promotionDetail.types';

export type PromotionDetailQueryFormDTO = {
  name: string;
};

export interface PromotionDetailFilterPanelProps {
  form: FormInstance<PromotionDetailQueryFormDTO>;
  isLoading: boolean;
  isDateRangeValid: boolean;
  queryMode: PromotionQueryMode;
  regionValues: CascadeValue[];
  regionOptions: CascaderOption[];
  dayYear: number;
  dayMonth: number;
  dayDay: number;
  rangeStartYear: number;
  rangeStartMonth: number;
  rangeStartDay: number;
  rangeEndYear: number;
  rangeEndMonth: number;
  rangeEndDay: number;
  hasSearched: boolean;
  showEmptyState: boolean;
  onSubmit: (values: PromotionDetailQueryFormDTO) => void;
  onSubmitFailed: () => void;
  onReset: () => void;
  onRegionChange: (value: CascadeValue[]) => void;
  onQueryModeChange: (mode: PromotionQueryMode) => void;
  onDayChange: (year: number, month: number, day: number) => void;
  onDayClear: () => void;
  onRangeStartChange: (year: number, month: number, day: number) => void;
  onRangeEndChange: (year: number, month: number, day: number) => void;
  onRangeClear: () => void;
  onRetry: () => void;
}
