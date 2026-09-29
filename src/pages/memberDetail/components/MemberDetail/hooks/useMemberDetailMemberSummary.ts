// 会员摘要派生 hook：把会员原始数据换算成详情页展示所需的到期文案与子账号补录信息。
import { useMemo } from 'react';
import {
  formatMemberDate,
  resolveSubAccountAddOnPriceDisplay,
  resolveSubAccountBackfillState,
} from '../../../memberDetail.utils';
import type { MemberDetailMemberSummary, MemberDetailMemberSummarySource } from '../MemberDetail.types';

const DAY_MS = 86_400_000;

/** 会员摘要派生 hook。 */
export const useMemberDetailMemberSummary = ({
  member,
  memberLevel,
  memberExpiry,
  lifetimeMembershipDays,
}: MemberDetailMemberSummarySource): MemberDetailMemberSummary => {
  const membershipExpiry = useMemo(() => {
    if (memberLevel !== 'lifetime' || memberExpiry || !member) {
      return memberExpiry;
    }

    // 永久会员缺到期时间时，从最近一次充值推算（没有充值记录则回落到注册时间）
    const latestRechargeAt = member.rechargeHistory.reduce<number | null>((latest, record) => {
      if (!Number.isFinite(record.createdAt)) {
        return latest;
      }
      return latest === null ? record.createdAt : Math.max(latest, record.createdAt);
    }, null);

    const inferredStartAt = latestRechargeAt ?? member.registeredAt;
    return Number.isFinite(inferredStartAt) ? inferredStartAt + lifetimeMembershipDays * DAY_MS : null;
  }, [lifetimeMembershipDays, member, memberExpiry, memberLevel]);

  const membershipExpiryText =
    memberLevel === 'free' ? null :
    membershipExpiry ? `${formatMemberDate(membershipExpiry)} 到期` :
    memberLevel === 'lifetime' ? '永久有效' : null;

  const subAccountBackfillState = useMemo(
    () => resolveSubAccountBackfillState(memberLevel, member?.lockedPrices),
    [member, memberLevel],
  );

  const subAccountAddOnPriceDisplay = useMemo(
    () => resolveSubAccountAddOnPriceDisplay(memberLevel, member?.lockedPrices),
    [member, memberLevel],
  );

  return {
    membershipExpiry,
    membershipExpiryText,
    subAccountBackfillState,
    subAccountAddOnPriceDisplay,
  };
};
