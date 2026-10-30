// DatePicker — Props 类型定义
// 从 index.tsx 抽离，供 DatePicker 主组件与各子组件共用

import type { ReactNode } from 'react';

export interface DatePickerProps {
  /**
   * 选择器模式：
   * - `date`     = 选日期（默认），值格式 `"YYYY-MM-DD"`
   * - `month`    = 选月份，值格式 `"YYYY-MM"`
   * - `datetime` = 日期+时间，值格式 `"YYYY-MM-DD HH:mm"`
   */
  picker?: 'date' | 'month' | 'datetime';
  /** 受控值，null 表示无选中 */
  value?: string | null;
  /** 非受控默认值 */
  defaultValue?: string;
  /** 值变更回调，null 表示已清除 */
  onChange?: (val: string | null) => void;
  /** 占位文本（不传则按 picker 自动设置） */
  placeholder?: string;
  /** 最大可选日期/月份（含），格式同 picker */
  maxDate?: string;
  /** 最小可选日期/月份（含），格式同 picker */
  minDate?: string;
  /** 强制指定显示模式（不传则自动检测设备宽度） */
  displayMode?: 'mobile' | 'pc';
  /** 是否允许清除，默认 true */
  allowClear?: boolean;
  /** 禁用状态，默认 false */
  disabled?: boolean;
  /** 错误状态（输入框显示红色边框） */
  status?: 'error';
  /** 额外类名 */
  className?: string;
  /** 前缀图标（替换默认日历图标） */
  prefix?: ReactNode;
  /** 隐藏底部「今天」快捷按钮，默认 false */
  hideToday?: boolean;
  /** 在底部显示「确定」关闭按钮，默认 false */
  showConfirm?: boolean;
  /**
   * 返回需要禁用的小时数组（0-23），仅 `picker="datetime"` 时生效。
   * @example disabledHours={() => [0, 1, 2, 3, 22, 23]}
   */
  disabledHours?: () => number[];
  /**
   * 返回需要禁用的分钟数组（0-59），仅 `picker="datetime"` 时生效。
   * 接收当前选中的小时作为参数，可用于联动禁用。
   * @example disabledMinutes={(h) => h === 8 ? [0, 1, 2, 3, 4] : []}
   */
  disabledMinutes?: (hour: number) => number[];
  /** PC 端弹出位置：'top' | 'bottom'，默认 'bottom' */
  popupPlacement?: 'top' | 'bottom';
}
