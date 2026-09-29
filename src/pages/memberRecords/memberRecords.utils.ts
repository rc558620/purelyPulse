// 会员记录管理页纯函数工具：默认条件、查询参数归一化与筛选摘要。
import { safeNum } from '@utils/utils';
import { MEMBER_RECORD_TYPE_LABEL } from './memberRecords.constants';
import type { MemberRecordsFilterState, MemberRecordsQuery } from './memberRecords.types';

const pad2 = (value: number): string => String(safeNum(value)).padStart(2, '0');

/** 取「今天」的 `YYYY-MM-DD`（浏览器本地时区）。 */
export const createTodayDateString = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
};

/** 组装默认筛选项：单独日期默认今天，起止日期留空（放上就自动清掉单独日期）。 */
export const createDefaultMemberRecordsFilters = (): MemberRecordsFilterState => ({
  phone: '',
  name: '',
  singleDate: createTodayDateString(),
  rangeStart: null,
  rangeEnd: null,
  level: 'all',
  type: 'all',
});

/**
 * 起止日期是否填反。
 *
 * 只有两端都填了才可能填反（只填一端表示「从这天起 / 到这天止」，是合法用法）；
 * 后端拿到反向区间只会返回空列表，运营会误判成「这段时间真没记录」，所以前端提前拦下。
 */
export const isDateRangeReversed = (
  start: MemberRecordsFilterState['rangeStart'],
  end: MemberRecordsFilterState['rangeEnd'],
): boolean => Boolean(start && end && start > end);

/** 记录时间 → `YYYY.MM.dd HH:mm`（与会员详情记录行的日期格式一致，便于两处对照）。 */
export const formatRecordDateTime = (timestamp: number): string => {
  const date = new Date(safeNum(timestamp));
  return `${date.getFullYear()}.${pad2(date.getMonth() + 1)}.${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};

/** 表单态 → 查询态：三个日期框互斥，永远只有一组日期参数下发。 */
export const buildMemberRecordsQuery = (filters: MemberRecordsFilterState): MemberRecordsQuery => ({
  phone: filters.phone.trim(),
  name: filters.name.trim(),
  date: filters.singleDate,
  startDate: filters.singleDate ? null : filters.rangeStart,
  endDate: filters.singleDate ? null : filters.rangeEnd,
  level: filters.level,
  type: filters.type,
});

/** `YYYY-MM-DD` → `YYYY/MM/DD`（界面日期统一用斜杠，与会员详情的日期文案一致）。 */
const formatQueryDate = (date: string): string => date.replace(/-/g, '/');

/** 查询条件摘要（列表卡副标题）：说清「这批数据是按什么筛出来的」。 */
export const buildMemberRecordsQuerySummary = (query: MemberRecordsQuery): string => {
  const levelLabel = query.level === 'all'
    ? '全部等级'
    : MEMBER_RECORD_LEVEL_TEXT[query.level];
  const typeLabel = query.type === 'all' ? '全部记录' : MEMBER_RECORD_TYPE_LABEL[query.type];

  let dateLabel: string;
  if (query.date) {
    dateLabel = formatQueryDate(query.date);
  } else if (query.startDate || query.endDate) {
    const start = query.startDate ? formatQueryDate(query.startDate) : '不限';
    const end = query.endDate ? formatQueryDate(query.endDate) : '不限';
    dateLabel = `${start} ~ ${end}`;
  } else {
    dateLabel = '不限日期';
  }

  return `${levelLabel} · ${typeLabel} · ${dateLabel}`;
};

/** 等级筛选项的展示文案（摘要用；下拉选项文案在 constants 里维护）。 */
const MEMBER_RECORD_LEVEL_TEXT: Record<Exclude<MemberRecordsQuery['level'], 'all'>, string> = {
  lifetime: '永久',
  annual: '年卡',
  quarterly: '季卡',
  monthly: '月卡',
  free: '免费',
};
