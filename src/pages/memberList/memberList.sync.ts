// 会员模块跨页面同步事件：状态变更、注销、等级收入三类广播。
import { MEMBER_CANCEL_SYNC_EVENT, MEMBERSHIP_REVENUE_SYNC_EVENT, MEMBER_STATUS_SYNC_EVENT } from './memberList.constants';
import type { MemberStatusSyncPayload, MembershipRevenueSyncPayload } from './memberList.types';

/** 广播会员状态变更，驱动列表与详情跨页面刷新。 */
export const emitMemberStatusSync = (payload: MemberStatusSyncPayload): void => {
  window.dispatchEvent(new CustomEvent<MemberStatusSyncPayload>(MEMBER_STATUS_SYNC_EVENT, { detail: payload }));
};

/** 广播会员等级设置产生的收入，驱动充值收入相关页面刷新。 */
export const emitMembershipRevenueSync = (payload: MembershipRevenueSyncPayload): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent<MembershipRevenueSyncPayload>(MEMBERSHIP_REVENUE_SYNC_EVENT, { detail: payload }));
};

/** 广播会员注销事件，驱动列表移除或标记刷新。 */
export const emitMemberCancelSync = (memberId: string): void => {
  window.dispatchEvent(new CustomEvent<{ memberId: string }>(MEMBER_CANCEL_SYNC_EVENT, { detail: { memberId } }));
};
