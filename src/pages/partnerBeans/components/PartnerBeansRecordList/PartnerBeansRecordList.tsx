// partnerBeans 变动记录列表区块：加载 / 错误 / 空 / 正常四种态。
//
// 「下拉刷新 / 上拉加载更多」由外层 PullRefreshLoadMore 承载，这里只负责列表内容本身。
import React from 'react';
import { cx, isNonEmptyArray, safeNum } from '@utils/utils';
import { PARTNER_BEANS_SOURCE_LABELS } from '../../partnerBeans.constants';
import type { PartnerBeansPageRecord } from '../../partnerBeans.types';
import {
  IconPartnerBeansEarn,
  IconPartnerBeansQuestion,
  IconPartnerBeansRelatedUser,
  IconPartnerBeansSpend,
  IconPartnerBeansWithdraw,
} from '../PartnerBeansIcons/PartnerBeansIcons';
import styles from './PartnerBeansRecordList.module.less';

interface PartnerBeansRecordListProps {
  /** 当前已加载的流水 */
  records: PartnerBeansPageRecord[];
  /** 当前筛选下的总条数（后端统计，与已加载页数无关） */
  totalCount: number;
  /** 合伙人快照是否可用：不可用时余额未知，不能显示成 0 */
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

const formatPartnerBeansTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const renderRecordTypeIcon = (record: PartnerBeansPageRecord): React.ReactNode => {
  if (record.type === 'earn') {
    return <IconPartnerBeansEarn />;
  }
  if (record.source === 'withdrawal') {
    return <IconPartnerBeansWithdraw />;
  }
  return <IconPartnerBeansSpend />;
};

const getRecordClassNames = (record: PartnerBeansPageRecord) => {
  const isEarn = record.type === 'earn';
  const isWithdraw = record.source === 'withdrawal';

  return {
    amountClassName: cx(
      styles.recordAmount,
      isEarn && styles.recordAmountEarn,
      isWithdraw && styles.recordAmountWithdraw,
      !isEarn && !isWithdraw && styles.recordAmountSpend,
    ),
    typeIconClassName: cx(
      styles.recordTypeIcon,
      isEarn && styles.recordTypeIconEarn,
      isWithdraw && styles.recordTypeIconWithdraw,
      !isEarn && !isWithdraw && styles.recordTypeIconSpend,
    ),
  };
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

const PartnerBeansRecordListComponent: React.FC<PartnerBeansRecordListProps> = ({
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
          <span>纯利豆记录加载中...</span>
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
          <IconPartnerBeansQuestion />
          <span>暂无符合条件的纯利豆记录</span>
        </div>
      ) : null}

      {showList ? (
        <div className={styles.recordList}>
          {records.map((record) => {
            const classNames = getRecordClassNames(record);

            return (
              <div key={record.id} className={styles.recordItem}>
                <div className={styles.recordLeft}>
                  <div
                    className={cx(styles.recordAvatar, record.avatarUrl && styles.recordAvatarWithImage)}
                    aria-hidden="true"
                  >
                    {record.avatarUrl ? (
                      <img className={styles.recordAvatarImg} src={record.avatarUrl} alt="" />
                    ) : (
                      record.userName[0]
                    )}
                  </div>
                  <div className={classNames.typeIconClassName} aria-hidden="true">
                    {renderRecordTypeIcon(record)}
                  </div>
                </div>

                <div className={styles.recordInfo}>
                  <div className={styles.recordTopRow}>
                    <span className={styles.recordUserName}>{record.userName}</span>
                    <span className={styles.recordPhone}>{record.userPhone}</span>
                    <span
                      className={cx(
                        styles.recordSourceTag,
                        record.source === 'admin_adjust' && styles.recordSourceTagAdmin,
                        record.source === 'promo_reward' && styles.recordSourceTagPromo,
                        record.source === 'withdrawal' && styles.recordSourceTagWithdraw,
                        record.source === 'deduct_payment' && styles.recordSourceTagDeduct,
                      )}
                    >
                      {PARTNER_BEANS_SOURCE_LABELS[record.source]}
                    </span>
                  </div>
                  <div className={styles.recordDesc}>{record.description}</div>
                  {record.relatedUser ? (
                    <div className={styles.recordRelatedUser}>
                      <IconPartnerBeansRelatedUser />
                      被推广人：{record.relatedUser}
                    </div>
                  ) : null}
                  <div className={styles.recordBottomRow}>
                    <span className={styles.recordTime}>{formatPartnerBeansTime(record.createdAt)}</span>
                    {showBalance ? (
                      <span className={styles.recordBalance}>
                        余额 <span className={styles.recordBalanceVal}>{safeNum(record.beanBalance).toLocaleString('zh-CN')}</span> 豆
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className={classNames.amountClassName}>
                  {record.amount > 0 ? `+${record.amount}` : record.amount}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

const PartnerBeansRecordList = React.memo(PartnerBeansRecordListComponent);

export default PartnerBeansRecordList;
