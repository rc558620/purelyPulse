// partnerBeans 变动记录列表区块
import React from 'react';
import { cx, isNonEmptyArray, safeNum } from '@utils/utils';
import { PARTNER_BEANS_SOURCE_LABELS } from '../../partnerBeans.constants';
import type { PartnerBeansPageRecord } from '../../partnerBeans.types';
import {
  IconPartnerBeansEarn,
  IconPartnerBeansQuestion,
  IconPartnerBeansRelatedUser,
  IconPartnerBeansSpend,
  IconPartnerBeansWithdraw,
} from '../PartnerBeansIcons/PartnerBeansIcons';
import styles from './PartnerBeansRecordList.module.less';

interface PartnerBeansRecordListProps {
  records: PartnerBeansPageRecord[];
}

const formatPartnerBeansTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const renderRecordTypeIcon = (record: PartnerBeansPageRecord): React.ReactNode => {
  if (record.type === 'earn') {
    return <IconPartnerBeansEarn />;
  }
  if (record.source === 'withdrawal') {
    return <IconPartnerBeansWithdraw />;
  }
  return <IconPartnerBeansSpend />;
};

const getRecordClassNames = (record: PartnerBeansPageRecord) => {
  const isEarn = record.type === 'earn';
  const isWithdraw = record.source === 'withdrawal';

  return {
    amountClassName: cx(
      styles.recordAmount,
      isEarn && styles.recordAmountEarn,
      isWithdraw && styles.recordAmountWithdraw,
      !isEarn && !isWithdraw && styles.recordAmountSpend,
    ),
    typeIconClassName: cx(
      styles.recordTypeIcon,
      isEarn && styles.recordTypeIconEarn,
      isWithdraw && styles.recordTypeIconWithdraw,
      !isEarn && !isWithdraw && styles.recordTypeIconSpend,
    ),
  };
};

const PartnerBeansRecordListComponent: React.FC<PartnerBeansRecordListProps> = ({ records }) => (
  <div className={styles.listCard}>
    <div className={styles.listHeader}>
      <span className={styles.listTitle}>变动记录</span>
      <span className={styles.listCount}>{safeNum(records.length)} 条</span>
    </div>

    {isNonEmptyArray(records) ? (
      <div className={styles.recordList}>
        {records.map((record) => {
          const classNames = getRecordClassNames(record);

          return (
            <div key={record.id} className={styles.recordItem}>
              <div className={styles.recordLeft}>
                <div
                  className={cx(styles.recordAvatar, record.avatarUrl && styles.recordAvatarWithImage)}
                  aria-hidden="true"
                >
                  {record.avatarUrl ? (
                    <img className={styles.recordAvatarImg} src={record.avatarUrl} alt="" />
                  ) : (
                    record.userName[0]
                  )}
                </div>
                <div className={classNames.typeIconClassName} aria-hidden="true">
                  {renderRecordTypeIcon(record)}
                </div>
              </div>

              <div className={styles.recordInfo}>
                <div className={styles.recordTopRow}>
                  <span className={styles.recordUserName}>{record.userName}</span>
                  <span className={styles.recordPhone}>{record.userPhone}</span>
                  <span
                    className={cx(
                      styles.recordSourceTag,
                      record.source === 'admin_adjust' && styles.recordSourceTagAdmin,
                      record.source === 'promo_reward' && styles.recordSourceTagPromo,
                      record.source === 'withdrawal' && styles.recordSourceTagWithdraw,
                    )}
                  >
                    {PARTNER_BEANS_SOURCE_LABELS[record.source]}
                  </span>
                </div>
                <div className={styles.recordDesc}>{record.description}</div>
                {record.relatedUser ? (
                  <div className={styles.recordRelatedUser}>
                    <IconPartnerBeansRelatedUser />
                    被推广人：{record.relatedUser}
                  </div>
                ) : null}
                <div className={styles.recordBottomRow}>
                  <span className={styles.recordTime}>{formatPartnerBeansTime(record.createdAt)}</span>
                  <span className={styles.recordBalance}>
                    余额 <span className={styles.recordBalanceVal}>{safeNum(record.beanBalance).toLocaleString('zh-CN')}</span> 豆
                  </span>
                </div>
              </div>

              <div className={classNames.amountClassName}>
                {record.amount > 0 ? `+${record.amount}` : record.amount}
              </div>
            </div>
          );
        })}
      </div>
    ) : (
      <div className={styles.emptyState} role="status">
        <IconPartnerBeansQuestion />
        <span>暂无纯利豆记录</span>
      </div>
    )}
  </div>
);

const PartnerBeansRecordList = React.memo(PartnerBeansRecordListComponent);

export default PartnerBeansRecordList;
