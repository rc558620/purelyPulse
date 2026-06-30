// 充值收入明细页记录区：展示列表明细、空态与加载更多操作。
import { memo } from 'react';
import type * as React from 'react';
import { EmptyState } from '@components/ui/feedback';
import { cx, isNonEmptyArray, safeNum } from '@utils/utils';
import {
  IconRevenueDetailChevronDown,
  IconRevenueDetailEmpty,
  IconRevenueDetailList,
} from '../RevenueDetailIcons/RevenueDetailIcons';
import { getRevenueToneClassName, getRevenueTypeMeta } from '../../revenueDetail.shared';
import type { RevenueRecordItem } from '../../revenueDetail.types';
import sharedStyles from '../../revenueDetail.module.less';
import styles from './RevenueDetailRecordSection.module.less';

interface RevenueDetailRecordSectionProps {
  totalRecords: number;
  displayedRecords: RevenueRecordItem[];
  canLoadMoreRecords: boolean;
  loadMoreRecords: () => void;
}

const RevenueDetailRecordSectionComponent = ({
  totalRecords,
  displayedRecords,
  canLoadMoreRecords,
  loadMoreRecords,
}: RevenueDetailRecordSectionProps): React.JSX.Element => (
  <section className={cx(sharedStyles.detailSection, styles.root)}>
    <div className={sharedStyles.cardHeader}>
      <div className={cx(sharedStyles.cardHeaderIcon, sharedStyles.toneIndigo)} aria-hidden="true">
        <IconRevenueDetailList />
      </div>
      <h2 className={sharedStyles.cardTitle}>充值明细</h2>
      <span className={sharedStyles.detailCount}>{safeNum(totalRecords)}</span>
    </div>

    {isNonEmptyArray(displayedRecords) ? (
      <div className={sharedStyles.detailList}>
        {displayedRecords.map((record, index) => {
          const meta = getRevenueTypeMeta(record.type);
          return (
            <div key={record.id} className={sharedStyles.detailRow}>
              <span className={sharedStyles.detailIdx}>{String(index + 1).padStart(2, '0')}</span>
              <span className={cx(sharedStyles.detailTag, getRevenueToneClassName(meta.tone))}>
                {record.type}
              </span>
              <div className={sharedStyles.detailInfo}>
                <span className={sharedStyles.detailUser}>{record.user}</span>
                <span className={sharedStyles.detailRegion}>{record.region}</span>
              </div>
              <div className={sharedStyles.detailRight}>
                <span className={sharedStyles.detailAmount}>+¥{record.amountDisplay}</span>
                <span className={sharedStyles.detailTime}>{record.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    ) : (
      <div className={sharedStyles.detailEmptyState}>
        <EmptyState
          icon={<IconRevenueDetailEmpty />}
          title="暂无充值明细"
          desc="当前筛选条件下还没有可展示的充值记录"
        />
      </div>
    )}

    {canLoadMoreRecords ? (
      <button
        className={sharedStyles.loadMoreBtn}
        type="button"
        aria-label="加载更多充值记录"
        onClick={loadMoreRecords}
      >
        <IconRevenueDetailChevronDown width={14} height={14} />
        加载更多
      </button>
    ) : null}
  </section>
);

export const RevenueDetailRecordSection = memo(RevenueDetailRecordSectionComponent);

RevenueDetailRecordSection.displayName = 'RevenueDetailRecordSection';

export default RevenueDetailRecordSection;
