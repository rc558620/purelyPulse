// 封禁管理页：封装列表查询与封禁状态变更请求。
import { emitMemberStatusSync, fetchMemberList, submitMemberBan, submitMemberUnban } from '../memberList/memberList.service';
import type { MemberListItem, MemberListStats } from '../memberList/memberList.types';
import type { BanManagementQuery } from './banManagement.types';

export interface BanManagementListResponse {
  members: MemberListItem[];
  stats: MemberListStats;
}

const buildBanManagementMemberListQuery = (query: BanManagementQuery) => ({
  keyword: query.keyword,
  status: query.status,
  level: 'all' as const,
});

export const fetchBanManagementList = async (query: BanManagementQuery): Promise<BanManagementListResponse> => {
  return fetchMemberList(buildBanManagementMemberListQuery(query));
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
