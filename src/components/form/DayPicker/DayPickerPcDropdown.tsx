// DayPickerPcDropdown — PC 端下拉面板
//
// 通过 createPortal 挂到 body，规避父容器 overflow:hidden 的定位干扰。
// 坐标通过 CSS 自定义属性（--dp-top / --dp-left / --dp-min-width）注入，
// 面板通过 var() 消费，避免内联样式直接写入 JSX。
// 自身只负责 UI 渲染，状态由 useDayPickerState 注入。
import React, { memo } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import { safeNum } from '@utils/utils';
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
  /** 触发器的位置信息，用于 fixed 定位对齐 */
  triggerRect:    DOMRect;
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
  triggerRect,
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

  // 通过 CSS 自定义属性传递定位坐标，规避直接内联样式
  // safeNum 确保坐标为有效有限数，防止 NaN/Infinity 造成定位异常
  const cssVars = {
    '--dp-top':       `${safeNum(triggerRect.bottom) + 6}px`,
    '--dp-left':      `${safeNum(triggerRect.left)}px`,
    '--dp-min-width': `${safeNum(triggerRect.width)}px`,
  } as React.CSSProperties;

  const panel = (
    <div
      className={classNames(styles.dropdownPortal, isClosing && styles.dropdownClosing)}
      style={cssVars}
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

  return createPortal(panel, document.body);
};

export default memo(DayPickerPcDropdown);
