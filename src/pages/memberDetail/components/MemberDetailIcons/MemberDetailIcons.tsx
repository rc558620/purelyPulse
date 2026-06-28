// 会员详情页图标集合。
import type React from 'react';
import type { MembershipDuration, RechargeRecord } from '../../memberDetail.types';

type SvgProps = React.SVGProps<SVGSVGElement>;

interface IconPaymentChannelProps extends SvgProps {
  /** 支付渠道类型。 */
  channel: RechargeRecord['channel'];
}

interface IconMembershipDurationProps extends SvgProps {
  /** 会员时长类型，扩展支持 free。 */
  duration: MembershipDuration | 'free';
}

/** 星标徽章：积分、会员等级与高亮入口。 */
export const IconStarBadge = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.2} {...props}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

/** 豆形硬币：纯利豆与资产余额。 */
export const IconBeanCoin = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.2} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 8.5c.8-1 2-1.5 3.5-1.5 2.5 0 4 1.5 4 3.5 0 1.5-.8 2.5-2 3" />
    <circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);

/** 关闭叉号：弹窗关闭。 */
export const IconClose = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.5} {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/** 横向前进箭头：余额与时间预览的前后态。 */
export const IconArrowRight = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <path d="M5 12h14" />
    <path d="M12 5l7 7-7 7" />
  </svg>
);

/** 勾选确认：提交、选中与成功确认。 */
export const IconCheck = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2.5} {...props}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/** 加号操作：积分与纯利豆快捷调整。 */
export const IconPlus = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2.5} {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

/** 会员群组：邀请与推广数量展示。 */
export const IconMembers = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth={2.2} {...props}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

/** 银行卡：充值记录与支付凭证。 */
export const IconBankCard = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2.2} {...props}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
  </svg>
);

/** 消息气泡：备注与文本说明。 */
export const IconMessageBubble = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2.5} {...props}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

/** 安全盾牌：恢复权限与安全状态。 */
export const IconShieldCheck = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2.3} {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

/** 禁用圆标：封禁状态与危险操作。 */
export const IconBanCircle = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2.3} {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M4.93 4.93l14.14 14.14" />
  </svg>
);

/** 信息圆点：说明、提示与帮助反馈。 */
export const IconInfoCircle = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2.2} {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

/** 警告三角：永久会员降级与风险提示。 */
export const IconWarningTriangle = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.2} {...props}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

/** 圆形上箭头：会员等级确认的二次确认图标。 */
export const IconCircleChevronUp = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={48} height={48} fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="16 12 12 8 8 12" />
  </svg>
);

/** 支付渠道：充值记录渠道的语义化图标。 */
export const IconPaymentChannel = ({ channel, ...props }: IconPaymentChannelProps): React.JSX.Element => {
  if (channel === 'wechat') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} {...props}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="8.5 12 11 14.5 15.5 9.5" />
      </svg>
    );
  }

  if (channel === 'alipay') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} {...props}>
        <circle cx="12" cy="12" r="10" />
        <path d="M8 8h8" />
        <path d="M7 12h10" />
        <path d="M10 16l5-8" />
      </svg>
    );
  }

  return <IconBankCard width={18} height={18} strokeWidth={2} {...props} />;
};

/** 子账号管理：子账号能力入口。 */
export const IconSubAccount = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2} {...props}>
    <circle cx="9" cy="7" r="3" />
    <path d="M4 20v-1a5 5 0 0 1 5-5h1" />
    <circle cx="17" cy="16" r="2.5" />
    <path d="M17 13.5V11" />
    <path d="M17 18.5V21" />
    <path d="M14.5 16H12" />
    <path d="M19.5 16H22" />
  </svg>
);

/** 收银员角色：cashier 子账号标识。 */
export const IconCashierRole = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2} {...props}>
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 3h-8l-2 4h12l-2-4z" />
    <path d="M12 12v3" />
    <path d="M10 13h4" />
  </svg>
);

/** 财务角色：finance 子账号标识。 */
export const IconFinanceRole = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2} {...props}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
    <path d="M6 15h2" />
    <path d="M10 15h6" />
  </svg>
);

/** 店长角色：manager 子账号标识。 */
export const IconManagerRole = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2} {...props}>
    <circle cx="12" cy="7" r="3" />
    <path d="M5 21v-1a7 7 0 0 1 14 0v1" />
    <path d="M9 11l1.5 1.5L15 8" />
  </svg>
);

/** 会员运营概览：查看 purelyClub C 端运营情况入口。 */
export const IconClubStats = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2} {...props}>
    <path d="M3 3v18h18" />
    <path d="M7 16l4-4 4 4 4-4" />
  </svg>
);

/** 顾客在途余额：储值类资金流动指示。 */
export const IconWallet = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2.2} {...props}>
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
  </svg>
);

