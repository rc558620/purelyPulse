// 子账号设置记录行：一条额度变更审计（从多少调到多少、谁在什么时候调的、为什么）。
import React from 'react';
import { cx, safeNum, safeStr } from '@utils/utils';
import { IconSubAccount } from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
import type { MemberSubAccountQuotaRecord } from '@pages/memberList/memberList.types';
import type { SubAccountBackfillState } from '../../../../../../../memberDetail.utils';
import { formatMemberDateTime } from '../../../../../../../memberDetail.utils';
import pageStyles from '../../../../../../../memberDetail.module.less';

/** 徽章文案：只区分「要不要补」。无子账号权益时整个徽章不渲染。 */
const BACKFILL_BADGE_LABELS: Record<'pending' | 'backfilled', string> = {
  pending: '待补录',
  backfilled: '已补录',
};

/** 徽章悬浮说明：补录这件事影响的是实际扣款，必须让运营看懂后果 */
const BACKFILL_BADGE_HINTS: Record<'pending' | 'backfilled', string> = {
  pending:
    '年 / 永久档位尚未补录子账号加价：续费价会按纯配置价收取，客户实际拥有子账号权益，这部分等于白送',
  backfilled: '年 / 永久档位的子账号加价已补录，续费价已计入这部分加价',
};

interface MemberDetailSubAccountBackfillBadgeProps {
  state: SubAccountBackfillState;
}

/** 子账号加价补录状态徽章：待补＝琥珀，已补＝青，与会员列表的筛选开关同色 */
const MemberDetailSubAccountBackfillBadge: React.FC<MemberDetailSubAccountBackfillBadgeProps> = ({
  state,
}) => {
  if (state === 'notEligible') {
    return null;
  }

  return (
    <span
      className={cx(
        pageStyles.subAccountBackfillBadge,
        state === 'pending'
          ? pageStyles.subAccountBackfillPending
          : pageStyles.subAccountBackfillDone,
      )}
      title={BACKFILL_BADGE_HINTS[state]}
    >
      {BACKFILL_BADGE_LABELS[state]}
    </span>
  );
};

interface MemberDetailSubAccountRowProps {
  record: MemberSubAccountQuotaRecord;
  isLast: boolean;
  /** 该会员的子账号加价补录状态（会员级，不由单条记录决定） */
  backfillState: SubAccountBackfillState;
  /**
   * 已补录的子账号加价展示值（元）；null 表示没补录（或档位不需要补录）。
   *
   * 补齐后额度行展示成 `10 个 = ¥1000`：只给个数运营判断不了「这 10 个值多少钱」。
   */
  addOnPriceDisplay: string | null;
}

const MemberDetailSubAccountRow: React.FC<MemberDetailSubAccountRowProps> = ({
  record,
  isLast,
  backfillState,
  addOnPriceDisplay,
}) => {
  // 额度调到 0 = 关闭子账号功能，展示成动作而不是「0 个」
  const isClosed = safeNum(record.newQuota) === 0;
  const quotaText = isClosed ? '已关闭' : `${safeNum(record.newQuota)} 个`;
  // 关闭子账号时没有「这 10 个值多少钱」可言；未补录时也拿不到金额
  const amountText = !isClosed && backfillState === 'backfilled' && addOnPriceDisplay
    ? ` = ¥${addOnPriceDisplay}`
    : '';
  const reason = safeStr(record.reason, '').trim();

  return (
    <div className={cx(pageStyles.rechargeRow, isLast && pageStyles.rechargeRowLast)}>
      <div className={cx(pageStyles.rechargeIcon, pageStyles.rechargeChannelAdmin)}>
        <IconSubAccount width={18} height={18} />
      </div>
      <div className={pageStyles.rechargeInfo}>
        <div className={pageStyles.rechargePlanNameRow}>
          <span className={pageStyles.rechargePlanName}>子账号额度</span>
          <MemberDetailSubAccountBackfillBadge state={backfillState} />
        </div>
        <div className={pageStyles.rechargeMeta}>
          <span className={cx(pageStyles.rechargeChannel, pageStyles.rechargeChannelAdmin)}>
            {safeStr(record.operatorName, '平台操作')}
          </span>
          <span className={pageStyles.rechargeDot} aria-hidden="true" />
          <span className={pageStyles.rechargeDate}>{formatMemberDateTime(record.createdAt)}</span>
        </div>
        {reason ? <span className={pageStyles.rechargeRecordReason}>{reason}</span> : null}
      </div>
      <div className={pageStyles.rechargeRight}>
        <span
          className={cx(
            pageStyles.rechargeAmtValue,
            isClosed && pageStyles.rechargeAmtClosed,
          )}
        >{`${quotaText}${amountText}`}</span>
        <span className={pageStyles.rechargeAdjustPrevPrice}>{`此前 ${safeNum(record.oldQuota)} 个`}</span>
      </div>
    </div>
  );
};

export default MemberDetailSubAccountRow;
