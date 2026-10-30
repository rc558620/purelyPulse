// DatePickerPanelContent — 面板内容（移动端 BottomSheet 与 PC 下拉共用）
// month 模式渲染 MonthPickerView，date / datetime 模式渲染 CalendarView

import React, { memo } from 'react';
import CalendarView    from './CalendarView';
import MonthPickerView from './MonthPickerView';

export interface DatePickerPanelContentProps {
  /** 是否 month 模式 */
  isMonthMode: boolean;
  /** 是否 datetime 模式 */
  isDatetimeMode: boolean;
  /** 当前选中值（受控值或非受控内部值） */
  currentValue: string | null;
  /** datetime 临时日期 "YYYY-MM-DD" */
  tempDate: string;
  /** datetime 临时时间 "HH:mm" */
  tempTime: string;
  /** datetime 临时时间写入（非 datetime 模式下时间列只更新本地状态） */
  setTempTime: (t: string) => void;
  maxDate?: string;
  minDate?: string;
  hideToday: boolean;
  showConfirm: boolean;
  disabledHours?: () => number[];
  disabledMinutes?: (hour: number) => number[];
  /** showConfirm 且无已选值时的默认预选日期 */
  defaultPending?: string;
  /** 提交值 */
  onChange: (val: string | null) => void;
  /** datetime 模式：选中日期（立即提交） */
  onDatetimeDateSelect: (dateStr: string) => void;
  /** datetime 模式：时间变更（立即提交） */
  onDatetimeTimeChange: (t: string) => void;
  /** 「此刻」按钮 */
  onNow: () => void;
  /** 「确定」按钮 */
  onConfirm: () => void;
  /** 关闭面板 */
  onClose: () => void;
}

const DatePickerPanelContent: React.FC<DatePickerPanelContentProps> = memo(({
  isMonthMode,
  isDatetimeMode,
  currentValue,
  tempDate,
  tempTime,
  setTempTime,
  maxDate,
  minDate,
  hideToday,
  showConfirm,
  disabledHours,
  disabledMinutes,
  defaultPending,
  onChange,
  onDatetimeDateSelect,
  onDatetimeTimeChange,
  onNow,
  onConfirm,
  onClose,
}) => {
  if (isMonthMode) {
    return (
      <MonthPickerView
        selected={currentValue}
        maxMonth={maxDate}
        minMonth={minDate}
        onSelect={onChange}
        onClose={onClose}
      />
    );
  }

  return (
    <CalendarView
      maxDate={maxDate}
      minDate={minDate}
      isDatetime={isDatetimeMode}
      time={tempTime}
      onTimeChange={isDatetimeMode ? onDatetimeTimeChange : setTempTime}
      onNow={isDatetimeMode ? onNow : undefined}
      onConfirm={isDatetimeMode ? onConfirm : undefined}
      hideToday={hideToday}
      showConfirm={showConfirm}
      defaultPending={defaultPending}
      disabledHours={disabledHours}
      disabledMinutes={disabledMinutes}
      selected={isDatetimeMode ? tempDate || null : currentValue}
      onSelect={isDatetimeMode ? onDatetimeDateSelect : onChange}
      // datetime 模式由「确定」/ 外部关闭统一收口，日历内部点击不触发关闭
      onClose={isDatetimeMode ? () => {} : onClose}
    />
  );
});

DatePickerPanelContent.displayName = 'DatePickerPanelContent';

export default DatePickerPanelContent;
