// memberPoints 变动记录列表区块
import React, { useCallback, useState } from 'react';
import { cx, isNonEmptyArray, safeNum, safeStr } from '@utils/utils';
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

/** 首屏默认展示条数，避免一次性渲染大量 DOM 节点 */
const INITIAL_VISIBLE_COUNT = 20;

/** 每次加载更多增加的条数 */
const LOAD_MORE_COUNT = 20;

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

const MemberPointsRecordList: React.FC<MemberPointsRecordListProps> = React.memo(({ records }) => {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  const hasMore = records.length > visibleCount;
  const visibleRecords = records.slice(0, visibleCount);

  const handleLoadMore = useCallback((): void => {
    setVisibleCount((prev) => prev + LOAD_MORE_COUNT);
  }, []);

  return (
    <div className={styles.listCard}>
      <div className={styles.listHeader}>
        <span className={styles.listTitle}>变动记录</span>
        <span className={styles.listCount}>{safeNum(records.length)} 条</span>
      </div>

      {isNonEmptyArray(visibleRecords) ? (
        <div className={styles.recordList}>
          {visibleRecords.map((record) => {
            const amountVariant = getRecordAmountVariant(record);
            const avatarChar = safeStr(record.userName, '会').slice(0, 1);

            return (
              <div key={record.id} className={styles.recordItem}>
                {/* 用户头像 */}
                <div
                  className={cx(styles.recordAvatar, record.avatarUrl && styles.recordAvatarWithImage)}
                  aria-hidden="true"
                >
                  {record.avatarUrl ? (
                    <img className={styles.recordAvatarImg} src={record.avatarUrl} alt="" />
                  ) : (
                    avatarChar
                  )}
                  <span
                    className={cx(
                      styles.recordAvatarBadge,
                      amountVariant === 'earn' && styles.recordAvatarBadgeEarn,
                      amountVariant === 'spend' && styles.recordAvatarBadgeSpend,
                      amountVariant === 'expire' && styles.recordAvatarBadgeExpire,
                    )}
                  >
                    <IconMemberPointsRecordType type={amountVariant} />
                  </span>
                </div>

                <div className={styles.recordInfo}>
                  <div className={styles.recordTopRow}>
                    <span className={styles.recordUserName}>{record.userName}</span>
                    <span className={styles.recordPhone}>{record.userPhone}</span>
                  </div>
                  <div className={styles.recordMetaRow}>
                    <span className={cx(styles.recordSourceTag, record.source === 'admin_adjust' && styles.recordSourceTagAdmin)}>
                      {MEMBER_POINTS_SOURCE_LABELS[record.source]}
                    </span>
                    <span className={styles.recordBalance}>余额 {safeNum(record.availablePoints).toLocaleString('zh-CN')} 积分</span>
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

          {hasMore ? (
            <button type="button" className={styles.loadMoreBtn} onClick={handleLoadMore}>
              加载更多（剩余 {safeNum(records.length - visibleCount)} 条）
            </button>
          ) : null}
        </div>
      ) : (
        <div className={styles.emptyState} role="status">
          <IconMemberPointsQuestion />
          <span>暂无积分记录</span>
        </div>
      )}
    </div>
  );
});

export default MemberPointsRecordList;
