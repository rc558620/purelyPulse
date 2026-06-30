// 首页推广排行区块：负责排行列表与详情跳转展示。
import { memo, useMemo } from 'react';
import { EmptyState } from '@components/ui/feedback';
import { normalizeRegionValue } from '@constants/regionData';
import { cx, isNonEmptyArray, safeNum } from '@utils/utils';
import type { CSSProperties } from 'react';
import type { CascadeValue } from '@components/form/CascaderView/types';
import type { HomePartnerRankItem } from '../../home.types';
import { IconHomeChevronRight, IconHomeEmptyState, IconHomeRank, IconHomeRankStar } from '../HomeIcons/HomeIcons';
import styles from './HomePartnerRankSection.module.less';

interface HomePartnerRankSectionProps {
  rankRegion: CascadeValue[];
  partnerTop: HomePartnerRankItem[];
  onNavigateDetail: () => void;
}

const HomePartnerRankSection = memo(({
  rankRegion,
  partnerTop,
  onNavigateDetail,
}: HomePartnerRankSectionProps): React.JSX.Element => {
  const regionDisplayText = useMemo((): string => {
    if (!isNonEmptyArray(rankRegion)) {
      return '全部地区';
    }

    const regionLabels = normalizeRegionValue(rankRegion)?.regionLabels ?? [];
    return isNonEmptyArray(regionLabels) ? regionLabels.join(' · ') : '全部地区';
  }, [rankRegion]);

  const maxPartnerOrders = isNonEmptyArray(partnerTop)
    ? Math.max(...partnerTop.map((item) => safeNum(item.orders)), 1)
    : 1;

  return (
    <section className={styles.rankCard}>
      <div className={styles.rankCardHeader}>
        <div className={styles.rankCardTitle}>
          <div className={styles.rankTitleIcon} aria-hidden="true">
            <IconHomeRank />
          </div>
          推广排行 TOP 5
        </div>
        <div className={styles.rankCardHeaderRight}>
          <span className={styles.rankCardSub}>{regionDisplayText}</span>
          <button
            className={styles.rankDetailBtn}
            type="button"
            onClick={onNavigateDetail}
            aria-label="查看推广详情"
          >
            查看详情
            <IconHomeChevronRight width={12} height={12} />
          </button>
        </div>
      </div>

      <div className={styles.rankList}>
        {isNonEmptyArray(partnerTop) ? (
          partnerTop.map((partner, index) => {
            // 排行进度宽度由业务数据决定，保留运行时宽度透传，避免 transform 动画导致刻度失真。
            const rankBarStyle: CSSProperties = {
              width: `${(safeNum(partner.orders) / maxPartnerOrders) * 100}%`,
            };

            return (
              <div key={partner.id} className={styles.rankItem}>
                <div className={cx(styles.rankIdx, index < 3 && styles.rankIdxTop)}>
                  {index < 3 ? <IconHomeRankStar /> : index + 1}
                </div>
                <div className={styles.rankAvatar} aria-hidden="true">
                  {partner.name.charAt(0)}
                </div>
                <div className={styles.rankInfo}>
                  <span className={styles.rankName}>{partner.name}</span>
                  <span className={styles.rankCity}>{partner.city}</span>
                </div>
                <div className={styles.rankBarWrap} aria-hidden="true">
                  <div className={styles.rankBarFill} style={rankBarStyle} />
                </div>
                <div className={styles.rankRight}>
                  <span className={styles.rankRevenue}>¥{partner.revenueDisplay || '0'}</span>
                  <span className={styles.rankOrders}>{safeNum(partner.orders)} 单</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className={styles.rankEmptyState}>
            <EmptyState
              icon={<IconHomeEmptyState />}
              title="暂无推广排行数据"
              desc="当前筛选条件下还没有可展示的排行信息"
            />
          </div>
        )}
      </div>
    </section>
  );
});

HomePartnerRankSection.displayName = 'HomePartnerRankSection';

export default HomePartnerRankSection;