/** 充值总额：累计储值金额。 */
export const IconRechargeTotal = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2.2} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 8h5a2 2 0 0 1 0 4H9v4h6" />
    <path d="M12 6v2m0 8v2" />
  </svg>
);

/** 会员人数：C 端用户群体总量。 */
export const IconClubMembers = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2.2} {...props}>
    <circle cx="9" cy="7" r="4" />
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
  </svg>
);

/** 充值笔数：累计交易次数。 */
export const IconRechargeCount = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2.2} {...props}>
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1" />
    <path d="M9 12h6" />
    <path d="M9 16h4" />
  </svg>
);

/** 今日储值：日历单日视图。 */
export const IconCalendarDay = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2.2} {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
    <path d="M12 14v4m0-4h.01" />
  </svg>
);

/** 本月储值：日历月视图。 */
export const IconCalendarMonth = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2.2} {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
    <path d="M7 14h2m4 0h2M7 18h2m4 0h2" />
  </svg>
);

/** 本年储值：日历全年视图。 */
export const IconCalendarYear = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2.2} {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
    <path d="M8 14l2 2 4-4" />
  </svg>
);

/** 本季储值：日历四分之一标记（季度视图）。 */
export const IconCalendarQuarter = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2.2} {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
    <path d="M7 15h4v3H7z" />
    <path d="M13 14l2 1.5L13 17" />
  </svg>
);

/** 去年储值：日历带历史箭头（上一年视图）。 */
export const IconCalendarLastYear = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2.2} {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
    <path d="M7 17l2-3h4l2 3" />
    <path d="M12 14v-1" />
  </svg>
);

/** 营业销售额：收银台/POS 收入入口。 */
export const IconSalesRevenue = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.2} {...props}>
    <path d="M3 3v18h18" />
    <path d="M7 12l4-4 4 4 4-4" />
    <circle cx="7" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="11" cy="8" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="15" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="19" cy="8" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

/** 营业利润：净盈余/毛利指示。 */
export const IconProfitCoin = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.2} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 9h5a2 2 0 0 1 0 4H9v4" />
    <path d="M12 6v2m0 8v2" />
  </svg>
);

/** 营业趋势柱状图：营业详情弹窗入口。 */
export const IconSalesBarChart = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.2} {...props}>
    <rect x="3" y="12" width="4" height="9" rx="1" />
    <rect x="10" y="7" width="4" height="14" rx="1" />
    <rect x="17" y="4" width="4" height="17" rx="1" />
    <path d="M2 21h20" />
  </svg>
);

/** 等级分布：各等级会员占比示意。 */
export const IconLevelPie = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2.2} {...props}>
    <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
    <path d="M22 12A10 10 0 0 0 12 2v10z" />
  </svg>
);

/** 注销账号：不可逆账号删除危险操作。 */
export const IconUserMinus = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2} {...props}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="22" y1="11" x2="16" y2="11" />
  </svg>
);

/** 危险警示：不可逆操作的二次确认标识。 */
export const IconAlertOctagon = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

/** 槽位格子：子账号配额格子指示。 */
export const IconSlotGrid = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

/** 锁定：无资格或不可操作状态。 */
export const IconLock = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2} {...props}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

/** 用户轮廓：免费会员默认状态图标。 */
export const IconUserCircle = (props: SvgProps): React.JSX.Element => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="8" r="3" />
    <path d="M6.168 18.849A4.001 4.001 0 0 1 10 16h4a4.001 4.001 0 0 1 3.832 2.849" />
  </svg>
);

/** 会员时长：不同订阅类型的区分图标。 */
export const IconMembershipDuration = ({ duration, ...props }: IconMembershipDurationProps): React.JSX.Element => {
  if (duration === 'free') {
    return <IconUserCircle width={16} height={16} strokeWidth={2} {...props} />;
  }

  if (duration === 'monthly') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} {...props}>
        <path d="M8 6h13" />
        <path d="M8 12h13" />
        <path d="M8 18h13" />
        <path d="M3 6h.01" />
        <path d="M3 12h.01" />
        <path d="M3 18h.01" />
      </svg>
    );
  }

  if (duration === 'quarterly') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} {...props}>
        <path d="M4 6l8-3 8 3v6c0 5.25-8 8-8 8S4 17.25 4 12V6z" />
      </svg>
    );
  }

  if (duration === 'annual') {
    return <IconStarBadge width={16} height={16} strokeWidth={2} {...props} />;
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M18 8c-2.21 0-4 1.79-6 4-2-2.21-3.79-4-6-4-2.21 0-4 1.79-4 4s1.79 4 4 4c2.21 0 4-1.79 6-4 2 2.21 3.79 4 6 4 2.21 0 4-1.79 4-4s-1.79-4-4-4z" />
    </svg>
  );
};
