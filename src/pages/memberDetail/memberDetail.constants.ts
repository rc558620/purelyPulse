import type { RechargeRecord } from './memberDetail.types';

/** 充值渠道显示文案。 */
export const MEMBER_RECHARGE_CHANNEL_LABEL: Record<RechargeRecord['channel'], string> = {
  wechat: '微信支付',
  alipay: '支付宝',
  card: '礼品卡',
};

/** 封禁原因预设选项。 */
export const MEMBER_BAN_REASON_OPTIONS = [
  '违规操作',
  '账号异常',
  '恶意刷单',
  '违反用户协议',
  '欺诈行为',
  '其他',
] as const;
