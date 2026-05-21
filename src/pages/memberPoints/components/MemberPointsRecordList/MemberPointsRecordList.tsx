// memberPoints 变动记录列表区块
import React from 'react';
import { cx, isNonEmptyArray, safeNum } from '@utils/utils';
import type { MemberPointsRecord, MemberPointsSource } from '../../memberPoints.types';
import { IconMemberPointsQuestion, IconMemberPointsRecordType } from '../MemberPointsIcons/MemberPointsIcons';
import styles from './MemberPointsRecordList.module.less';

const MEMBER_POINTS_SOURCE_LABELS: Record<MemberPointsSource, string> = {
  purchase_bonus: '购买奖励',
  deduct_payment: '抵扣消费',
  admin_adjust: '管理员调整',
  expire: '积分过期',
};

type MemberPointsRecordAmountVariant = 'earn' | 'spend' | 'expire';

interface MemberPointsRecordListProps {
  records: MemberPointsRecord[];
}

const getRecordAmountVariant = (
  record: Pick<MemberPointsRecord, 'type'>,
): MemberPointsRecordAmountVariant => {
  if (record.type === 'earn') {
    return 'earn';
  }

  if (record.type === 'expire') {
    return 'expire';
  }

  return 'spend';
};

const formatRecordTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const padNumber = (value: number): string => String(value).padStart(2, '0');

  return `${date.getFullYear()}/${padNumber(date.getMonth() + 1)}/${padNumber(date.getDate())} ${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`;
};

const MemberPointsRecordList: React.FC<MemberPointsRecordListProps> = React.memo(({ records }) => (
  <div className={styles.listCard}>
    <div className={styles.listHeader}>
      <span className={styles.listTitle}>变动记录</span>
      <span className={styles.listCount}>{safeNum(records.length)} 条</span>
    </div>

    {isNonEmptyArray(records) ? (
      <div className={styles.recordList}>
        {records.map((record) => {
          const amountVariant = getRecordAmountVariant(record);

          return (
            <div key={record.id} className={styles.recordItem}>
              <div
                className={cx(
                  styles.recordIcon,
                  amountVariant === 'earn' && styles.recordIconEarn,
                  amountVariant === 'spend' && styles.recordIconSpend,
                  amountVariant === 'expire' && styles.recordIconExpire,
                )}
                aria-hidden="true"
              >
                <IconMemberPointsRecordType type={amountVariant} />
              </div>

              <div className={styles.recordInfo}>
                <div className={styles.recordTopRow}>
                  <span className={styles.recordUserName}>{record.userName}</span>
                  <span className={styles.recordPhone}>{record.userPhone}</span>
                  <span className={cx(styles.recordSourceTag, record.source === 'admin_adjust' && styles.recordSourceTagAdmin)}>
                    {MEMBER_POINTS_SOURCE_LABELS[record.source]}
                  </span>
                </div>
                <div className={styles.recordDesc}>{record.description}</div>
                <div className={styles.recordTime}>{formatRecordTime(record.createdAt)}</div>
              </div>

              <div
                className={cx(
                  styles.recordAmount,
                  amountVariant === 'earn' && styles.recordAmountEarn,
                  amountVariant === 'spend' && styles.recordAmountSpend,
                  amountVariant === 'expire' && styles.recordAmountExpire,
                )}
              >
                {record.amount > 0 ? `+${record.amount}` : record.amount}
              </div>
            </div>
          );
        })}
      </div>
    ) : (
      <div className={styles.emptyState} role="status">
        <IconMemberPointsQuestion />
        <span>暂无积分记录</span>
      </div>
    )}
  </div>
));

export default MemberPointsRecordList;
