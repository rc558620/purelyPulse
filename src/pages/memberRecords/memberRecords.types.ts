// 会员记录管理页类型定义。
//
// 页面语义与会员详情「记录设置模块」一致：把四类留痕聚合成一个跨会员的时间轴，
// 四类记录的字段口径各不相同，在 MemberRecordItem 里拍平成统一行结构：
// - 充值记录 / 会员等级设置记录：有金额与积分语义（channel 区分支付渠道 / 计入收入 / 赠送）
// - 调整续费记录：无金额流水，只有「此前价 → 新价」的留痕
// - 子账号设置记录：无金额流水，只有「原额度 → 新额度」的留痕
import type { RechargeRecord } from '@pages/memberList/memberList.types';

/** 记录类型：与会员详情记录面板的四个 tab 一一对应。 */
export type MemberRecordType = 'recharge' | 'adminGrant' | 'renewalAdjust' | 'subAccount';

/** 记录类型筛选值（含默认「全部」）。 */
export type MemberRecordTypeFilter = 'all' | MemberRecordType;

/** 会员等级筛选值（含默认「全部」）。 */
export type MemberRecordLevelFilter = 'all' | 'lifetime' | 'annual' | 'quarterly' | 'monthly' | 'free';

/**
 * 日期值：`YYYY-MM-DD`，null 表示未选（全局 DatePicker 的值形态）。
 *
 * 三个日期框（单独日期 / 开始日期 / 结束日期）互斥生效：
 * 同时下发两组日期会让「到底查哪天」产生歧义，所以始终只有一组有值，
 * 选中一组时另一组由 Hook 自动清空，后端拿到的永远是一个确定的口径。
 */
export type MemberRecordDateValue = string | null;

/** 筛选项（表单态）：全部为受控值，任意时刻都能直接渲染。 */
export interface MemberRecordsFilterState {
  /** 会员手机号（模糊匹配）。 */
  phone: string;
  /** 会员姓名（模糊匹配）。 */
  name: string;
  /** 单独日期：只查这一天的记录；默认今天。 */
  singleDate: MemberRecordDateValue;
  /** 日期范围起始：可空（只填一端表示「从这天起」）。 */
  rangeStart: MemberRecordDateValue;
  /** 日期范围结束：可空（只填一端表示「到这天止」）。 */
  rangeEnd: MemberRecordDateValue;
  /** 会员等级；默认全部等级。 */
  level: MemberRecordLevelFilter;
  /** 记录类型；默认全部记录。 */
  type: MemberRecordTypeFilter;
}

/**
 * 查询参数（下发态）。
 *
 * 与筛选项分离：只有点击「查询」才把表单态转成查询态触发请求，
 * 否则每敲一个字符都会打一次接口。
 */
export interface MemberRecordsQuery {
  phone: string;
  name: string;
  /** 单独日期（YYYY-MM-DD）；范围模式下为 null。 */
  date: string | null;
  /** 开始日期（YYYY-MM-DD）；单独日期模式下为 null。 */
  startDate: string | null;
  /** 结束日期（YYYY-MM-DD）；单独日期模式下为 null。 */
  endDate: string | null;
  level: MemberRecordLevelFilter;
  type: MemberRecordTypeFilter;
}

/** 时间轴上的一行会员记录。 */
export interface MemberRecordItem {
  /** 记录 id。 */
  id: string;
  /** 记录类型。 */
  type: MemberRecordType;
  /** 会员 id。 */
  memberId: string;
  /** 会员姓名。 */
  memberName: string;
  /** 会员手机号。 */
  memberPhone: string;
  /** 套餐 / 档位展示名（充值、等级设置、调整续费有值）。 */
  planName: string;
  /** 金额展示值（后端返回的元字符串）；无金额语义时为 null。 */
  amountDisplay: string | null;
  /** 本次充值 / 设置赠送的积分；无积分语义时为 0。 */
  pointsAwarded: number;
  /** 支付渠道；非充值类记录为 null。 */
  channel: RechargeRecord['channel'] | null;
  /** 操作人名称；系统写入或历史数据缺失时为 null。 */
  operatorName: string | null;
  /** 变更前展示值（改价前的议定价 / 变更前的额度）。 */
  oldValueDisplay: string | null;
  /** 变更后展示值（新的议定价 / 变更后的额度）。 */
  newValueDisplay: string | null;
  /** 变更原因（子账号调额手填）；未填写时为 null。 */
  reason: string | null;
  /** 记录时间戳（ms）。 */
  createdAt: number;
}

/** 一页会员记录（游标分页）。 */
export interface MemberRecordsPage {
  items: MemberRecordItem[];
  /** 是否还有下一页。 */
  hasMore: boolean;
  /** 下一页游标；没有更多时为 null。 */
  nextCursor: string | null;
}
