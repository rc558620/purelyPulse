// SetSubAccountLockedPriceActions：成交价快照重置动作的二次确认分发出口。
import React from 'react';
import styles from '../../SetSubAccountModal.module.less';

interface SetSubAccountLockedPriceActionsProps {
  /** 是否处于二次确认态 */
  isResetConfirming: boolean;
  /** 是否正在重置成交价快照 */
  isResettingLockedPrice: boolean;
  /** 配额提交进行中时不允许发起重置，避免两条写请求同时打同一个会员 */
  isSubmitting: boolean;
  /** 请求进入二次确认 */
  onResetRequest: () => void;
  /** 退出二次确认 */
  onResetCancel: () => void;
  /** 提交重置 */
  onResetConfirm: () => void;
}

const SetSubAccountLockedPriceActions: React.FC<SetSubAccountLockedPriceActionsProps> = ({
  isResetConfirming,
  isResettingLockedPrice,
  isSubmitting,
  onResetRequest,
  onResetCancel,
  onResetConfirm,
}) => {
  if (isResetConfirming) {
    return (
      <div className={styles.lockedPriceActions}>
        <button
          type="button"
          className={styles.lockedPriceCancelBtn}
          onClick={onResetCancel}
          disabled={isResettingLockedPrice}
        >
          取消
        </button>
        <button
          type="button"
          className={styles.lockedPriceConfirmBtn}
          onClick={onResetConfirm}
          disabled={isResettingLockedPrice}
        >
          {isResettingLockedPrice ? '重置中...' : '确认重置'}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={styles.lockedPriceResetBtn}
      onClick={onResetRequest}
      disabled={isSubmitting || isResettingLockedPrice}
    >
      {isResettingLockedPrice ? '重置中...' : '重置锁定价'}
    </button>
  );
};

export default SetSubAccountLockedPriceActions;
