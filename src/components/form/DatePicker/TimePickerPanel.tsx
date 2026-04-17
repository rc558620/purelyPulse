// TimePickerPanel — 时分双列滚动时间选择面板
import React, { useCallback, useMemo, memo } from 'react';
import ScrollColumn from './ScrollColumn';
import { HOURS, MINUTES, parseTime } from './utils';
import styles from './DatePicker.module.less';

export interface TimePickerPanelProps {
  /** 当前时间，格式 "HH:mm" */
  time: string;
  /** 时间变更回调 */
  onChange: (t: string) => void;
}

const TimePickerPanel: React.FC<TimePickerPanelProps> = memo(({ time, onChange }) => {
  const { hour, minute } = useMemo(() => parseTime(time), [time]);

  const handleHourChange = useCallback((idx: number) => {
    onChange(`${HOURS[idx]}:${String(minute).padStart(2, '0')}`);
  }, [minute, onChange]);

  const handleMinuteChange = useCallback((idx: number) => {
    onChange(`${String(hour).padStart(2, '0')}:${MINUTES[idx]}`);
  }, [hour, onChange]);

  return (
    <div className={styles.timePanel}>
      <ScrollColumn
        label="时"
        items={HOURS}
        selectedIndex={hour}
        onChange={handleHourChange}
      />
      <div className={styles.timeColon} aria-hidden="true" />
      <ScrollColumn
        label="分"
        items={MINUTES}
        selectedIndex={minute}
        onChange={handleMinuteChange}
      />
    </div>
  );
});

TimePickerPanel.displayName = 'TimePickerPanel';

export default TimePickerPanel;
