// 短信余额门店选择弹层：服务端关键词搜索选店，选中后进入赠送 / 回收弹窗
import React from 'react';
import { cx, isNonEmptyArray, safeNum } from '@utils/utils';
import {
  SMS_BROADCAST_HEALTH_LABELS,
  resolveSmsAccountHealth,
} from '../../smsBroadcast.constants';
import { formatFen } from '../../smsBroadcast.utils';
import { IconSmsBroadcastClose } from '../SmsBroadcastIcons/SmsBroadcastIcons';
import type { SmsAccount } from '../../smsBroadcast.types';
import styles from './SmsBroadcastAccountPicker.module.less';

interface SmsBroadcastAccountPickerProps {
  isSubmitting: boolean;
  searchQuery: string;
  stores: SmsAccount[];
  hasMore: boolean;
  /** 搜索请求中 */
  isLoading: boolean;
  /** 加载更多请求中（与搜索分开，按钮才能给出在途反馈） */
  isLoadingMore: boolean;
  errorMessage: string;
  onClose: () => void;
  onSearchChange: (value: string) => void;
  onLoadMore: () => Promise<void>;
  onRetry: () => void;
  onSelect: (store: SmsAccount) => void;
}

const SmsBroadcastAccountPickerComponent: React.FC<SmsBroadcastAccountPickerProps> = ({
  isSubmitting,
  searchQuery,
  stores,
  hasMore,
  isLoading,
  isLoadingMore,
  errorMessage,
  onClose,
  onSearchChange,
  onLoadMore,
  onRetry,
  onSelect,
}) => {
  const shouldShowList = isNonEmptyArray(stores);

  return (
    <div
      className={styles.pickerOverlay}
      role="dialog"
      aria-modal="true"
      aria-label="选择要调整短信余额的门店"
    >
      <div className={styles.pickerCard} onClick={(event) => event.stopPropagation()}>
        <div className={styles.pickerHeader}>
          <span className={styles.pickerTitle}>选择门店</span>
          <button type="button" className={styles.pickerClose} onClick={onClose} aria-label="关闭">
            <IconSmsBroadcastClose />
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
          {errorMessage && !shouldShowList ? (
            <button type="button" className={styles.pickerRetryBtn} onClick={onRetry}>
              {errorMessage}，点击重试
            </button>
          ) : null}
          {!errorMessage && !shouldShowList && isLoading ? (
            <div className={styles.emptyState} role="status">
              <span>搜索中...</span>
            </div>
          ) : null}
          {!errorMessage && !shouldShowList && !isLoading ? (
            <div className={styles.emptyState} role="status">
              <span>暂无匹配门店</span>
            </div>
          ) : null}
          {shouldShowList ? (
            <>
              {stores.map((store) => {
                const health = resolveSmsAccountHealth(store);

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
                            {SMS_BROADCAST_HEALTH_LABELS[health]}
                          </span>
                        ) : null}
                      </div>
                      <span className={styles.pickerStorePhone}>
                        {store.ownerPhone || '未绑定手机号'}
                      </span>
                    </div>
                    <div className={cx(styles.pickerQuota, safeNum(store.balanceFen) <= 0 && styles.pickerQuotaExhausted)}>
                      <span className={styles.pickerQuotaVal}>
                        {formatFen(safeNum(store.balanceFen))}
                      </span>
                      <span className={styles.pickerQuotaLbl}>当前余额</span>
                    </div>
                  </button>
                );
              })}
              {hasMore ? (
                <button
                  type="button"
                  className={styles.pickerLoadMoreBtn}
                  onClick={onLoadMore}
                  disabled={isLoading || isLoadingMore || isSubmitting}
                >
                  {isLoadingMore ? '加载中...' : '加载更多'}
                </button>
              ) : null}
              {errorMessage && shouldShowList ? (
                <button type="button" className={styles.pickerRetryBtn} onClick={onRetry}>
                  {errorMessage}，点击重试
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const SmsBroadcastAccountPicker = React.memo(SmsBroadcastAccountPickerComponent);

export default SmsBroadcastAccountPicker;
