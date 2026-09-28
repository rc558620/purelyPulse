// 会员详情充值面板：tab 切换「充值记录 / 设置会员等级记录」，共用一套行渲染。
import React, { useMemo, useState } from 'react';
import { isNonEmptyArray, safeNum } from '@utils/utils';
import SlidingTabBar from '@components/ui/filter/SlidingTabBar/SlidingTabBar';
import type { SlidingTabOption } from '@components/ui/filter/SlidingTabBar/SlidingTabBar';
import type { RechargeRecord } from '@pages/memberList/memberList.types';
import pageStyles from '../../../../../memberDetail.module.less';
import styles from './MemberDetailRechargePanel.module.less';
import MemberDetailRechargeEmptyState from './components/MemberDetailRechargeEmptyState/MemberDetailRechargeEmptyState';
import MemberDetailRechargeHeader from './components/MemberDetailRechargeHeader/MemberDetailRechargeHeader';
import MemberDetailRechargeRow from './components/MemberDetailRechargeRow/MemberDetailRechargeRow';

type RecordTabValue = 'recharge' | 'adminGrant';

const RECORD_TABS: readonly SlidingTabOption<RecordTabValue>[] = [
  { value: 'recharge', label: '充值记录' },
  { value: 'adminGrant', label: '设置记录' },
] as const;

interface MemberDetailRechargePanelProps {
  rechargeHistory: RechargeRecord[];
  rechargeCount: number;
  /** 管理端「设置会员等级」记录；不传则只展示充值记录 */
  adminGrantHistory?: RechargeRecord[];
  adminGrantCount?: number;
}

const MemberDetailRechargePanel: React.FC<MemberDetailRechargePanelProps> = React.memo(({
  rechargeHistory,
  rechargeCount,
  adminGrantHistory,
  adminGrantCount,
}) => {
  const [activeTab, setActiveTab] = useState<RecordTabValue>('recharge');

  const grantHistory = useMemo(
    () => (Array.isArray(adminGrantHistory) ? adminGrantHistory : []),
    [adminGrantHistory],
  );

  const isRechargeTab = activeTab === 'recharge';
  const records = isRechargeTab ? rechargeHistory : grantHistory;
  const count = isRechargeTab
    ? rechargeCount
    : (adminGrantCount ?? safeNum(grantHistory.length));

  return (
    <div className={styles.root}>
      <div className={pageStyles.rechargeCard}>
        <div className={styles.tabRow}>
          <SlidingTabBar
            options={RECORD_TABS}
            value={activeTab}
            onChange={setActiveTab}
            variant="segment"
            ariaLabel="会员记录类型切换"
          />
        </div>

        <MemberDetailRechargeHeader
          rechargeCount={count}
          fallbackCount={safeNum(records.length)}
          title={isRechargeTab ? '充值记录' : '设置会员等级记录'}
        />

        {isNonEmptyArray(records) ? (
          records.map((record, index) => (
            <MemberDetailRechargeRow
              key={record.id}
              record={record}
              isLast={index === safeNum(records.length) - 1}
            />
          ))
        ) : (
          <MemberDetailRechargeEmptyState
            emptyText={isRechargeTab ? undefined : '暂无设置会员等级记录'}
          />
        )}
      </div>
    </div>
  );
});

MemberDetailRechargePanel.displayName = 'MemberDetailRechargePanel';

export default MemberDetailRechargePanel;
