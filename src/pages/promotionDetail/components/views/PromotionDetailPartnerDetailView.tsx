// 推广详情明细视图：负责装配合伙人头图、时间维度与详情叶子区块。
import React from 'react';
import { cx, fmtAmount, safeNum } from '@utils/utils';
import {
  IconPromotionDetailCurrency,
  IconPromotionDetailDayTab,
  IconPromotionDetailLocation,
  IconPromotionDetailMonthTab,
  IconPromotionDetailPulse,
  IconPromotionDetailTrendUp,
  IconPromotionDetailYearTab,
} from '../_shared/icons/PromotionDetailIcons';
import PromotionDetailRecordList from '../partnerDetail/PromotionDetailRecordList';
import PromotionDetailTrendChart from '../partnerDetail/PromotionDetailTrendChart';
import styles from '../../promotionDetail.module.less';
import { formatPromotionDetailCount } from '../../promotionDetail.utils';
import type { PromotionPartnerItem, PromotionPeriodRecord, PromotionPeriodTab } from '../../promotionDetail.types';

const PERIOD_TAB_OPTIONS: Array<{
  key: PromotionPeriodTab;
  label: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
}> = [
  { key: 'day', label: '每日', Icon: IconPromotionDetailDayTab },
  { key: 'month', label: '每月', Icon: IconPromotionDetailMonthTab },
  { key: 'year', label: '每年', Icon: IconPromotionDetailYearTab },
];

export interface PromotionDetailPartnerDetailViewProps {
  selectedPartner: PromotionPartnerItem;
  periodTab: PromotionPeriodTab;
  periodRecords: PromotionPeriodRecord[];
  detailTotal: {
    orders: number;
    revenue: number;
  };
  showEmptyState: boolean;
  onPeriodTabChange: (tab: PromotionPeriodTab) => void;
}

const PromotionDetailPartnerDetailView: React.FC<PromotionDetailPartnerDetailViewProps> = ({
  selectedPartner,
  periodTab,
  periodRecords,
  detailTotal,
  showEmptyState,
  onPeriodTabChange,
}) => (
  <>
    <div className={styles.partnerHeroCard}>
      <div className={styles.partnerHeroBg} aria-hidden="true" />
      <div className={styles.partnerHeroContent}>
        <div
          className={cx(
            styles.partnerHeroAvatar,
            selectedPartner.rank === 1 && styles.partnerAvatarGold,
            selectedPartner.rank === 2 && styles.partnerAvatarSilver,
            selectedPartner.rank === 3 && styles.partnerAvatarBronze,
            selectedPartner.avatarUrl && styles.partnerHeroAvatarWithImage,
          )}
          aria-hidden="true"
        >
          {selectedPartner.avatarUrl ? <img className={styles.partnerHeroAvatarImg} src={selectedPartner.avatarUrl} alt="" /> : selectedPartner.avatar}
        </div>
        <div className={styles.partnerHeroInfo}>
          <div className={styles.partnerHeroName}>{selectedPartner.name}</div>
          <div className={styles.partnerHeroMeta}>
            <span><IconPromotionDetailLocation width={13} height={13} /> {selectedPartner.city}{selectedPartner.district ? ` · ${selectedPartner.district}` : ''}</span>
            <span>加入：{selectedPartner.joinDate}</span>
            <span>电话：{selectedPartner.phone}</span>
          </div>
        </div>
        <div className={styles.partnerHeroGrowthBadge}>
          <IconPromotionDetailTrendUp width={10} height={10} />
          +{safeNum(selectedPartner.growth)}%
        </div>
      </div>
    </div>

    <div className={styles.periodTabRow} role="tablist" aria-label="时间维度选择">
      {PERIOD_TAB_OPTIONS.map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={periodTab === key}
          className={cx(styles.periodTab, periodTab === key && styles.periodTabActive)}
          onClick={() => onPeriodTabChange(key)}
        >
          <Icon width={14} height={14} />
          {label}
        </button>
      ))}
    </div>

    <div className={styles.detailStatsRow}>
      <div className={styles.detailStatCard}>
        <div className={styles.detailStatIcon} aria-hidden="true">
          <IconPromotionDetailPulse width={16} height={16} />
        </div>
        <div className={styles.detailStatBody}>
          <span className={styles.detailStatNum}>{formatPromotionDetailCount(detailTotal.orders)}</span>
          <span className={styles.detailStatLbl}>
            {periodTab === 'day' ? '近14日' : periodTab === 'month' ? '本年' : '历年'} 推广单数
          </span>
        </div>
      </div>
      <div className={styles.detailStatCard}>
        <div className={cx(styles.detailStatIcon, styles.detailStatIconGreen)} aria-hidden="true">
          <IconPromotionDetailCurrency width={16} height={16} />
        </div>
        <div className={styles.detailStatBody}>
          <span className={cx(styles.detailStatNum, styles.colorEmerald)}>¥{fmtAmount(detailTotal.revenue)}</span>
          <span className={styles.detailStatLbl}>
            {periodTab === 'day' ? '近14日' : periodTab === 'month' ? '本年' : '历年'} 推广金额
          </span>
        </div>
      </div>
    </div>

    <PromotionDetailTrendChart periodTab={periodTab} periodRecords={periodRecords} />
    <PromotionDetailRecordList
      periodTab={periodTab}
      periodRecords={periodRecords}
      showEmptyState={showEmptyState}
    />
  </>
);

export default React.memo(PromotionDetailPartnerDetailView);
