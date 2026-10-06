// 新客额度门店一览区块：展示门店主账号身份与剩余额度，并支持逐个调整。
// 加载 / 失败 / 空态在本组件内呈现，滚动与下拉刷新由外层 PullRefreshLoadMore 接管。
import React from 'react';
import { cx, isNonEmptyArray, safeNum } from '@utils/utils';
import {
  NEW_CUSTOMER_QUOTA_HEALTH_LABELS,
  resolveQuotaHealth,
} from '../../newCustomerQuota.constants';
import { IconNewCustomerQuotaStore } from '../NewCustomerQuotaIcons/NewCustomerQuotaIcons';
import NewCustomerQuotaPageState from '../NewCustomerQuotaPageState/NewCustomerQuotaPageState';
import type { NewCustomerQuotaStore } from '../../newCustomerQuota.types';
import styles from './NewCustomerQuotaStoreList.module.less';

interface NewCustomerQuotaStoreListProps {
  isSubmitting: boolean;
  stores: NewCustomerQuotaStore[];
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
  onAdjust: (store: NewCustomerQuotaStore) => void;
}

const NewCustomerQuotaStoreListComponent: React.FC<NewCustomerQuotaStoreListProps> = ({
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
          <IconNewCustomerQuotaStore />
          门店额度一览
        </span>
        <span className={styles.listCount}>{safeNum(totalCount)} 家</span>
      </div>

      {showFullLoading ? <NewCustomerQuotaPageState message="加载中..." variant="loading" /> : null}
      {showFullError ? (
        <NewCustomerQuotaPageState message={errorMessage} variant="error" onRetry={onRetry} />
      ) : null}
      {showEmpty ? (
        <NewCustomerQuotaPageState message="暂无符合条件的门店" variant="empty" />
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
          const health = resolveQuotaHealth(store);

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
                    {NEW_CUSTOMER_QUOTA_HEALTH_LABELS[health]}
                  </span>
                </div>
                <span className={styles.storePhone}>
                  {store.ownerPhone || '未绑定手机号'}
                </span>
              </div>

              <div className={styles.storeQuota}>
                <div className={styles.storeQuotaRow}>
                  <span className={cx(styles.storeQuotaVal, styles[`storeQuotaVal_${health}`])}>
                    {safeNum(store.remaining).toLocaleString('zh-CN')}
                  </span>
                  <span className={styles.storeQuotaUnit}>位新客</span>
                </div>
                <span className={styles.storeConsumed}>
                  已服务 {safeNum(store.consumed).toLocaleString('zh-CN')} 位
                </span>
              </div>

              <button
                type="button"
                className={styles.adjustBtn}
                onClick={() => onAdjust(store)}
                aria-label={`调整 ${store.ownerName} 的新客额度`}
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

const NewCustomerQuotaStoreList = React.memo(NewCustomerQuotaStoreListComponent);

export default NewCustomerQuotaStoreList;
