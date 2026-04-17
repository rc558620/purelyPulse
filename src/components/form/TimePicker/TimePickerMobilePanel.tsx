// TimePickerMobilePanel — 移动端底部 BottomSheet
//
// 通过 createPortal 挂到 body，规避父容器 overflow:hidden 裁剪。
// 仅在 visible（父层已 guard）时才挂载，入场即为展开状态。
// 自身只负责 UI 渲染，状态由 useTimePickerState 注入。
import React, { memo } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import MemoPickerColumn from '@components/form/_shared/PickerColumn';
import { pad2, HOURS, MINUTES } from '@components/form/_shared/pickerUtils';
import useTimePickerState from './useTimePickerState';
import styles from './TimePicker.module.less';

export interface TimePickerMobilePanelProps {
  value:   string | null;
  onConfirm: (val: string) => void;
  onClose: () => void;
}

const TimePickerMobilePanel: React.FC<TimePickerMobilePanelProps> = ({
  value,
  onConfirm,
  onClose,
}) => {
  const { selH, selM, setSelH, setSelM, handleConfirm, handleNow } =
    useTimePickerState({ value, onConfirm, onClose });

  return createPortal(
    <>
      {/* 遮罩 */}
      <div className={styles.mask} onClick={onClose} aria-hidden="true" />

      {/* 底部弹层 */}
      <div
        className={classNames(styles.bottomSheet, styles.bottomSheetVisible)}
        role="dialog"
        aria-modal="true"
        aria-label="选择时间"
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
            <span className={styles.sheetTitle}>选择时间</span>
            <div className={styles.sheetHeaderRight} />
          </div>
        </div>

        {/* 滚轮面板 */}
        <div className={styles.panel}>
          <div className={styles.panelBody}>
            <MemoPickerColumn
              items={HOURS}
              selected={selH}
              onSelect={setSelH}
              label="时"
              formatItem={pad2}
              styles={styles}
            />
            <MemoPickerColumn
              items={MINUTES}
              selected={selM}
              onSelect={setSelM}
              label="分"
              formatItem={pad2}
              styles={styles}
            />
          </div>

          <div className={styles.panelFooter}>
            <button type="button" className={styles.footerNow} onClick={handleNow}>
              此刻
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

export default memo(TimePickerMobilePanel);
