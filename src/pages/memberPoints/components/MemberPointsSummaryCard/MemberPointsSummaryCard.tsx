// memberPoints 会员积分一览区块：点击 item 进入单会员变动记录。
import React from 'react';
import { cx, isNonEmptyArray, safeNum, safeStr } from '@utils/utils';
import { IconMemberPointsBadge } from '../MemberPointsIcons/MemberPointsIcons';
import MemberPointsPageState from '../MemberPointsPageState/MemberPointsPageState';
import type { MemberPointsPageUser } from '../../memberPoints.types';
import styles from './MemberPointsSummaryCard.module.less';

interface MemberPointsSummaryCardProps {
  /** 首屏加载中：积分一览先于页面就位，避免短暂闪一下「暂无数据」 */
  isLoading: boolean;
  isSubmitting: boolean;
  users: MemberPointsPageUser[];
  /** 当前关键词下的会员总数（后端口径，与已加载页数无关） */
  totalCount: number;
  /** 首屏错误文案：非空时整卡展示「失败 + 重试」 */
  errorMessage?: string;
  /** 首屏失败后的重试回调 */
  onRetry?: () => void;
  /** 点击 item：进入单会员变动记录视图 */
  onOpen: (user: MemberPointsPageUser) => void;
  onAdjust: (user: MemberPointsPageUser) => void;
}

const MemberPointsSummaryCardComponent: React.FC<MemberPointsSummaryCardProps> = ({
  isLoading,
  isSubmitting,
  users,
  totalCount,
  errorMessage = '',
  onRetry,
  onOpen,
  onAdjust,
}) => (
  <div className={styles.summaryCard}>
    <div className={styles.summaryTitle}>
      <IconMemberPointsBadge />
      会员积分一览
      <span className={styles.summaryCount}>共 {safeNum(totalCount).toLocaleString('zh-CN')} 位</span>
    </div>
    {isLoading ? (
      <MemberPointsPageState message="会员积分加载中..." variant="loading" />
    ) : null}
    {!isLoading && errorMessage ? (
      <MemberPointsPageState message={errorMessage} variant="error" onRetry={onRetry} />
    ) : null}
    {!isLoading && !errorMessage && isNonEmptyArray(users) ? (
      <div className={styles.memberList}>
        {users.map((user) => (
          <div
            key={user.id}
            className={cx(styles.memberItem, styles.memberItemActionable)}
            role="button"
            tabIndex={0}
            onClick={() => onOpen(user)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onOpen(user);
              }
            }}
            aria-label={`查看 ${user.name} 的积分变动记录`}
          >
            <div className={cx(styles.memberAvatar, user.avatarUrl && styles.memberAvatarWithImage)} aria-hidden="true">
              {user.avatarUrl ? (
                <img className={styles.memberAvatarImg} src={user.avatarUrl} alt="" />
              ) : (
                safeStr(user.name, '会').slice(0, 1)
              )}
            </div>
            <div className={styles.memberInfo}>
              <span className={styles.memberName}>{user.name}</span>
              <span className={styles.memberPhone}>{user.phone}</span>
            </div>
            <div className={styles.memberPoints}>
              <span className={styles.memberPointsVal}>{safeNum(user.availablePoints).toLocaleString('zh-CN')}</span>
              <span className={styles.memberPointsUnit}>积分</span>
            </div>
            <button
              type="button"
              className={styles.quickAdjustBtn}
              onClick={(event) => {
                // 调整按钮不再向上冒泡：点击调整不应顺带打开变动记录
                event.stopPropagation();
                onAdjust(user);
              }}
              aria-label={`调整 ${user.name} 的积分`}
              disabled={isSubmitting}
            >
              调整
            </button>
          </div>
        ))}
      </div>
    ) : null}
    {!isLoading && !errorMessage && !isNonEmptyArray(users) ? (
      <MemberPointsPageState message="暂无会员积分数据" variant="empty" />
    ) : null}
  </div>
);

const MemberPointsSummaryCard = React.memo(MemberPointsSummaryCardComponent);

export default MemberPointsSummaryCard;
