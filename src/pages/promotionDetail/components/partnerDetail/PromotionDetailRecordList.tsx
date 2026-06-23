// 推广详情明细列表：负责渲染推广明细表头、记录行与空状态。
import React from 'react';
import { EmptyState } from '@components/ui/feedback';
import { cx, fmtAmount, isNonEmptyArray } from '@utils/utils';
import { IconPromotionDetailEmpty } from '../_shared/icons/PromotionDetailIcons';
import styles from '../../promotionDetail.module.less';
import { formatPromotionDetailCount } from '../../promotionDetail.utils';
import type { PromotionPeriodRecord, PromotionPeriodTab } from '../../promotionDetail.types';

export interface PromotionDetailRecordListProps {
  periodTab: PromotionPeriodTab;
  periodRecords: PromotionPeriodRecord[];
  showEmptyState: boolean;
}

const PromotionDetailRecordList: React.FC<PromotionDetailRecordListProps> = ({
  periodTab,
  periodRecords,
  showEmptyState,
}) => (
  <div className={styles.detailListCard}>
    <div className={styles.detailListHeader}>
      <span className={styles.detailListTitle}>推广明细</span>
      <span className={styles.detailListCount}>{formatPromotionDetailCount(periodRecords.length)} 条</span>
    </div>
    {!showEmptyState && isNonEmptyArray(periodRecords) ? (
      <>
        <div className={styles.detailListTableHead}>
          <span className={styles.detailThPeriod}>
            {periodTab === 'day' ? '日期' : periodTab === 'month' ? '月份' : '年份'}
          </span>
          <span className={styles.detailThOrders}>推广单数</span>
          <span className={styles.detailThRevenue}>推广金额</span>
        </div>
        <div className={styles.detailList}>
          {isNonEmptyArray(periodRecords) ? periodRecords.map((record, index) => (
            <div key={`${record.label}-${index}`} className={styles.detailListItem}>
              <span className={styles.detailItemPeriod}>{record.label}</span>
              <span className={styles.detailItemOrders}>{formatPromotionDetailCount(record.orders)} 单</span>
              <span className={cx(styles.detailItemRevenue, styles.colorEmerald)}>¥{fmtAmount(record.revenue)}</span>
            </div>
          )) : null}
        </div>
      </>
    ) : (
      <EmptyState
        icon={<IconPromotionDetailEmpty />}
        title="暂无推广明细"
        desc="试试切换到其他时间维度，查看该合伙人的历史推广表现。"
      />
    )}
  </div>
);

export default React.memo(PromotionDetailRecordList);
