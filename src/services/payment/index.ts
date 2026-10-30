// 统一支付层出口（客户端）
//
// 当前只落类型契约：下单与状态轮询链路尚未接入本仓库，
// 因此这里不导出任何请求函数，避免页面层误以为已有可用的支付接口。
export type {
  PaymentMode,
  PaymentOrder,
  PaymentStatus,
  PaymentStatusResult,
} from './payment.types';
