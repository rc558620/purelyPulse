// DayPickerPcDropdown — PC 端下拉面板
//
// 绝对定位，通过 CSS 动画控制入场（dropdownIn）/ 退场（dropdownClosing）。
// 自身只负责 UI 渲染，状态由 useDayPickerState 注入。
import React, { memo } from 'react';
import classNames from 'classnames';
import MemoPickerColumn from '@components/form/_shared/PickerColumn';
import { pad2 } from '@components/form/_shared/pickerUtils';
import useDayPickerState from './useDayPickerState';
import styles from './DayPicker.module.less';

export interface DayPickerPcDropdownProps {
  year:           number;
  month:          number;
  day:            number;
  pastYears?:     number;
  futureYears?:   number;
  isClosing:      boolean;
  onConfirm:      (year: number, month: number, day: number) => void;
  onClose:        () => void;
  onAnimationEnd: () => void;
}

const DayPickerPcDropdown: React.FC<DayPickerPcDropdownProps> = ({
  year,
  month,
  day,
  pastYears,
  futureYears,
  isClosing,
  onConfirm,
  onClose,
  onAnimationEnd,
}) => {
  const {
    selYear, selMonth, selDay,
    years, months, days,
    setSelYear, setSelMonth, setRawDay,
    handleConfirm, handleToday,
  } = useDayPickerState({ year, month, day, pastYears, futureYears, onConfirm, onClose });

  return (
    <div
      className={classNames(styles.dropdown, isClosing && styles.dropdownClosing)}
      onAnimationEnd={onAnimationEnd}
      role="dialog"
      aria-modal="true"
      aria-label="选择年月日"
    >
      <div className={styles.panel}>
        <div className={styles.panelBody}>
          <MemoPickerColumn
            items={years}
            selected={selYear}
            onSelect={setSelYear}
            label="年"
            formatItem={n => String(n)}
            styles={styles}
          />
          <MemoPickerColumn
            items={months}
            selected={selMonth}
            onSelect={setSelMonth}
            label="月"
            formatItem={pad2}
            styles={styles}
          />
          <MemoPickerColumn
            items={days}
            selected={selDay}
            onSelect={setRawDay}
            label="日"
            formatItem={pad2}
            styles={styles}
          />
        </div>

        <div className={styles.panelFooter}>
          <button type="button" className={styles.footerNow} onClick={handleToday}>
            今天
          </button>
          <button type="button" className={styles.footerConfirm} onClick={handleConfirm}>
            确 定
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(DayPickerPcDropdown);
