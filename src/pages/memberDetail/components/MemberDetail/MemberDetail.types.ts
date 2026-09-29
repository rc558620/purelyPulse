// 会员详情主体类型：弹窗状态机、会员摘要派生与弹窗容器共用的数据结构。
import type { MemberDetail, MemberLevel } from '@pages/memberList/memberList.types';
import type { SubAccountBackfillState } from '../../memberDetail.utils';

/** 当前打开的弹窗；null 表示全部关闭。 */
export type MemberDetailActiveModal =
  | 'points'
  | 'beans'
  | 'membership'
  | 'renewalPrice'
  | 'status'
  | 'subAccount'
  | 'subAccountDetail'
  | 'clubStats'
  | 'salesStats'
  | 'cancelAccount'
  | null;

/** 由会员原始数据派生的展示态汇总。 */
export interface MemberDetailMemberSummary {
  /** 会员到期时间戳；永久会员缺到期时间时按最近一次充值推算。 */
  membershipExpiry: number | null | undefined;
  /** 到期文案（如「2026.10.01 到期 / 永久有效」）；免费会员不展示。 */
  membershipExpiryText: string | null;
  /**
   * 子账号加价的补录状态：会员级判定，不是某条记录的历史快照，
   * 子账号设置记录每行都用徽章区分「待补录 / 已补录」。
   */
  subAccountBackfillState: SubAccountBackfillState;
  /** 已补录的子账号加价展示值，用于把记录行展示成「10 个 = ¥1000」；未补录为 null。 */
  subAccountAddOnPriceDisplay: string | null;
}

/** 派生会员摘要所需的原始数据。 */
export interface MemberDetailMemberSummarySource {
  /** 会员详情；首屏加载中时为 null。 */
  member: MemberDetail | null;
  /** 当前会员等级。 */
  memberLevel: MemberLevel;
  /** 后端返回的会员到期时间。 */
  memberExpiry: number | null | undefined;
  /** 永久会员的有效天数配置。 */
  lifetimeMembershipDays: number;
}
