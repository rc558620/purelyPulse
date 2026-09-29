// 封禁管理页：封装列表查询与封禁状态变更请求。
import { emitMemberStatusSync, fetchMemberList, submitMemberBan, submitMemberUnban } from '../memberList/memberList.service';
import { MEMBER_LIST_MAX_PAGE_SIZE } from '../memberList/memberList.constants';
import type { MemberListItem, MemberListStats } from '../memberList/memberList.types';
import type { BanManagementQuery } from './banManagement.types';

export interface BanManagementListResponse {
  members: MemberListItem[];
  stats: MemberListStats;
  /** 是否还有下一页：为 true 说明名单超过单页上限，当前仅展示前 100 条。 */
  hasMore: boolean;
}

const buildBanManagementMemberListQuery = (query: BanManagementQuery) => ({
  keyword: query.keyword,
  status: query.status,
  level: 'all' as const,
  expiry: 'all' as const,
  // 封禁管理页不按「待补录子账号加价」筛选，显式关掉
  pendingSubAccountBackfill: false,
  // 同样不按「已调续费价」筛选
  renewalPriceAdjusted: false,
});

export const fetchBanManagementList = async (query: BanManagementQuery): Promise<BanManagementListResponse> => {
  // 封禁名单通常量小，按最大页大小一次性拉取第 1 页；
  // 后端 hasMore 为 true 时说明名单已超过单页容量，需另行接入分页。
  return fetchMemberList(buildBanManagementMemberListQuery(query), 1, MEMBER_LIST_MAX_PAGE_SIZE);
};

export const submitBanManagementBan = async (memberId: string, reason: string): Promise<void> => {
  await submitMemberBan(memberId, reason);
  emitMemberStatusSync({
    memberId,
    status: 'banned',
    remark: reason,
  });
};

export const submitBanManagementUnban = async (memberId: string): Promise<void> => {
  await submitMemberUnban(memberId);
  emitMemberStatusSync({
    memberId,
    status: 'active',
    remark: '',
  });
};
