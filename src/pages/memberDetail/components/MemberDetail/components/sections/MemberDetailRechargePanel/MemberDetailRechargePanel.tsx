// 会员详情记录面板：tab 切换「充值记录 / 会员等级设置记录 / 调整续费记录 / 子账号设置记录」。
//
// 四组数据语义各不相同，必须分开看：
// - 充值记录 = 商家端真实付款，进「累计充值」口径；
// - 会员等级设置记录 = 平台侧设置会员等级（成交，含赠送）；
// - 调整续费记录 = 运营议定的**未来每次续费**基础价变更留痕，与成交无关；
// - 子账号设置记录 = 子账号额度数值变更留痕（槽位配置变更没有审计，不在此列）。
import React, { useMemo, useState } from 'react';
import { isNonEmptyArray, safeNum } from '@utils/utils';
import SlidingTabBar from '@components/ui/filter/SlidingTabBar/SlidingTabBar';
import type { SlidingTabOption } from '@components/ui/filter/SlidingTabBar/SlidingTabBar';
import type { MemberSubAccountQuotaRecord, RechargeRecord } from '@pages/memberList/memberList.types';
import type { MemberRenewalPriceAdjustRecord } from '@pages/memberList/memberList.pricing.types';
import type { SubAccountBackfillState } from '../../../../../memberDetail.utils';
import pageStyles from '../../../../../memberDetail.module.less';
import styles from './MemberDetailRechargePanel.module.less';
import MemberDetailRechargeEmptyState from './components/MemberDetailRechargeEmptyState/MemberDetailRechargeEmptyState';
import MemberDetailRechargeHeader from './components/MemberDetailRechargeHeader/MemberDetailRechargeHeader';
import MemberDetailRechargeRow from './components/MemberDetailRechargeRow/MemberDetailRechargeRow';
import MemberDetailRenewalAdjustRow from './components/MemberDetailRenewalAdjustRow/MemberDetailRenewalAdjustRow';
import MemberDetailSubAccountRow from './components/MemberDetailSubAccountRow/MemberDetailSubAccountRow';

type RecordTabValue = 'recharge' | 'adminGrant' | 'renewalAdjust' | 'subAccount';

const RECORD_TABS: readonly SlidingTabOption<RecordTabValue>[] = [
  { value: 'recharge', label: '充值记录' },
  { value: 'adminGrant', label: '会员等级设置记录' },
  { value: 'renewalAdjust', label: '调整续费记录' },
  { value: 'subAccount', label: '子账号设置记录' },
] as const;

const RECORD_TAB_TITLES: Record<RecordTabValue, string> = {
  recharge: '充值记录',
  adminGrant: '会员等级设置记录',
  renewalAdjust: '调整续费记录',
  subAccount: '子账号设置记录',
};

const EMPTY_TEXTS: Record<RecordTabValue, string | undefined> = {
  recharge: undefined,
  adminGrant: '暂无会员等级设置记录',
  renewalAdjust: '暂无调整续费记录',
  subAccount: '暂无子账号设置记录',
};

interface MemberDetailRechargePanelProps {
  rechargeHistory: RechargeRecord[];
  rechargeCount: number;
  /** 管理端「设置会员等级」记录；不传则视为空 */
  adminGrantHistory?: RechargeRecord[];
  adminGrantCount?: number;
  /** 「调整续费价格」记录（改价审计）；不传则视为空 */
  renewalPriceAdjustHistory?: MemberRenewalPriceAdjustRecord[];
  renewalPriceAdjustCount?: number;
  /** 「子账号设置」记录（额度变更审计）；不传则视为空 */
  subAccountQuotaRecordHistory?: MemberSubAccountQuotaRecord[];
  subAccountQuotaRecordCount?: number;
  /**
   * 子账号加价补录状态（会员级）。
   *
   * 由页面按会员等级 + 成交价快照算出：行级渲染时每条记录都会带上它，
   * 因为「加价补没补」是账号当前状态，不是某次调额的历史快照。
   */
  subAccountBackfillState: SubAccountBackfillState;
  /**
   * 已补录的子账号加价展示值（元）；null 表示未补录。
   *
   * 与补录状态同源（都由页面从成交价快照算出）：已补录时子账号记录行展示
   * `10 个 = ¥1000`，让运营知道这批子账号值多少钱。
   */
  subAccountAddOnPriceDisplay: string | null;
}

