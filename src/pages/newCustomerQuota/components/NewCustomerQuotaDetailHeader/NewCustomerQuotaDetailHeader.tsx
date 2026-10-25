// newCustomerQuota 单门店详情头部：主账号头像 / 名称 / 手机号 + 当前剩余额度 + 快捷设置入口
import React from 'react';
import { cx, safeNum } from '@utils/utils';
import { NEW_CUSTOMER_QUOTA_HEALTH_LABELS, resolveQuotaHealth } from '../../newCustomerQuota.constants';
import type { NewCustomerQuotaHealth, NewCustomerQuotaStore } from '../../newCustomerQuota.types';
import styles from './NewCustomerQuotaDetailHeader.module.less';

interface NewCustomerQuotaDetailHeaderProps {
  store: NewCustomerQuotaStore;
  isSubmitting: boolean;
  onAdjust: (store: NewCustomerQuotaStore) => void;
}

/** 健康度 → 标签样式：用映射表取类名，避免模板字符串拼 className */
const HEALTH_TAG_CLASS: Record<NewCustomerQuotaHealth, string> = {
  none: styles.detailHealthTagNone,
  healthy: styles.detailHealthTagHealthy,
  warning: styles.detailHealthTagWarning,
  exhausted: styles.detailHealthTagExhausted,
};

const NewCustomerQuotaDetailHeaderComponent: React.FC<NewCustomerQuotaDetailHeaderProps> = ({
  store,
  isSubmitting,
  onAdjust,
}) => {
  const health = resolveQuotaHealth(store);

  return (
    <div className={styles.detailHeaderCard}>
      <div className={cx(styles.detailAvatar, store.ownerAvatarUrl && styles.detailAvatarWithImage)} aria-hidden="true">
        {store.ownerAvatarUrl ? (
          <img className={styles.detailAvatarImg} src={store.ownerAvatarUrl} alt="" />
        ) : (
          store.ownerName[0]
        )}
      </div>

      <div className={styles.detailInfo}>
        <div className={styles.detailNameRow}>
          <span className={styles.detailName}>{store.ownerName}</span>
          <span className={cx(styles.detailHealthTag, HEALTH_TAG_CLASS[health])}>
            {NEW_CUSTOMER_QUOTA_HEALTH_LABELS[health]}
          </span>
        </div>
        <span className={styles.detailPhone}>{store.ownerPhone || '未绑定手机号'}</span>
        <span className={styles.detailStoreName}>{store.storeName}</span>
      </div>

      <div className={styles.detailRight}>
        <div className={styles.detailQuota}>
          <span className={styles.detailQuotaVal}>{safeNum(store.remaining).toLocaleString('zh-CN')}</span>
          <span className={styles.detailQuotaUnit}>位新客</span>
        </div>
        <button
          type="button"
          className={styles.detailAdjustBtn}
          onClick={() => onAdjust(store)}
          aria-label={`设置 ${store.ownerName} 的新客额度`}
          disabled={isSubmitting}
        >
          设置额度
        </button>
      </div>
    </div>
  );
};

const NewCustomerQuotaDetailHeader = React.memo(NewCustomerQuotaDetailHeaderComponent);

export default NewCustomerQuotaDetailHeader;
