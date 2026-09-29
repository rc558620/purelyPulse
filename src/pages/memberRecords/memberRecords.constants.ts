// 会员记录管理页常量：筛选项、类型文案与分页参数。
import type { SelectOption } from '@components/form/SelectView/types';
import type { MemberRecordType } from './memberRecords.types';

/** 会员等级下拉：文案与会员详情 / 会员列表的档位口径保持一致（永久 / 年卡 / 季卡 / 月卡 / 免费）。 */
export const MEMBER_RECORD_LEVEL_OPTIONS: SelectOption[] = [
  { value: 'all', label: '全部等级' },
  { value: 'lifetime', label: '永久' },
  { value: 'annual', label: '年卡' },
  { value: 'quarterly', label: '季卡' },
  { value: 'monthly', label: '月卡' },
  { value: 'free', label: '免费' },
];

/** 记录类型下拉：默认「全部记录」，四类记录的措辞与会员详情记录面板的 tab 完全一致。 */
export const MEMBER_RECORD_TYPE_OPTIONS: SelectOption[] = [
  { value: 'all', label: '全部记录' },
  { value: 'recharge', label: '充值记录' },
  { value: 'adminGrant', label: '会员等级设置记录' },
  { value: 'renewalAdjust', label: '调整续费记录' },
  { value: 'subAccount', label: '子账号设置记录' },
];

/** 记录类型中文文案（列表行类型徽章 + 汇总文案共用）。 */
export const MEMBER_RECORD_TYPE_LABEL: Record<MemberRecordType, string> = {
  recharge: '充值记录',
  adminGrant: '会员等级设置记录',
  renewalAdjust: '调整续费记录',
  subAccount: '子账号设置记录',
};

/** 单页条数：与后端游标分页的 limit 默认值对齐。 */
export const MEMBER_RECORD_PAGE_SIZE = 20;

/** 手机号最大长度（与会员手机号位数一致，避免用户多打一位再被后端截断）。 */
export const MEMBER_RECORD_PHONE_MAX_LENGTH = 11;
