// 通用支付二维码弹窗入参：三条商家端支付链路共用
import type { ReactNode } from 'react';
import type { PaymentOrder, PaymentStatus } from '@services/payment';

export interface PaymentQrModalProps {
  /** 待支付订单；null 表示弹窗关闭（同时由调用方停止轮询） */
  payment: PaymentOrder | null;
  /** 当前支付状态；null 表示尚未开始轮询 */
  status: PaymentStatus | null;
  /** 弹窗标题（如「额度充值」「开通年度会员」） */
  title: string;
  /** 标题图标：由调用方按自己的图标集提供 */
  icon: ReactNode;
  /** 金额展示文案，由调用方用后端返回的金额格式化得到，组件不做任何计算 */
  amountText: string;
  /** 关闭弹窗 */
  onClose: () => void;
  /** 支付成功后的补充提示，可为空 */
  successHint?: string;
}
