// 合伙人卡片：负责渲染单个合伙人条目。
import React from 'react';
import { cx, safeNum } from '@utils/utils';
import {
  IconPromotionDetailChevronRight,
  IconPromotionDetailLocation,
  IconPromotionDetailRankStar,
} from '../_shared/icons/PromotionDetailIcons';
import styles from '../../promotionDetail.module.less';
import { formatPromotionDetailCount, getPromotionDetailProgressStyle } from '../../promotionDetail.utils';
import type { PromotionPartnerItem } from '../../promotionDetail.types';

export interface PromotionPartnerCardProps {
  partner: PromotionPartnerItem;
  maxOrders: number;
  onClick: (partner: PromotionPartnerItem) => void;
}

const PromotionPartnerCard: React.FC<PromotionPartnerCardProps> = ({
  partner,
  maxOrders,
  onClick,
}) => (
  <button
    type="button"
    className={cx(styles.partnerCard, partner.rank > 0 && partner.rank <= 3 && styles.partnerCardTop)}
    onClick={() => onClick(partner)}
    aria-label={`查看${partner.name}的推广详情`}
  >
    <div
      className={cx(
        styles.partnerRankBadge,
        partner.rank === 1 && styles.partnerRankGold,
        partner.rank === 2 && styles.partnerRankSilver,
        partner.rank === 3 && styles.partnerRankBronze,
      )}
    >
      {partner.rank > 0 && partner.rank <= 3 ? <IconPromotionDetailRankStar /> : partner.rank > 0 ? partner.rank : '--'}
    </div>

    <div
      className={cx(
        styles.partnerAvatar,
        partner.rank === 1 && styles.partnerAvatarGold,
        partner.rank === 2 && styles.partnerAvatarSilver,
        partner.rank === 3 && styles.partnerAvatarBronze,
        partner.avatarUrl && styles.partnerAvatarWithImage,
      )}
      aria-hidden="true"
    >
      {partner.avatarUrl ? <img className={styles.partnerAvatarImg} src={partner.avatarUrl} alt="" /> : partner.avatar}
    </div>

    <div className={styles.partnerInfo}>
      <div className={styles.partnerInfoTop}>
        <span className={styles.partnerName}>{partner.name}</span>
        <span className={cx(styles.partnerGrowth, safeNum(partner.growth) >= 15 && styles.partnerGrowthHigh)}>
          +{formatPromotionDetailCount(partner.growth)}%
        </span>
      </div>
      <span className={styles.partnerLocation}>
        <IconPromotionDetailLocation width={13} height={13} /> {partner.city}{partner.district ? ` · ${partner.district}` : ''}
      </span>
      <div className={styles.partnerStats}>
        <span className={styles.partnerStatItem}>
          <span className={styles.partnerStatNum}>{formatPromotionDetailCount(partner.orders)}</span>
          <span className={styles.partnerStatLbl}> 单</span>
        </span>
        <span className={styles.partnerStatSep} aria-hidden="true">·</span>
        <span className={styles.partnerStatItem}>
          <span className={cx(styles.partnerStatNum, styles.colorEmerald)}>¥{partner.revenueDisplay || '0'}</span>
        </span>
      </div>
    </div>

    <div className={styles.partnerBarWrap} aria-hidden="true">
      <div className={styles.partnerBar} style={getPromotionDetailProgressStyle(partner.orders, maxOrders)} />
    </div>

    <IconPromotionDetailChevronRight className={styles.partnerArrow} width={16} height={16} />
  </button>
);

export default React.memo(PromotionPartnerCard);
