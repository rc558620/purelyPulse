// 门店短信余额一览区块：展示门店主账号身份与可用余额，并支持逐个调整。
// 加载 / 失败 / 空态在本组件内呈现，滚动与下拉刷新由外层 PullRefreshLoadMore 接管。
import React from 'react';
import { cx, isNonEmptyArray, safeNum } from '@utils/utils';
import {
  SMS_BROADCAST_HEALTH_LABELS,
  resolveSmsAccountHealth,
} from '../../smsBroadcast.constants';
import { formatFen } from '../../smsBroadcast.utils';
import { IconSmsAccount } from '../SmsBroadcastIcons/SmsBroadcastIcons';
import SmsBroadcastPageState from '../SmsBroadcastPageState/SmsBroadcastPageState';
import type { SmsAccount } from '../../smsBroadcast.types';
import styles from './SmsBroadcastAccountList.module.less';

interface SmsBroadcastAccountListProps {
  isSubmitting: boolean;
  stores: SmsAccount[];
  /**
   * 当前筛选条件命中的门店总数（后端统计，供列表头展示）。
   * 必须是接口返回的 total（含健康度筛选），不能是 stats.storeCount——
   * 后者只吃关键词过滤，切到「预警 / 已耗尽」Tab 时会与列表条数对不上。
   */
  totalCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  errorMessage: string;
  onRetry: () => void;
  onAdjust: (store: SmsAccount) => void;
}

const SmsBroadcastAccountListComponent: React.FC<SmsBroadcastAccountListProps> = ({
  isSubmitting,
  stores,
  totalCount,
  isLoading,
  isRefreshing,
  errorMessage,
  onRetry,
  onAdjust,
}) => {
  const hasStores = isNonEmptyArray(stores);
  // 首屏无内容时才整块占位；已有内容时用顶部横幅，保留列表不被错误态整块替换
  const showFullLoading = isLoading && !hasStores;
  const showFullError = !isLoading && !!errorMessage && !hasStores;
  const showEmpty = !isLoading && !errorMessage && !hasStores && !isRefreshing;

  return (
    <div className={styles.listCard}>
      <div className={styles.listHeader}>
        <span className={styles.listTitle}>
          <IconSmsAccount />
          门店短信余额
        </span>
        <span className={styles.listCount}>{safeNum(totalCount)} 家</span>
      </div>

      {showFullLoading ? <SmsBroadcastPageState message="加载中..." variant="loading" /> : null}
      {showFullError ? (
        <SmsBroadcastPageState message={errorMessage} variant="error" onRetry={onRetry} />
      ) : null}
      {showEmpty ? (
        <SmsBroadcastPageState message="暂无符合条件的门店" variant="empty" />
      ) : null}
      {hasStores && errorMessage ? (
        <div className={styles.listErrorBanner} role="alert">
          <span className={styles.listErrorText}>{errorMessage}</span>
          <button type="button" className={styles.listErrorRetry} onClick={onRetry}>
            重试
          </button>
        </div>
      ) : null}
      {hasStores ? (
        <div className={styles.storeList}>
        {stores.map((store) => {
          const health = resolveSmsAccountHealth(store);

          return (
            <div key={store.id} className={styles.storeItem}>
              <div
                className={cx(styles.storeAvatar, store.ownerAvatarUrl && styles.storeAvatarWithImage)}
                aria-hidden="true"
              >
                {store.ownerAvatarUrl ? (
                  <img className={styles.storeAvatarImg} src={store.ownerAvatarUrl} alt="" />
                ) : (
                  store.ownerName[0]
                )}
              </div>

              <div className={styles.storeInfo}>
                <div className={styles.storeTopRow}>
                  <span className={styles.storeName}>{store.ownerName}</span>
                  <span className={cx(styles.storeHealthTag, styles[`storeHealthTag_${health}`])}>
                    {SMS_BROADCAST_HEALTH_LABELS[health]}
                  </span>
                </div>
                <span className={styles.storePhone}>
                  {store.ownerPhone || '未绑定手机号'}
                </span>
              </div>

              <div className={styles.storeQuota}>
                <div className={styles.storeQuotaRow}>
                  <span className={cx(styles.storeQuotaVal, styles[`storeQuotaVal_${health}`])}>
                    {formatFen(safeNum(store.balanceFen))}
                  </span>
                </div>
                <span className={styles.storeConsumed}>
                  累计发送 {safeNum(store.sentSmsCount).toLocaleString('zh-CN')} 条
                </span>
              </div>

              <button
                type="button"
                className={styles.adjustBtn}
                onClick={() => onAdjust(store)}
                aria-label={`调整 ${store.ownerName} 的短信余额`}
                disabled={isSubmitting}
              >
                设置
              </button>
            </div>
          );
        })}
      </div>
      ) : null}
    </div>
  );
};

const SmsBroadcastAccountList = React.memo(SmsBroadcastAccountListComponent);

export default SmsBroadcastAccountList;
