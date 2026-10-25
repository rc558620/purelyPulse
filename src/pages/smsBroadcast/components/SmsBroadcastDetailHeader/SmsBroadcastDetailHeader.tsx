// smsBroadcast 单门店详情头部：主账号头像 / 名称 / 手机号 + 当前短信余额 + 快捷赠送入口
import React from 'react';
import { cx, safeNum } from '@utils/utils';
import { SMS_BROADCAST_HEALTH_LABELS, resolveSmsAccountHealth } from '../../smsBroadcast.constants';
import { formatFen } from '../../smsBroadcast.utils';
import type { SmsAccount, SmsBroadcastHealth } from '../../smsBroadcast.types';
import styles from './SmsBroadcastDetailHeader.module.less';

interface SmsBroadcastDetailHeaderProps {
  account: SmsAccount;
  isSubmitting: boolean;
  onAdjust: (store: SmsAccount) => void;
}

/** 健康度 → 标签样式：用映射表取类名，避免模板字符串拼 className */
const HEALTH_TAG_CLASS: Record<SmsBroadcastHealth, string> = {
  none: styles.detailHealthTagNone,
  healthy: styles.detailHealthTagHealthy,
  warning: styles.detailHealthTagWarning,
  exhausted: styles.detailHealthTagExhausted,
};

const SmsBroadcastDetailHeaderComponent: React.FC<SmsBroadcastDetailHeaderProps> = ({
  account,
  isSubmitting,
  onAdjust,
}) => {
  const health = resolveSmsAccountHealth(account);

  return (
    <div className={styles.detailHeaderCard}>
      <div
        className={cx(styles.detailAvatar, account.ownerAvatarUrl && styles.detailAvatarWithImage)}
        aria-hidden="true"
      >
        {account.ownerAvatarUrl ? (
          <img className={styles.detailAvatarImg} src={account.ownerAvatarUrl} alt="" />
        ) : (
          account.ownerName[0]
        )}
      </div>

      <div className={styles.detailInfo}>
        <div className={styles.detailNameRow}>
          <span className={styles.detailName}>{account.ownerName}</span>
          <span className={cx(styles.detailHealthTag, HEALTH_TAG_CLASS[health])}>
            {SMS_BROADCAST_HEALTH_LABELS[health]}
          </span>
        </div>
        <span className={styles.detailPhone}>{account.ownerPhone || '未绑定手机号'}</span>
        <span className={styles.detailStoreName}>{account.storeName}</span>
      </div>

      <div className={styles.detailRight}>
        <div className={styles.detailBalance}>
          <span className={styles.detailBalanceVal}>{formatFen(safeNum(account.balanceFen))}</span>
          <span className={styles.detailBalanceUnit}>可用余额</span>
        </div>
        <button
          type="button"
          className={styles.detailAdjustBtn}
          onClick={() => onAdjust(account)}
          aria-label={`调整 ${account.ownerName} 的短信余额`}
          disabled={isSubmitting}
        >
          设置额度
        </button>
      </div>
    </div>
  );
};

const SmsBroadcastDetailHeader = React.memo(SmsBroadcastDetailHeaderComponent);

export default SmsBroadcastDetailHeader;
