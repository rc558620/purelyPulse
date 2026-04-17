// DayPickerMobilePanel — 移动端底部 BottomSheet
//
// 通过 createPortal 挂到 body，规避父容器 overflow:hidden 裁剪。
// 仅在 visible（父层已 guard）时才挂载，入场即为展开状态。
// 自身只负责 UI 渲染，状态由 useDayPickerState 注入。
import React, { memo } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import MemoPickerColumn from '@components/form/_shared/PickerColumn';
import { pad2 } from '@components/form/_shared/pickerUtils';
import useDayPickerState from './useDayPickerState';
import styles from './DayPicker.module.less';

export interface DayPickerMobilePanelProps {
  year:          number;
  month:         number;
  day:           number;
  pastYears?:    number;
  futureYears?:  number;
  onConfirm:     (year: number, month: number, day: number) => void;
  onClose:       () => void;
}

const DayPickerMobilePanel: React.FC<DayPickerMobilePanelProps> = ({
  year,
  month,
  day,
  pastYears,
  futureYears,
  onConfirm,
  onClose,
}) => {
  const {
    selYear, selMonth, selDay,
    years, months, days,
    setSelYear, setSelMonth, setRawDay,
    handleConfirm, handleToday,
  } = useDayPickerState({ year, month, day, pastYears, futureYears, onConfirm, onClose });

  return createPortal(
    <>
      {/* 遮罩 */}
      <div className={styles.mask} onClick={onClose} aria-hidden="true" />

      {/* 底部弹层 */}
      <div
        className={classNames(styles.bottomSheet, styles.bottomSheetVisible)}
        role="dialog"
        aria-modal="true"
        aria-label="选择年月日"
      >
        {/* 头部 */}
        <div className={styles.sheetHeader}>
          <div className={styles.sheetHandle} aria-hidden="true" />
          <div className={styles.sheetTitleRow}>
            <button
              type="button"
              className={styles.sheetCancelBtn}
              onClick={onClose}
            >
              取消
            </button>
            <span className={styles.sheetTitle}>选择年月日</span>
            <div className={styles.sheetHeaderRight} />
          </div>
        </div>

        {/* 滚轮面板 */}
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
    </>,
    document.body,
  );
};

export default memo(DayPickerMobilePanel);
