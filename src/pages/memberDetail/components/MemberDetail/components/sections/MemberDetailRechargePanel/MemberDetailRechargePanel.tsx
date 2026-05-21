// 会员详情充值面板：展示充值记录列表与空态。
import React from 'react';
import { isNonEmptyArray, safeNum } from '@utils/utils';
import type { RechargeRecord } from '@pages/memberList/memberList.types';
import pageStyles from '../../../../../memberDetail.module.less';
import styles from './MemberDetailRechargePanel.module.less';
import MemberDetailRechargeEmptyState from './components/MemberDetailRechargeEmptyState/MemberDetailRechargeEmptyState';
import MemberDetailRechargeHeader from './components/MemberDetailRechargeHeader/MemberDetailRechargeHeader';
import MemberDetailRechargeRow from './components/MemberDetailRechargeRow/MemberDetailRechargeRow';

interface MemberDetailRechargePanelProps {
  rechargeHistory: RechargeRecord[];
  rechargeCount: number;
}

const MemberDetailRechargePanel: React.FC<MemberDetailRechargePanelProps> = React.memo(({
  rechargeHistory,
  rechargeCount,
}) => (
  <div className={styles.root}>
    <div className={pageStyles.rechargeCard}>
      <MemberDetailRechargeHeader
        rechargeCount={rechargeCount}
        fallbackCount={safeNum(rechargeHistory.length)}
      />

      {isNonEmptyArray(rechargeHistory) ? (
        rechargeHistory.map((record, index) => (
          <MemberDetailRechargeRow
            key={record.id}
            record={record}
            isLast={index === safeNum(rechargeHistory.length) - 1}
          />
        ))
      ) : (
        <MemberDetailRechargeEmptyState />
      )}
    </div>
  </div>
));

MemberDetailRechargePanel.displayName = 'MemberDetailRechargePanel';

export default MemberDetailRechargePanel;
