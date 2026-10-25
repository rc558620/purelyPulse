// 门店短信余额一览区块：展示门店主账号身份与可用余额，并支持逐个调整。
// 点击整行进入该门店的短信钱包变动记录；加载 / 失败 / 空态在本组件内呈现，
// 滚动与下拉刷新由外层 PullRefreshLoadMore 接管。
import React from 'react';
import { cx, isNonEmptyArray, safeNum } from '@utils/utils';
import {
  SMS_BROADCAST_HEALTH_LABELS,
  resolveSmsAccountHealth,
} from '../../smsBroadcast.constants';
import { formatFen } from '../../smsBroadcast.utils';
import { IconSmsAccount } from '../SmsBroadcastIcons/SmsBroadcastIcons';
import SmsBroadcastPageState from '../SmsBroadcastPageState/SmsBroadcastPageState';
import type { SmsAccount, SmsBroadcastHealth } from '../../smsBroadcast.types';
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
  /** 点击门店行：进入该门店的短信钱包变动记录 */
  onOpen: (store: SmsAccount) => void;
  onAdjust: (store: SmsAccount) => void;
}

/** 健康度 → 标签/余额着色类名：用映射表取类名，避免模板字符串拼 className */
const HEALTH_TAG_CLASS: Record<SmsBroadcastHealth, string> = {
  none: styles.storeHealthTagNone,
  healthy: styles.storeHealthTagHealthy,
  warning: styles.storeHealthTagWarning,
  exhausted: styles.storeHealthTagExhausted,
};

const HEALTH_BALANCE_CLASS: Record<SmsBroadcastHealth, string> = {
  none: styles.storeQuotaValNone,
  healthy: styles.storeQuotaValHealthy,
  warning: styles.storeQuotaValWarning,
  exhausted: styles.storeQuotaValExhausted,
};

const SmsBroadcastAccountListComponent: React.FC<SmsBroadcastAccountListProps> = ({
  isSubmitting,
  stores,
  totalCount,
  isLoading,
  isRefreshing,
  errorMessage,
  onRetry,
  onOpen,
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
              <div
                key={store.id}
                className={cx(styles.storeItem, styles.storeItemActionable)}
                role="button"
                tabIndex={0}
                onClick={() => onOpen(store)}
                onKeyDown={(event) => {
                  // 只响应「行本身」的按键：行内还有「设置」按钮，
                  // 键盘 Enter / Space 会冒泡到这一层，不判来源会同时打开弹窗与变动记录
                  if (event.target !== event.currentTarget) {
                    return;
                  }
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onOpen(store);
                  }
                }}
                aria-label={`查看 ${store.ownerName} 的短信变动记录`}
              >
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
                    <span className={cx(styles.storeHealthTag, HEALTH_TAG_CLASS[health])}>
                      {SMS_BROADCAST_HEALTH_LABELS[health]}
                    </span>
                  </div>
                  <span className={styles.storePhone}>
                    {store.ownerPhone || '未绑定手机号'}
                  </span>
                </div>

                <div className={styles.storeQuota}>
                  <div className={styles.storeQuotaRow}>
                    <span className={cx(styles.storeQuotaVal, HEALTH_BALANCE_CLASS[health])}>
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
                  onClick={(event) => {
                    // 设置按钮不再向上冒泡：点击设置不应顺带打开变动记录
                    event.stopPropagation();
                    onAdjust(store);
                  }}
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
