// 日期模式字段：负责日期筛选方式切换与对应日期输入区块。
import React from 'react';
import DayPicker from '@components/form/DayPicker';
import DateRangePicker from '@components/form/DateRangePicker/DateRangePicker';
import { cx, safeNum } from '@utils/utils';
import {
  IconPromotionDetailCalendar,
  IconPromotionDetailDayTab,
  IconPromotionDetailTrendUp,
} from '../_shared/icons/PromotionDetailIcons';
import styles from '../../promotionDetail.module.less';
import type { PromotionQueryMode } from '../../promotionDetail.types';

export interface PromotionDetailDateModeFieldProps {
  queryMode: PromotionQueryMode;
  isDateRangeValid: boolean;
  dayYear: number;
  dayMonth: number;
  dayDay: number;
  rangeStartYear: number;
  rangeStartMonth: number;
  rangeStartDay: number;
  rangeEndYear: number;
  rangeEndMonth: number;
  rangeEndDay: number;
  onQueryModeChange: (mode: PromotionQueryMode) => void;
  onDayChange: (year: number, month: number, day: number) => void;
  onDayClear: () => void;
  onRangeStartChange: (year: number, month: number, day: number) => void;
  onRangeEndChange: (year: number, month: number, day: number) => void;
  onRangeClear: () => void;
}

const PromotionDetailDateModeField: React.FC<PromotionDetailDateModeFieldProps> = ({
  queryMode,
  isDateRangeValid,
  dayYear,
  dayMonth,
  dayDay,
  rangeStartYear,
  rangeStartMonth,
  rangeStartDay,
  rangeEndYear,
  rangeEndMonth,
  rangeEndDay,
  onQueryModeChange,
  onDayChange,
  onDayClear,
  onRangeStartChange,
  onRangeEndChange,
  onRangeClear,
}) => (
  <>
    <div className={styles.fieldGroup}>
      <div className={styles.fieldLabel}>
        <IconPromotionDetailCalendar />
        日期筛选方式
      </div>
      <div className={styles.modeSwitchRow}>
        <button
          type="button"
          className={cx(styles.modeBtn, queryMode === 'day' && styles.modeBtnActive)}
          onClick={() => onQueryModeChange('day')}
          aria-pressed={queryMode === 'day'}
        >
          <IconPromotionDetailDayTab width={13} height={13} />
          选择年月日
        </button>
        <button
          type="button"
          className={cx(styles.modeBtn, queryMode === 'range' && styles.modeBtnActive)}
          onClick={() => onQueryModeChange('range')}
          aria-pressed={queryMode === 'range'}
        >
          <IconPromotionDetailTrendUp />
          日期范围
        </button>
      </div>
    </div>

    {queryMode === 'day' ? (
      <div className={styles.fieldGroup}>
        <div className={styles.fieldSubLabel}>选择年月日</div>
        <DayPicker
          year={safeNum(dayYear)}
          month={safeNum(dayMonth)}
          day={safeNum(dayDay)}
          onChange={onDayChange}
          onClear={onDayClear}
        />
      </div>
    ) : null}

    {queryMode === 'range' ? (
      <div className={styles.fieldGroup}>
        <div className={styles.fieldSubLabel}>选择日期范围</div>
        {!isDateRangeValid ? (
          <div className={styles.dateRangeError}>结束日期不能早于开始日期</div>
        ) : null}
        <DateRangePicker
          startYear={safeNum(rangeStartYear)}
          startMonth={safeNum(rangeStartMonth)}
          startDay={safeNum(rangeStartDay)}
          endYear={safeNum(rangeEndYear)}
          endMonth={safeNum(rangeEndMonth)}
          endDay={safeNum(rangeEndDay)}
          onStartChange={onRangeStartChange}
          onEndChange={onRangeEndChange}
          onClear={onRangeClear}
        />
      </div>
    ) : null}
  </>
);

export default PromotionDetailDateModeField;
