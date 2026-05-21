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
  /**
   * 返回需要禁用的小时列表（0-23）。
   * 用法同 antd：`disabledHours={() => [0, 1, 2, 3]}`
   */
  disabledHours?: () => number[];
  /**
   * 返回需要禁用的分钟列表（0-59）。
   * 用法同 antd：`disabledMinutes={(hour) => hour < 8 ? Array.from({length: 60}, (_, i) => i) : []}`
   */
  disabledMinutes?: (hour: number) => number[];
}

const TimePickerPanel: React.FC<TimePickerPanelProps> = memo(({
  time,
  onChange,
  disabledHours,
  disabledMinutes,
}) => {
  const { hour, minute } = useMemo(() => parseTime(time), [time]);

  // 计算禁用小时集合
  const disabledHourSet = useMemo<Set<number> | undefined>(() => {
    if (!disabledHours) return undefined;
    const list = disabledHours();
    return list.length > 0 ? new Set(list) : undefined;
  }, [disabledHours]);

  // 计算禁用分钟集合（依赖当前选中小时）
  const disabledMinuteSet = useMemo<Set<number> | undefined>(() => {
    if (!disabledMinutes) return undefined;
    const list = disabledMinutes(hour);
    return list.length > 0 ? new Set(list) : undefined;
  }, [disabledMinutes, hour]);

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
        disabledIndices={disabledHourSet}
      />
      <div className={styles.timeColon} aria-hidden="true" />
      <ScrollColumn
        label="分"
        items={MINUTES}
        selectedIndex={minute}
        onChange={handleMinuteChange}
        disabledIndices={disabledMinuteSet}
      />
    </div>
  );
});

TimePickerPanel.displayName = 'TimePickerPanel';

export default TimePickerPanel;
