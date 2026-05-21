// 封禁管理页：定义页面配置、查询参数与交互类型。
import type { Dispatch, SetStateAction } from 'react';
import type { MemberFilterStatus, MemberListItem, MemberListStats } from '../memberList/memberList.types';

/** 封禁原因枚举。 */
export const BAN_REASONS = [
  '违规操作',
  '账号异常',
  '恶意刷单',
  '违反用户协议',
  '欺诈行为',
  '其他',
] as const;

/** 状态筛选标签。 */
export interface BanManagementStatusTab {
  value: MemberFilterStatus;
  label: string;
}

/** 封禁管理页状态筛选配置。 */
export const STATUS_TABS: BanManagementStatusTab[] = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '正常' },
  { value: 'inactive', label: '未活跃' },
  { value: 'banned', label: '已封禁' },
];

export type BanReason = typeof BAN_REASONS[number];
export type ConfirmAction = 'ban' | 'unban';

/** 封禁管理页列表查询。 */
export interface BanManagementQuery {
  keyword: string;
  status: MemberFilterStatus;
}

/** 封禁管理页顶部统计。 */
export interface BanManagementCounts {
  all: number;
  active: number;
  inactive: number;
  banned: number;
}

/** 确认弹窗目标。 */
export interface BanManagementConfirmTarget {
  member: MemberListItem;
  action: ConfirmAction;
}

/** 封禁管理页控制器返回值。 */
export interface UseBanManagementControllerReturn {
  members: MemberListItem[];
  stats: MemberListStats;
  counts: BanManagementCounts;
  isLoading: boolean;
  isRefreshing: boolean;
  isSubmitting: boolean;
  errorMessage: string;
  statusFilter: MemberFilterStatus;
  searchQuery: string;
  expandedId: string | null;
  confirmTarget: BanManagementConfirmTarget | null;
  banReason: string;
  submittingMemberId: string;
  setStatusFilter: (value: MemberFilterStatus) => void;
  setSearchQuery: (value: string) => void;
  setBanReason: Dispatch<SetStateAction<string>>;
  handleSearchClear: () => void;
  retryLoad: () => void;
  handleToggleExpand: (id: string) => void;
  handleOpenConfirm: (member: MemberListItem, action: ConfirmAction) => void;
  handleCancelConfirm: () => void;
  handleConfirm: () => Promise<void>;
}
