// memberPoints 变动记录列表区块
//
// 「下拉刷新 / 上拉加载更多」由外层 PullRefreshLoadMore 承载，这里只负责列表内容本身。
import React from 'react';
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

interface MemberPointsRecordListProps {
  /** 当前已加载的流水 */
  records: MemberPointsRecord[];
  /** 当前筛选下的总条数（后端统计，与已加载页数无关） */
  totalCount: number;
  /**
   * 是否展示「余额 X 积分」。
   *
   * 流水行没有余额字段，值由会员快照回填；快照没拉到时兜底是 0，
   * 直接展示会把「余额未知」说成「余额 0」。
   */
  showBalance: boolean;
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  /** 首屏错误文案 */
  errorMessage: string;
  /** 重新加载回调 */
  onRetry: () => void;
}

interface CountTextInput {
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  totalCount: number;
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

/** 头部条数：仅首屏与加载更多期间占用文案；切 Tab / 下拉刷新时照常展示总数，避免加载态顶替。 */
const buildCountText = (input: CountTextInput): string => {
  if (input.isInitialLoading) {
    return '加载中...';
  }

  if (input.isLoadingMore) {
    return '加载更多中...';
  }

  return `共 ${safeNum(input.totalCount)} 条`;
};

const MemberPointsRecordList: React.FC<MemberPointsRecordListProps> = React.memo(({
  records,
  totalCount,
  showBalance,
  isInitialLoading,
  isLoadingMore,
  errorMessage,
  onRetry,
}) => {
  const hasRecords = isNonEmptyArray(records);
  const showList = !isInitialLoading && !errorMessage && hasRecords;
  const showEmpty = !isInitialLoading && !errorMessage && !hasRecords;
  const showError = !isInitialLoading && Boolean(errorMessage);

  return (
    <div className={styles.listCard}>
      <div className={styles.listHeader}>
        <span className={styles.listTitle}>变动记录</span>
        <span className={styles.listCount}>
          {buildCountText({ isInitialLoading, isLoadingMore, totalCount })}
        </span>
      </div>

      {isInitialLoading ? (
        <div className={styles.stateBox} role="status">
          <span>积分记录加载中...</span>
        </div>
      ) : null}

      {showError ? (
        <div className={styles.stateBox} role="alert">
          <span>{errorMessage}</span>
          <button type="button" className={styles.retryBtn} onClick={onRetry}>
            重新加载
          </button>
        </div>
      ) : null}

      {showEmpty ? (
        <div className={styles.emptyState} role="status">
          <IconMemberPointsQuestion />
          <span>暂无符合条件的积分记录</span>
        </div>
      ) : null}

      {showList ? (
        <div className={styles.recordList}>
          {records.map((record) => {
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
                    {showBalance ? (
                      <span className={styles.recordBalance}>余额 {safeNum(record.availablePoints).toLocaleString('zh-CN')} 积分</span>
                    ) : null}
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
      ) : null}
    </div>
  );
});

export default MemberPointsRecordList;
