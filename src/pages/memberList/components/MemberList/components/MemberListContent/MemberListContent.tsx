// 会员列表内容区：根据请求状态分发加载中 / 错误 / 空 / 正常列表视图。
import React, { memo, useMemo } from 'react';
import { isNonEmptyArray, safeNum } from '@utils/utils';
import { IconMembers } from '../MemberListIcons/MemberListIcons';
import MemberListCard from '../MemberListCard/MemberListCard';
import type { MemberListItem } from '../../../../memberList.types';
import styles from '../../../../memberList.module.less';

interface MemberListContentProps {
  /** 会员列表数据（分页累积） */
  members: MemberListItem[];
  /** 当前筛选条件下的会员总数（后端权威计算，与分页无关） */
  totalCount: number;
  /** 是否首屏加载中 */
  isLoading: boolean;
  /** 是否刷新中 */
  isRefreshing: boolean;
  /** 错误信息（无错误为空字符串） */
  errorMessage: string;
  /** 重新加载回调 */
  onRetry: () => void;
  /** 卡片点击回调 */
  onCardClick: (id: string) => void;
  /**
   * 空态主文案；不传时用通用兜底文案。
   * 清单型筛选（待补录 / 已调续费价）需要说明「筛的是什么」，否则运营分不清是没数据还是筛错了。
   */
  emptyTitle?: string;
  /** 空态副文案：给下一步动作。 */
  emptyDescription?: string;
}

const MemberListContent: React.FC<MemberListContentProps> = ({
  members,
  totalCount,
  isLoading,
  isRefreshing,
  errorMessage,
  onRetry,
  onCardClick,
  emptyTitle,
  emptyDescription,
}) => {
  const showEmptyState = !isLoading && !errorMessage && !isNonEmptyArray(members);
  const showList = !isLoading && !errorMessage && isNonEmptyArray(members);
  const renderedMemberCards = useMemo(() => members.map((member) => (
    <MemberListCard
      key={`${member.id}-${member.avatarUrl ?? ''}`}
      member={member}
      onClick={onCardClick}
    />
  )), [members, onCardClick]);

  return (
    <div className={styles.listCard}>
      {/* 标题栏 */}
      <div className={styles.listHeader}>
        <span className={styles.listTitle}>会员列表</span>
        <span className={styles.listCount}>
          {isRefreshing ? '刷新中...' : `共 ${safeNum(totalCount)} 位`}
        </span>
      </div>

      {/* 加载态 */}
      {isLoading ? (
        <div className={styles.emptyState} role="status">
          <span>会员列表加载中...</span>
        </div>
      ) : null}

      {/* 错误态 */}
      {!isLoading && errorMessage ? (
        <div className={styles.emptyState} role="alert">
          <span>{errorMessage}</span>
          <button type="button" className={styles.retryBtn} onClick={onRetry}>
            重新加载
          </button>
        </div>
      ) : null}

      {/* 空态 */}
      {showEmptyState ? (
        <div className={styles.emptyState} role="status">
          <IconMembers width={44} height={44} strokeWidth={1.3} />
          <span className={styles.emptyStateTitle}>{emptyTitle ?? '暂无符合条件的会员'}</span>
          {emptyDescription ? (
            <span className={styles.emptyStateDesc}>{emptyDescription}</span>
          ) : null}
        </div>
      ) : null}

      {/* 正常列表 */}
      {showList ? (
        <div className={styles.memberList}>
          {renderedMemberCards}
        </div>
      ) : null}
    </div>
  );
};

export default memo(MemberListContent);