const MemberDetailRechargePanel: React.FC<MemberDetailRechargePanelProps> = React.memo(({
  rechargeHistory,
  rechargeCount,
  adminGrantHistory,
  adminGrantCount,
  renewalPriceAdjustHistory,
  renewalPriceAdjustCount,
  subAccountQuotaRecordHistory,
  subAccountQuotaRecordCount,
  subAccountBackfillState,
  subAccountAddOnPriceDisplay,
}) => {
  const [activeTab, setActiveTab] = useState<RecordTabValue>('recharge');

  const grantHistory = useMemo(
    () => (Array.isArray(adminGrantHistory) ? adminGrantHistory : []),
    [adminGrantHistory],
  );

  const adjustHistory = useMemo(
    () => (Array.isArray(renewalPriceAdjustHistory) ? renewalPriceAdjustHistory : []),
    [renewalPriceAdjustHistory],
  );

  const quotaHistory = useMemo(
    () => (Array.isArray(subAccountQuotaRecordHistory) ? subAccountQuotaRecordHistory : []),
    [subAccountQuotaRecordHistory],
  );

  const isRechargeTab = activeTab === 'recharge';
  const isAdminGrantTab = activeTab === 'adminGrant';
  const isRenewalAdjustTab = activeTab === 'renewalAdjust';
  // 充值 / 设置两组行结构一致，共用一个列表；另外两组是各自的结构，单独渲染
  const rechargeLikeRecords = isRechargeTab ? rechargeHistory : grantHistory;

  const resolveCount = (): number => {
    if (isRechargeTab) return rechargeCount;
    if (isAdminGrantTab) return adminGrantCount ?? safeNum(grantHistory.length);
    if (isRenewalAdjustTab) {
      return renewalPriceAdjustCount ?? safeNum(adjustHistory.length);
    }
    return subAccountQuotaRecordCount ?? safeNum(quotaHistory.length);
  };

  const resolveVisibleCount = (): number => (isRechargeTab || isAdminGrantTab
    ? safeNum(rechargeLikeRecords.length)
    : isRenewalAdjustTab
      ? safeNum(adjustHistory.length)
      : safeNum(quotaHistory.length));

  const count = resolveCount();
  const visibleCount = resolveVisibleCount();

  const renderRows = (): React.ReactNode => {
    if (isRenewalAdjustTab) {
      return isNonEmptyArray(adjustHistory)
        ? adjustHistory.map((record, index) => (
          <MemberDetailRenewalAdjustRow
            key={record.id}
            record={record}
            isLast={index === visibleCount - 1}
          />
        ))
        : <MemberDetailRechargeEmptyState emptyText={EMPTY_TEXTS.renewalAdjust} />;
    }

    if (!isRechargeTab && !isAdminGrantTab) {
      return isNonEmptyArray(quotaHistory)
        ? quotaHistory.map((record, index) => (
          <MemberDetailSubAccountRow
            key={record.id}
            record={record}
            isLast={index === visibleCount - 1}
            backfillState={subAccountBackfillState}
            addOnPriceDisplay={subAccountAddOnPriceDisplay}
          />
        ))
        : <MemberDetailRechargeEmptyState emptyText={EMPTY_TEXTS.subAccount} />;
    }

    return isNonEmptyArray(rechargeLikeRecords)
      ? rechargeLikeRecords.map((record, index) => (
        <MemberDetailRechargeRow
          key={record.id}
          record={record}
          isLast={index === visibleCount - 1}
        />
      ))
      : <MemberDetailRechargeEmptyState emptyText={EMPTY_TEXTS[activeTab]} />;
  };

  return (
    <div className={styles.root}>
      <div className={pageStyles.rechargeCard}>
        <div className={styles.tabRow}>
          <SlidingTabBar
            options={RECORD_TABS}
            value={activeTab}
            onChange={setActiveTab}
            variant="segment"
            // 四个 tab 在窄屏上放不下：容器可横向滚动、标签不压缩
            className={styles.tabBar}
            btnClassName={styles.tabBtn}
            ariaLabel="会员记录类型切换"
          />
        </div>

        <MemberDetailRechargeHeader
          rechargeCount={count}
          fallbackCount={visibleCount}
          title={RECORD_TAB_TITLES[activeTab]}
        />

        {renderRows()}
      </div>
    </div>
  );
});

MemberDetailRechargePanel.displayName = 'MemberDetailRechargePanel';

export default MemberDetailRechargePanel;
