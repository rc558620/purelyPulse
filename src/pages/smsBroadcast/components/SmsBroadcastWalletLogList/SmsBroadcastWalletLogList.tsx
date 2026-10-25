// smsBroadcast 门店短信钱包变动记录列表：加载 / 失败 / 空 / 正常四种态
//
// 「下拉刷新 / 上拉加载更多」由外层 PullRefreshLoadMore 承载，这里只渲染列表内容。
import React from 'react';
import { cx, isNonEmptyArray, safeNum } from '@utils/utils';
import { SMS_BROADCAST_LOG_TYPE_LABELS } from '../../smsBroadcast.constants';
import { formatFen } from '../../smsBroadcast.utils';
import type { SmsWalletLog, SmsWalletLogType } from '../../smsBroadcast.types';
import {
  IconSmsBroadcastAdmin,
  IconSmsBroadcastDecrease,
  IconSmsBroadcastIncrease,
  IconSmsBroadcastLog,
  IconSmsBroadcastRecharge,
} from '../SmsBroadcastIcons/SmsBroadcastIcons';
import SmsBroadcastPageState from '../SmsBroadcastPageState/SmsBroadcastPageState';
import styles from './SmsBroadcastWalletLogList.module.less';

interface SmsBroadcastWalletLogListProps {
  /** 当前已加载的变动记录 */
  logs: SmsWalletLog[];
  /** 当前 Tab 下的记录总数（后端口径，与已加载页数无关） */
  totalCount: number;
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  /** 首屏错误文案 */
  errorMessage: string;
  onRetry: () => void;
}

/** 类型 → 标签着色类名（映射表取类名，避免模板字符串拼 className） */
const TYPE_TAG_CLASS: Record<SmsWalletLogType, string> = {
  recharge: styles.typeTagRecharge,
  consume: styles.typeTagConsume,
  refund: styles.typeTagRefund,
  grant: styles.typeTagGrant,
  admin_adjust: styles.typeTagAdmin,
  unknown: styles.typeTagUnknown,
};

/** 类型 → 图标底色类名 */
const TYPE_ICON_CLASS: Record<SmsWalletLogType, string> = {
  recharge: styles.typeIconRecharge,
  consume: styles.typeIconConsume,
  refund: styles.typeIconRefund,
  grant: styles.typeIconGrant,
  admin_adjust: styles.typeIconAdmin,
  unknown: styles.typeIconUnknown,
};

/** 类型 → 类型图标 */
const renderTypeIcon = (type: SmsWalletLogType): React.ReactNode => {
  if (type === 'recharge') {
    return <IconSmsBroadcastRecharge />;
  }
  if (type === 'admin_adjust') {
    return <IconSmsBroadcastAdmin />;
  }
  if (type === 'consume') {
    return <IconSmsBroadcastDecrease />;
  }
  return <IconSmsBroadcastIncrease />;
};

const formatLogTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/**
 * 变动金额文案：正负号由后端 changeFen 的符号决定，前端只负责符号与格式化。
 * 金额本身一律用后端返回值（分），这里不做任何金额换算。
 */
const buildChangeText = (changeFen: number): string => {
  if (changeFen === 0) {
    return formatFen(0);
  }

  return `${changeFen > 0 ? '+' : '−'}${formatFen(Math.abs(changeFen))}`;
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

const SmsBroadcastWalletLogListComponent: React.FC<SmsBroadcastWalletLogListProps> = ({
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
        <span className={styles.listTitle}>
          <IconSmsBroadcastLog />
          变动记录
        </span>
        <span className={styles.listCount}>{buildCountText(isInitialLoading, isLoadingMore, totalCount)}</span>
      </div>

      {isInitialLoading ? <SmsBroadcastPageState message="短信变动记录加载中..." variant="loading" /> : null}

      {showError ? <SmsBroadcastPageState message={errorMessage} variant="error" onRetry={onRetry} /> : null}

      {showEmpty ? (
        <SmsBroadcastPageState message="暂无符合条件的短信变动记录" variant="empty" />
      ) : null}

      {showList ? (
        <div className={styles.logList}>
          {logs.map((log) => {
            const changeFen = safeNum(log.changeFen);

            return (
              <div key={log.id} className={styles.logItem}>
                <div className={cx(styles.typeIcon, TYPE_ICON_CLASS[log.type])} aria-hidden="true">
                  {renderTypeIcon(log.type)}
                </div>

                <div className={styles.logInfo}>
                  <div className={styles.logTopRow}>
                    <span className={styles.logDesc}>{log.description || '短信余额变动'}</span>
                    <span className={cx(styles.typeTag, TYPE_TAG_CLASS[log.type])}>
                      {SMS_BROADCAST_LOG_TYPE_LABELS[log.type]}
                    </span>
                  </div>
                  <div className={styles.logBottomRow}>
                    <span className={styles.logTime}>{formatLogTime(safeNum(log.createdAt))}</span>
                    <span className={styles.logBalance}>
                      余额 <span className={styles.logBalanceVal}>{formatFen(safeNum(log.balanceAfterFen))}</span>
                    </span>
                  </div>
                </div>

                <div
                  className={cx(
                    styles.logAmount,
                    changeFen >= 0 ? styles.logAmountIncrease : styles.logAmountDecrease,
                  )}
                >
                  {buildChangeText(changeFen)}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

const SmsBroadcastWalletLogList = React.memo(SmsBroadcastWalletLogListComponent);

export default SmsBroadcastWalletLogList;
