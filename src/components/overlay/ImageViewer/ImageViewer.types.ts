// 图片查看器 - 对外类型定义
export interface ImageViewerProps {
  /** 图片地址列表，保持调用方的展示顺序 */
  images: string[];
  /** 打开时展示的第几张，默认 0 */
  initialIndex?: number;
  /** 是否展示（调用方持有开关状态） */
  visible: boolean;
  onClose: () => void;
}
