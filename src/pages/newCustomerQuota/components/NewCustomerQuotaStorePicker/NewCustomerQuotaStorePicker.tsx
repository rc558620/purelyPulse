// 新客额度门店选择弹层：选中门店后进入额度调整弹窗
import React from 'react';
import { cx, isNonEmptyArray, safeNum } from '@utils/utils';
import {
  NEW_CUSTOMER_QUOTA_HEALTH_LABELS,
  resolveQuotaHealth,
} from '../../newCustomerQuota.constants';
import { IconNewCustomerQuotaClose } from '../NewCustomerQuotaIcons/NewCustomerQuotaIcons';
import type { NewCustomerQuotaStore } from '../../newCustomerQuota.types';
import styles from './NewCustomerQuotaStorePicker.module.less';

interface NewCustomerQuotaStorePickerProps {
  isSubmitting: boolean;
  searchQuery: string;
  stores: NewCustomerQuotaStore[];
  onClose: () => void;
  onSearchChange: (value: string) => void;
  onSelect: (store: NewCustomerQuotaStore) => void;
}

const NewCustomerQuotaStorePickerComponent: React.FC<NewCustomerQuotaStorePickerProps> = ({
  isSubmitting,
  searchQuery,
  stores,
  onClose,
  onSearchChange,
  onSelect,
}) => (
  <div
    className={styles.pickerOverlay}
    role="dialog"
    aria-modal="true"
    aria-label="选择要调整新客额度的门店"
  >
    <div className={styles.pickerCard} onClick={(event) => event.stopPropagation()}>
      <div className={styles.pickerHeader}>
        <span className={styles.pickerTitle}>选择门店</span>
        <button type="button" className={styles.pickerClose} onClick={onClose} aria-label="关闭">
          <IconNewCustomerQuotaClose />
        </button>
      </div>
      <div className={styles.pickerSearch}>
        <input
          className={styles.pickerSearchInput}
          type="text"
          placeholder="搜索昵称 / 手机号 / 门店名..."
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          autoFocus
          aria-label="搜索门店主账号"
        />
      </div>
      <div className={styles.pickerList}>
        {isNonEmptyArray(stores) ? (
          stores.map((store) => {
            const health = resolveQuotaHealth(store);

            return (
              <button
                key={store.id}
                type="button"
                className={styles.pickerStoreItem}
                onClick={() => onSelect(store)}
                disabled={isSubmitting}
              >
                <div
                  className={cx(styles.pickerAvatar, store.ownerAvatarUrl && styles.pickerAvatarWithImage)}
                  aria-hidden="true"
                >
                  {store.ownerAvatarUrl ? (
                    <img className={styles.pickerAvatarImg} src={store.ownerAvatarUrl} alt="" />
                  ) : (
                    store.ownerName[0]
                  )}
                </div>
                <div className={styles.pickerStoreInfo}>
                  <div className={styles.pickerStoreNameRow}>
                    <span className={styles.pickerStoreName}>{store.ownerName}</span>
                    {health === 'exhausted' || health === 'none' ? (
                      <span className={cx(styles.pickerHealthTag, styles[`pickerHealthTag_${health}`])}>
                        {NEW_CUSTOMER_QUOTA_HEALTH_LABELS[health]}
                      </span>
                    ) : null}
                  </div>
                  <span className={styles.pickerStorePhone}>
                    {store.ownerPhone || '未绑定手机号'}
                  </span>
                </div>
                <div className={cx(styles.pickerQuota, safeNum(store.remaining) <= 0 && styles.pickerQuotaExhausted)}>
                  <span className={styles.pickerQuotaVal}>
                    {safeNum(store.remaining).toLocaleString('zh-CN')}
                  </span>
                  <span className={styles.pickerQuotaLbl}>位新客</span>
                </div>
              </button>
            );
          })
        ) : (
          <div className={styles.emptyState} role="status">
            <span>暂无匹配门店</span>
          </div>
        )}
      </div>
    </div>
  </div>
);

const NewCustomerQuotaStorePicker = React.memo(NewCustomerQuotaStorePickerComponent);

export default NewCustomerQuotaStorePicker;
