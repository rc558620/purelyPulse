// partnerBeans 合伙人余额总览区块
import React from 'react';
import { cx, isNonEmptyArray, safeNum } from '@utils/utils';
import { IconPartnerBeansSummary } from '../PartnerBeansIcons/PartnerBeansIcons';
import PartnerBeansPageState from '../PartnerBeansPageState/PartnerBeansPageState';
import type { PartnerBeansPageUser } from '../../partnerBeans.types';
import styles from './PartnerBeansSummaryCard.module.less';

interface PartnerBeansSummaryCardProps {
  /** 首屏加载中：合伙人余额一览先于页面就位，避免短暂闪一下「暂无数据」 */
  isLoading: boolean;
  isSubmitting: boolean;
  users: PartnerBeansPageUser[];
  /** 当前关键词下的合伙人总数（后端口径，与已加载页数无关） */
  totalCount: number;
  /** 首屏错误文案：非空时整卡展示「失败 + 重试」 */
  errorMessage?: string;
  /** 首屏失败后的重试回调 */
  onRetry?: () => void;
  /** 点击 item：进入单合伙人变动记录视图 */
  onOpen: (user: PartnerBeansPageUser) => void;
  onAdjust: (user: PartnerBeansPageUser) => void;
}

const PartnerBeansSummaryCardComponent: React.FC<PartnerBeansSummaryCardProps> = ({
  isLoading,
  isSubmitting,
  users,
  totalCount,
  errorMessage = '',
  onRetry,
  onOpen,
  onAdjust,
}) => (
  <div className={styles.partnerSummaryCard}>
    <div className={styles.partnerSummaryTitle}>
      <IconPartnerBeansSummary />
      合伙人余额一览
      <span className={styles.partnerSummaryCount}>共 {safeNum(totalCount).toLocaleString('zh-CN')} 位</span>
    </div>
    {isLoading ? (
      <PartnerBeansPageState message="合伙人余额加载中..." variant="loading" />
    ) : null}
    {!isLoading && errorMessage ? (
      <PartnerBeansPageState message={errorMessage} variant="error" onRetry={onRetry} />
    ) : null}
    {!isLoading && !errorMessage && isNonEmptyArray(users) ? (
      <div className={styles.partnerList}>
        {users.map((user) => (
          <div
            key={user.id}
            className={cx(styles.partnerItem, styles.partnerItemActionable)}
            role="button"
            tabIndex={0}
            onClick={() => onOpen(user)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onOpen(user);
              }
            }}
            aria-label={`查看 ${user.name} 的纯利豆变动记录`}
          >
            <div className={cx(styles.partnerAvatar, user.avatarUrl && styles.partnerAvatarWithImage)} aria-hidden="true">
              {user.avatarUrl ? <img className={styles.partnerAvatarImg} src={user.avatarUrl} alt="" /> : user.name[0]}
            </div>
            <div className={styles.partnerInfo}>
              <span className={styles.partnerName}>{user.name}</span>
              <span className={styles.partnerPhone}>{user.phone}</span>
            </div>
            <div className={styles.partnerBeanBalance}>
              <span className={styles.partnerBeanVal}>{safeNum(user.beanBalance).toLocaleString('zh-CN')}</span>
              <span className={styles.partnerBeanUnit}>豆</span>
            </div>
            <button
              type="button"
              className={styles.quickAdjustBtn}
              onClick={(event) => {
                // 调整按钮不再向上冒泡：点击调整不应顺带打开变动记录
                event.stopPropagation();
                onAdjust(user);
              }}
              aria-label={`调整 ${user.name} 的纯利豆`}
              disabled={isSubmitting}
            >
              调整
            </button>
          </div>
        ))}
      </div>
    ) : null}
    {!isLoading && !errorMessage && !isNonEmptyArray(users) ? (
      <PartnerBeansPageState message="暂无合伙人余额数据" variant="empty" />
    ) : null}
  </div>
);

const PartnerBeansSummaryCard = React.memo(PartnerBeansSummaryCardComponent);

export default PartnerBeansSummaryCard;
