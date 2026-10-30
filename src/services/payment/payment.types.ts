// 统一支付层类型：客户端支付链路共用的下单结果与状态结构
//
// 本文件只声明结构，不做数值兜底：金额等数值字段的展示一律由展示层用 safeNum / fmtAmount 处理。
// 金额一律由后端计算返回，前端不做任何业务金额运算。

/** 支付模式：test=测试模式（未真实扣款）/ live=真实模式（需真实付款） */
export type PaymentMode = 'test' | 'live';

/** 支付单状态（与后端支付单状态同口径） */
export type PaymentStatus = 'pending' | 'paid' | 'closed' | 'failed';

/** 下单结果 */
export interface PaymentOrder {
  /** 本次落单的支付模式 */
  mode: PaymentMode;
  /** 平台支付单号；测试模式可能为 null */
  orderNo: string | null;
  /** 微信 Native 二维码链接（weixin:// 协议串，不可直接当图片展示）；测试模式为 null */
  codeUrl: string | null;
  /**
   * 后端把 codeUrl 渲染出的 PNG data URL，前端可直接 <img src> 展示。
   * 后端出图而不是前端渲染：既避免依赖第三方在线生成服务泄露支付链接，
   * 也让前端保持「只展示、不加工」。
   */
  qrCodeImageUrl: string | null;
  /** 应付金额（分），一律由后端计算返回 */
  amountFen: number;
  /** 支付单过期时间（ISO 字符串）；测试模式为 null */
  expiresAt: string | null;
}

/** 支付状态轮询结果 */
export interface PaymentStatusResult {
  /** 当前支付单状态 */
  status: PaymentStatus;
  /** 支付完成时间（ISO 字符串）；未支付为 null */
  paidAt: string | null;
}
