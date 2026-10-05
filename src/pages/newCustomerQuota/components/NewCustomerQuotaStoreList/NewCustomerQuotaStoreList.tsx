// 新客额度门店一览区块：展示门店主账号身份与剩余额度，并支持逐个调整
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
  onAdjust: (store: NewCustomerQuotaStore) => void;
}

const NewCustomerQuotaStoreListComponent: React.FC<NewCustomerQuotaStoreListProps> = ({
  isSubmitting,
  stores,
  onAdjust,
}) => (
  <div className={styles.listCard}>
    <div className={styles.listHeader}>
      <span className={styles.listTitle}>
        <IconNewCustomerQuotaStore />
        门店额度一览
      </span>
      <span className={styles.listCount}>{safeNum(stores.length)} 家</span>
    </div>

    {isNonEmptyArray(stores) ? (
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
    ) : (
      <NewCustomerQuotaPageState message="暂无符合条件的门店" variant="empty" />
    )}
  </div>
);

const NewCustomerQuotaStoreList = React.memo(NewCustomerQuotaStoreListComponent);

export default NewCustomerQuotaStoreList;
