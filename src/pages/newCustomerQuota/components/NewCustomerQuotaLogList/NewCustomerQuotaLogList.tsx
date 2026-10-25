// newCustomerQuota 门店额度变动记录列表：加载 / 失败 / 空 / 正常四种态
//
// 「下拉刷新 / 上拉加载更多」由外层 PullRefreshLoadMore 承载，这里只渲染列表内容。
import React from 'react';
import { cx, isNonEmptyArray, safeNum } from '@utils/utils';
import { NEW_CUSTOMER_QUOTA_LOG_TYPE_LABELS } from '../../newCustomerQuota.constants';
import type { NewCustomerQuotaLog, NewCustomerQuotaLogType } from '../../newCustomerQuota.types';
import {
  IconNewCustomerQuotaAdmin,
  IconNewCustomerQuotaDecrease,
  IconNewCustomerQuotaIncrease,
  IconNewCustomerQuotaQuestion,
  IconNewCustomerQuotaRecharge,
} from '../NewCustomerQuotaIcons/NewCustomerQuotaIcons';
import NewCustomerQuotaPageState from '../NewCustomerQuotaPageState/NewCustomerQuotaPageState';
import styles from './NewCustomerQuotaLogList.module.less';

interface NewCustomerQuotaLogListProps {
  /** 当前已加载的变动记录 */
  logs: NewCustomerQuotaLog[];
  /** 当前 Tab 下的记录总数（后端口径，与已加载页数无关） */
  totalCount: number;
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  /** 首屏错误文案 */
  errorMessage: string;
  onRetry: () => void;
}

/** 类型 → 标签着色类名（映射表取类名，避免模板字符串拼 className） */
const TYPE_TAG_CLASS: Record<NewCustomerQuotaLogType, string> = {
  recharge: styles.typeTagRecharge,
  grant: styles.typeTagGrant,
  consume: styles.typeTagConsume,
  clear: styles.typeTagClear,
  admin_adjust: styles.typeTagAdmin,
  unknown: styles.typeTagUnknown,
};

/** 类型 → 类型图标 */
const renderTypeIcon = (type: NewCustomerQuotaLogType): React.ReactNode => {
  if (type === 'recharge') {
    return <IconNewCustomerQuotaRecharge />;
  }
  if (type === 'admin_adjust') {
    return <IconNewCustomerQuotaAdmin />;
  }
  if (type === 'grant') {
    return <IconNewCustomerQuotaIncrease />;
  }
  return <IconNewCustomerQuotaDecrease />;
};

/** 类型 → 图标底色类名 */
const TYPE_ICON_CLASS: Record<NewCustomerQuotaLogType, string> = {
  recharge: styles.typeIconRecharge,
  grant: styles.typeIconGrant,
  consume: styles.typeIconConsume,
  clear: styles.typeIconConsume,
  admin_adjust: styles.typeIconAdmin,
  unknown: styles.typeIconUnknown,
};

const formatLogTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/** 头部条数：仅首屏与加载更多期间占用文案，切 Tab / 下拉刷新照常展示总数 */
const buildCountText = (isInitialLoading: boolean, isLoadingMore: boolean, totalCount: number): string => {
  if (isInitialLoading) {
    return '加载中...';
  }
  if (isLoadingMore) {
    return '加载更多中...';
  }

  return `共 ${safeNum(totalCount)} 条`;
};

const NewCustomerQuotaLogListComponent: React.FC<NewCustomerQuotaLogListProps> = ({
  logs,
  totalCount,
  isInitialLoading,
  isLoadingMore,
  errorMessage,
  onRetry,
}) => {
  const hasLogs = isNonEmptyArray(logs);
  const showList = !isInitialLoading && !errorMessage && hasLogs;
  const showEmpty = !isInitialLoading && !errorMessage && !hasLogs;
  const showError = !isInitialLoading && Boolean(errorMessage);

  return (
    <div className={styles.listCard}>
      <div className={styles.listHeader}>
        <span className={styles.listTitle}>变动记录</span>
        <span className={styles.listCount}>{buildCountText(isInitialLoading, isLoadingMore, totalCount)}</span>
      </div>

      {isInitialLoading ? <NewCustomerQuotaPageState message="额度变动记录加载中..." variant="loading" /> : null}

      {showError ? <NewCustomerQuotaPageState message={errorMessage} variant="error" onRetry={onRetry} /> : null}

      {showEmpty ? (
        <div className={styles.emptyState} role="status">
          <IconNewCustomerQuotaQuestion />
          <span>暂无符合条件的额度变动记录</span>
        </div>
      ) : null}

      {showList ? (
        <div className={styles.logList}>
          {logs.map((log) => {
            const amount = safeNum(log.changeAmount);

            return (
              <div key={log.id} className={styles.logItem}>
                <div className={cx(styles.typeIcon, TYPE_ICON_CLASS[log.type])} aria-hidden="true">
                  {renderTypeIcon(log.type)}
                </div>

                <div className={styles.logInfo}>
                  <div className={styles.logTopRow}>
                    <span className={styles.logDesc}>{log.description}</span>
                    <span className={cx(styles.typeTag, TYPE_TAG_CLASS[log.type])}>
                      {NEW_CUSTOMER_QUOTA_LOG_TYPE_LABELS[log.type]}
                    </span>
                  </div>
                  <div className={styles.logBottomRow}>
                    <span className={styles.logTime}>{formatLogTime(log.createdAt)}</span>
                    <span className={styles.logBalance}>
                      余额{' '}
                      <span className={styles.logBalanceVal}>{safeNum(log.balanceAfter).toLocaleString('zh-CN')}</span>{' '}
                      位
                    </span>
                  </div>
                </div>

                <div
                  className={cx(styles.logAmount, amount >= 0 ? styles.logAmountIncrease : styles.logAmountDecrease)}
                >
                  {amount > 0 ? `+${amount}` : amount}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

const NewCustomerQuotaLogList = React.memo(NewCustomerQuotaLogListComponent);

export default NewCustomerQuotaLogList;
