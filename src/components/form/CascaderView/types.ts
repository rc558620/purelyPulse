// src/components/CascadePickerView/types.ts

export type CascadeValue = string | number;

export type CascadeOption = {
  label: string;
  value: CascadeValue;
  disabled?: boolean;
  children?: CascadeOption[];
};

/** @alias CascadeOption - 兼容别名 */
export type CascaderOption = CascadeOption;

export interface CascadePickerViewProps {
  options: CascadeOption[];
  value?: CascadeValue[];
  defaultValue?: CascadeValue[];
  onChange?: (value: CascadeValue[]) => void;
  placeholder?: string;
  onVisibleChange?: (visible: boolean) => void;
  visible?: boolean;
  /** 强制指定显示模式，不指定则自动检测 */
  mode?: 'mobile' | 'pc';
  /** 输入状态，FormItem 校验失败时注入 'error' */
  status?: 'error' | undefined;
  /** 输入框前缀内容（图标等） */
  prefix?: React.ReactNode;
  /** 是否允许清除，默认 false */
  allowClear?: boolean;
  /** 自定义根节点 className */
  className?: string;
  /** 自定义输入框内联样式（如调整高度） */
  inputStyle?: React.CSSProperties;
}
