// 首页快捷入口区块：负责管理入口卡片与跳转行为。
import { memo } from 'react';
import { cx, isNonEmptyArray, safeNum } from '@utils/utils';
import { ROUTE_PATHS } from '../../../../router/paths';
import { IconHomeBan, IconHomeBeans, IconHomeChevronRight, IconHomeGrid, IconHomeMemberList, IconHomePayout, IconHomePoints, IconHomeReview } from '../HomeIcons/HomeIcons';
import styles from './HomeQuickNavSection.module.less';

type HomeQuickNavTone = 'green' | 'purple' | 'amber' | 'blue' | 'red' | 'teal';
type HomeQuickNavIcon = 'payout' | 'review' | 'beans' | 'points' | 'ban' | 'memberList';

interface HomeQuickNavItemConfig {
  title: string;
  desc: string;
  ariaLabel: string;
  path: string;
  tone: HomeQuickNavTone;
  icon: HomeQuickNavIcon;
  showPendingBadge?: boolean;
}

interface HomeQuickNavSectionProps {
  pendingApplicationCount: number;
  onNavigate: (path: string) => void;
}

const QUICK_NAV_ITEMS: HomeQuickNavItemConfig[] = [
  { title: '打款管理', desc: '合伙人收益发放', ariaLabel: '合伙人打款管理', path: ROUTE_PATHS.partnerPayout, tone: 'green', icon: 'payout' },
  { title: '申请审核', desc: '合伙人申请处理', ariaLabel: '合伙人申请审核', path: ROUTE_PATHS.partnerReview, tone: 'purple', icon: 'review', showPendingBadge: true },
  { title: '纯利豆', desc: '合伙人豆管理', ariaLabel: '纯利豆管理', path: ROUTE_PATHS.partnerBeans, tone: 'amber', icon: 'beans' },
  { title: '积分管理', desc: '会员积分增减', ariaLabel: '会员积分管理', path: ROUTE_PATHS.memberPoints, tone: 'blue', icon: 'points' },
  { title: '封禁管理', desc: '用户封禁与解封', ariaLabel: '用户封禁管理', path: ROUTE_PATHS.banManagement, tone: 'red', icon: 'ban' },
  { title: '会员列表', desc: '查看与管理全部会员', ariaLabel: '会员列表', path: ROUTE_PATHS.memberList, tone: 'teal', icon: 'memberList' },
];

const getQuickNavItemToneClassName = (tone: HomeQuickNavTone): string => {
  switch (tone) {
    case 'green':
      return styles.quickNavItemGreen;
    case 'purple':
      return styles.quickNavItemPurple;
    case 'amber':
      return styles.quickNavItemAmber;
    case 'blue':
      return styles.quickNavItemBlue;
    case 'red':
      return styles.quickNavItemRed;
    case 'teal':
      return styles.quickNavItemTeal;
    default:
      return '';
  }
};

const getQuickNavIconToneClassName = (tone: HomeQuickNavTone): string => {
  switch (tone) {
    case 'green':
      return styles.quickNavIconGreen;
    case 'purple':
      return styles.quickNavIconPurple;
    case 'amber':
      return styles.quickNavIconAmber;
    case 'blue':
      return styles.quickNavIconBlue;
    case 'red':
      return styles.quickNavIconRed;
    case 'teal':
      return styles.quickNavIconTeal;
    default:
      return '';
  }
};

const renderQuickNavIcon = (icon: HomeQuickNavIcon): React.JSX.Element => {
  switch (icon) {
    case 'payout':
      return <IconHomePayout />;
    case 'review':
      return <IconHomeReview />;
    case 'beans':
      return <IconHomeBeans />;
    case 'points':
      return <IconHomePoints />;
    case 'ban':
      return <IconHomeBan />;
    case 'memberList':
      return <IconHomeMemberList />;
    default:
      return <IconHomeGrid />;
  }
};

const HomeQuickNavSection = memo(({ pendingApplicationCount, onNavigate }: HomeQuickNavSectionProps): React.JSX.Element => {
  const pendingCount = safeNum(pendingApplicationCount);

  return (
    <section className={styles.quickNavCard}>
      <div className={styles.quickNavHeader}>
        <div className={styles.quickNavHeaderLeft}>
          <div className={styles.quickNavHeaderIcon} aria-hidden="true">
            <IconHomeGrid />
          </div>
          <span className={styles.quickNavHeaderTitle}>管理入口</span>
        </div>
        <span className={styles.quickNavHeaderSub}>快速跳转</span>
      </div>

      <div className={styles.quickNavGrid}>
        {isNonEmptyArray(QUICK_NAV_ITEMS)
          ? QUICK_NAV_ITEMS.map((item) => (
              <button
                key={item.path}
                type="button"
                className={cx(styles.quickNavItem, getQuickNavItemToneClassName(item.tone))}
                onClick={() => onNavigate(item.path)}
                aria-label={item.ariaLabel}
              >
                <div className={cx(styles.quickNavIconWrap, getQuickNavIconToneClassName(item.tone))} aria-hidden="true">
                  {renderQuickNavIcon(item.icon)}
                </div>
                <div className={styles.quickNavItemContent}>
                  <span className={styles.quickNavItemTitle}>{item.title}</span>
                  <span className={styles.quickNavItemDesc}>{item.desc}</span>
                </div>
                {item.showPendingBadge && pendingCount > 0 ? (
                  <span className={styles.quickNavBadge} aria-label={`${pendingCount}条待处理`}>
                    {pendingCount}
                  </span>
                ) : null}
                <div className={styles.quickNavArrow} aria-hidden="true">
                  <IconHomeChevronRight />
                </div>
              </button>
            ))
          : null}
      </div>
    </section>
  );
});

HomeQuickNavSection.displayName = 'HomeQuickNavSection';

export default HomeQuickNavSection;
