// TimePickerPcDropdown — PC 端下拉面板
//
// 绝对定位，通过 CSS 动画控制入场（dropdownIn）/ 退场（dropdownClosing）。
// 自身只负责 UI 渲染，状态由 useTimePickerState 注入。
import React, { memo } from 'react';
import classNames from 'classnames';
import MemoPickerColumn from '@components/form/_shared/PickerColumn';
import { pad2, HOURS, MINUTES } from '@components/form/_shared/pickerUtils';
import useTimePickerState from './useTimePickerState';
import styles from './TimePicker.module.less';

export interface TimePickerPcDropdownProps {
  value:            string | null;
  isClosing:        boolean;
  onConfirm:        (val: string) => void;
  onClose:          () => void;
  onAnimationEnd:   () => void;
}

const TimePickerPcDropdown: React.FC<TimePickerPcDropdownProps> = ({
  value,
  isClosing,
  onConfirm,
  onClose,
  onAnimationEnd,
}) => {
  const { selH, selM, setSelH, setSelM, handleConfirm, handleNow } =
    useTimePickerState({ value, onConfirm, onClose });

  return (
    <div
      className={classNames(styles.dropdown, isClosing && styles.dropdownClosing)}
      onAnimationEnd={onAnimationEnd}
      role="dialog"
      aria-modal="true"
      aria-label="选择时间"
    >
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
  );
};

export default memo(TimePickerPcDropdown);
