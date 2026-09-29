// 记录列表卡：标题与条数 + 加载 / 错误 / 空 / 正常四种态。
//
// 「下拉刷新 / 上拉加载更多」由外层 PullRefreshLoadMore 承载，
// 这里只负责列表内容本身，不再自己画加载更多与回顶。
import React, { useMemo } from 'react';
import { EmptyState } from '@components/ui/feedback';
import { isNonEmptyArray } from '@utils/utils';
import { IconRecordEmpty } from '../../../../memberRecordsIcons';
import { buildMemberRecordsQuerySummary } from '../../../../memberRecords.utils';
import MemberRecordsRow from '../MemberRecordsRow/MemberRecordsRow';
import styles from '../../../../memberRecords.module.less';
import type { MemberRecordItem, MemberRecordsQuery } from '../../../../memberRecords.types';

interface MemberRecordsListCardProps {
  records: MemberRecordItem[];
  /** 当前生效的查询条件：用于列表卡副标题摘要。 */
  appliedQuery: MemberRecordsQuery;
  /** 首屏加载中。 */
  isInitialLoading: boolean;
  /** 下拉刷新中。 */
  isRefreshing: boolean;
  /** 加载更多中。 */
  isLoadingMore: boolean;
  /** 首屏错误文案。 */
  errorMessage: string;
  /** 重新加载回调。 */
  onRetry: () => void;
}

const MemberRecordsListCard: React.FC<MemberRecordsListCardProps> = ({
  records,
  appliedQuery,
  isInitialLoading,
  isRefreshing,
  isLoadingMore,
  errorMessage,
  onRetry,
}) => {
  const querySummary = useMemo(() => buildMemberRecordsQuerySummary(appliedQuery), [appliedQuery]);
  const hasRecords = isNonEmptyArray(records);
  const showList = !isInitialLoading && !errorMessage && hasRecords;
  const showEmpty = !isInitialLoading && !errorMessage && !hasRecords;
  const showError = !isInitialLoading && Boolean(errorMessage);

  const renderedRows = useMemo(() => records.map((record, index) => (
    <MemberRecordsRow
      // 四类记录来自三张表、id 各自自增：单用 id 会跨类型撞 key
      // （充值 #2 与调价 #2 同屏时 React 会复用错行），类型 + id 才是全局唯一
      key={`${record.type}-${record.id}`}
      record={record}
      isLast={index === records.length - 1}
    />
  )), [records]);

  const countText = ((): string => {
    if (isInitialLoading) return '加载中...';
    if (isRefreshing) return '刷新中...';
    if (isLoadingMore) return '加载更多中...';
    return `共 ${records.length} 条`;
  })();

  return (
    <section className={styles.listCard}>
      <div className={styles.listHeader}>
        <div className={styles.listHeaderMain}>
          <span className={styles.listTitle}>记录明细</span>
          <span className={styles.listSub}>{querySummary}</span>
        </div>
        <span className={styles.listCount}>{countText}</span>
      </div>

      {isInitialLoading ? (
        <div className={styles.stateBox} role="status">
          <span className={styles.stateText}>会员记录加载中...</span>
        </div>
      ) : null}

      {showError ? (
        <div className={styles.stateBox} role="alert">
          <span className={styles.stateText}>{errorMessage}</span>
          <button type="button" className={styles.retryBtn} onClick={onRetry}>
            重新加载
          </button>
        </div>
      ) : null}

      {showEmpty ? (
        <EmptyState
          icon={<IconRecordEmpty />}
          title="暂无匹配的会员记录"
          desc="当前条件下没有查到的记录，试试放宽日期范围、切换记录类型或会员等级。"
        />
      ) : null}

      {showList ? <div className={styles.recordList}>{renderedRows}</div> : null}
    </section>
  );
};

export default React.memo(MemberRecordsListCard);
