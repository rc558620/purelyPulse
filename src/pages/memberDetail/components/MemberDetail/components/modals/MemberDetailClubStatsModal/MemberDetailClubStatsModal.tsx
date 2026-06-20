// 会员运营情况弹窗：展示该商家在 purelyClub C 端的会员储值、在途余额与等级分布。
import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { cx, safeNum } from '@utils/utils';
import {
  IconCalendarDay,
  IconCalendarLastYear,
  IconCalendarMonth,
  IconCalendarQuarter,
  IconCalendarYear,
  IconClose,
  IconClubMembers,
  IconClubStats,
  IconLevelPie,
  IconRechargeCount,
  IconRechargeTotal,
  IconWallet,
} from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
import type { ClubMemberStats } from '@pages/memberList/memberList.types';
import { fetchMemberClubStats } from '@pages/memberList/memberList.service';
import styles from './MemberDetailClubStatsModal.module.less';

/** 格式化运营统计金额（分转元），保留最多 2 位小数，去除尾部多余 0。
 * 与 formatMemberAmount（整数截断）不同，此函数用于运营统计弹窗中的今日/本月/本年等
 * 按时间窗口聚合的金额，这些值更可能出现非整数元的场景。
 */
const formatClubAmount = (fen: number): string => {
  const value = safeNum(fen) / 100;
  if (value === 0) return '0';
  // toFixed(2) 保留两位小数，parseFloat + String 去除尾部 0（如 388.50 → "388.5"，388.00 → "388"）
  return String(Number.parseFloat(value.toFixed(2)));
};

interface MemberDetailClubStatsModalProps {
  /** 目标会员 id（商家侧标识）。 */
  memberId: string;
  /** 会员姓名，用于弹窗副标题。 */
  memberName: string;
  /** 关闭弹窗回调。 */
  onClose: () => void;
}

/** C 端等级展示配置。 */
const LEVEL_DISPLAY_CONFIG = [
  { key: 'free'     as const, label: '免费会员', cardClass: 'levelFree',     dotClass: 'dotFree'     },
  { key: 'gold'     as const, label: '黄金会员', cardClass: 'levelGold',     dotClass: 'dotGold'     },
  { key: 'platinum' as const, label: '铂金会员', cardClass: 'levelPlatinum', dotClass: 'dotPlatinum' },
  { key: 'diamond'  as const, label: '钻石会员', cardClass: 'levelDiamond',  dotClass: 'dotDiamond'  },
] as const;

const MemberDetailClubStatsModal: React.FC<MemberDetailClubStatsModalProps> = ({
  memberId,
  memberName,
  onClose,
}) => {
  const [stats, setStats] = useState<ClubMemberStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const requestIdRef = useRef<number>(0);

  const loadStats = useCallback(async (): Promise<void> => {
    const normalizedMemberId = memberId?.trim() ?? '';
    if (!normalizedMemberId) {
      setStats(null);
      setIsLoading(false);
      setErrorMessage('会员 ID 无效');
      return;
    }

    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;
    // 每次请求前重置状态，避免残留旧数据闪烁
    setStats(null);
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetchMemberClubStats(normalizedMemberId);
      if (currentRequestId !== requestIdRef.current) {
        return;
      }
      setStats(response);
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) {
        return;
      }
      setStats(null);
      // 区分 403 无权限与其他错误，给用户更明确的提示
      if (typeof error === 'object' && error !== null && 'statusCode' in error && (error as { statusCode?: number }).statusCode === 403) {
        setErrorMessage('暂无权限查看会员运营数据');
      } else {
        setErrorMessage(error instanceof Error ? error.message : '获取会员运营情况失败');
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [memberId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 数据加载的惯用模式，与项目其他 hook 保持一致
    void loadStats();
  }, [loadStats]);

  // ESC 关闭
  useEffect(() => {
    const handler = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleRetry = useCallback((): void => {
    void loadStats();
  }, [loadStats]);

  const renderBody = (): React.ReactNode => {
    if (isLoading) {
      return (
        <div className={styles.body}>
          <div className={styles.skeletonHero} />
          <div className={styles.statsRow}>
            <div className={styles.skeletonCard} />
            <div className={styles.skeletonCard} />
          </div>
          {/* 充值明细区块占位 */}
          <div className={styles.rechargeDetailSection}>
            <div className={styles.skeletonCard} style={{ height: '2rem', width: '8rem' }} />
            <div className={styles.rechargeDetailGrid}>
              <div className={styles.skeletonCard} style={{ height: '7rem' }} />
              <div className={styles.skeletonCard} style={{ height: '7rem' }} />
              <div className={styles.skeletonCard} style={{ height: '7rem' }} />
              <div className={styles.skeletonCard} style={{ height: '7rem' }} />
              <div className={styles.skeletonCard} style={{ height: '7rem' }} />
              <div className={styles.skeletonCard} style={{ height: '7rem' }} />
            </div>
          </div>
          {/* 等级分布区块占位 */}
          <div className={styles.breakdownSection}>
            <div className={styles.skeletonCard} style={{ height: '2rem', width: '10rem' }} />
            <div className={styles.breakdownGrid}>
              <div className={styles.skeletonCard} style={{ height: '9rem' }} />
              <div className={styles.skeletonCard} style={{ height: '9rem' }} />
              <div className={styles.skeletonCard} style={{ height: '9rem' }} />
              <div className={styles.skeletonCard} style={{ height: '9rem' }} />
            </div>
          </div>
        </div>
      );
    }

    if (errorMessage || !stats) {
      return (
        <div className={styles.body}>
          <div className={styles.stateBox}>
            <p className={styles.stateText}>{errorMessage || '暂无运营数据'}</p>
            {errorMessage && (
              <button type="button" className={styles.retryBtn} onClick={handleRetry}>
                重新加载
              </button>
            )}
          </div>
        </div>
      );
    }

    const breakdown = stats.levelBreakdown;

    return (
      <div className={styles.body}>
        {/* 顾客在途余额主卡 */}
        <div className={styles.heroCard}>
          <div className={styles.heroCardDecor} aria-hidden="true" />
          <div className={styles.heroCardDecor2} aria-hidden="true" />

          {/* 左侧：图标 + 文案 */}
          <div className={styles.heroLeft}>
            <div className={styles.heroIconWrap} aria-hidden="true">
              <IconWallet width={20} height={20} strokeWidth={2.2} />
            </div>
            <div className={styles.heroTextGroup}>
              <div className={styles.heroLabel}>顾客在途余额</div>
              <p className={styles.heroSubLabel}>全部顾客当前储值余额合计</p>
            </div>
          </div>

          {/* 右侧：大金额 */}
          <div className={styles.heroAmount}>
            <span className={styles.heroAmountUnit}>¥</span>
            {formatClubAmount(stats.pendingBalanceFen)}
          </div>
        </div>

        {/* 充值总额 + 会员总数 */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={cx(styles.statIconWrap, styles.iconRecharge)} aria-hidden="true">
              <IconRechargeTotal width={18} height={18} strokeWidth={2.2} />
            </div>
            <div className={styles.statCardBody}>
              <div className={styles.statValue}>¥{formatClubAmount(stats.totalRechargeFen)}</div>
              <div className={styles.statLabel}>会员充值总金额</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={cx(styles.statIconWrap, styles.iconMembers)} aria-hidden="true">
              <IconClubMembers width={18} height={18} strokeWidth={2.2} />
            </div>
            <div className={styles.statCardBody}>
              <div className={styles.statValue}>{safeNum(stats.totalMemberCount).toLocaleString('zh-CN')}</div>
              <div className={styles.statLabel}>会员用户总数</div>
            </div>
          </div>
        </div>

        {/* 充值明细区块 */}
        <div className={styles.rechargeDetailSection}>
          <div className={styles.rechargeDetailTitle}>
            <span className={styles.rechargeDetailTitleIcon} aria-hidden="true">
              <IconRechargeCount width={15} height={15} strokeWidth={2.2} />
            </span>
            充值明细
          </div>
          <div className={styles.rechargeDetailGrid}>
            {/* 充值笔数 */}
            <div className={styles.rechargeDetailCard}>
              <div className={cx(styles.rechargeDetailIconWrap, styles.iconCount)} aria-hidden="true">
                <IconRechargeCount width={16} height={16} strokeWidth={2.2} />
              </div>
              <div className={styles.rechargeDetailBody}>
                <div className={styles.rechargeDetailValue}>
                  {safeNum(stats.rechargeCount).toLocaleString('zh-CN')}
                  <span className={styles.rechargeDetailUnit}>笔</span>
                </div>
                <div className={styles.rechargeDetailLabel}>累计充值笔数</div>
              </div>
            </div>
            {/* 今日储值 */}
            <div className={styles.rechargeDetailCard}>
              <div className={cx(styles.rechargeDetailIconWrap, styles.iconToday)} aria-hidden="true">
                <IconCalendarDay width={16} height={16} strokeWidth={2.2} />
              </div>
              <div className={styles.rechargeDetailBody}>
                <div className={styles.rechargeDetailValue}>
                  <span className={styles.rechargeDetailCurrency}>¥</span>
                  {formatClubAmount(stats.todayRechargeFen)}
                </div>
                <div className={styles.rechargeDetailLabel}>今日储值</div>
              </div>
            </div>
            {/* 本月储值 */}
            <div className={styles.rechargeDetailCard}>
              <div className={cx(styles.rechargeDetailIconWrap, styles.iconMonth)} aria-hidden="true">
                <IconCalendarMonth width={16} height={16} strokeWidth={2.2} />
              </div>
              <div className={styles.rechargeDetailBody}>
                <div className={styles.rechargeDetailValue}>
                  <span className={styles.rechargeDetailCurrency}>¥</span>
                  {formatClubAmount(stats.monthRechargeFen)}
                </div>
                <div className={styles.rechargeDetailLabel}>本月储值</div>
              </div>
            </div>
            {/* 本季储值 */}
            <div className={styles.rechargeDetailCard}>
              <div className={cx(styles.rechargeDetailIconWrap, styles.iconQuarter)} aria-hidden="true">
                <IconCalendarQuarter width={16} height={16} strokeWidth={2.2} />
              </div>
              <div className={styles.rechargeDetailBody}>
                <div className={styles.rechargeDetailValue}>
                  <span className={styles.rechargeDetailCurrency}>¥</span>
                  {formatClubAmount(stats.quarterRechargeFen)}
                </div>
                <div className={styles.rechargeDetailLabel}>本季储值</div>
              </div>
            </div>
            {/* 今年储值 */}
            <div className={styles.rechargeDetailCard}>
              <div className={cx(styles.rechargeDetailIconWrap, styles.iconYear)} aria-hidden="true">
                <IconCalendarYear width={16} height={16} strokeWidth={2.2} />
              </div>
              <div className={styles.rechargeDetailBody}>
                <div className={styles.rechargeDetailValue}>
                  <span className={styles.rechargeDetailCurrency}>¥</span>
                  {formatClubAmount(stats.yearRechargeFen)}
                </div>
                <div className={styles.rechargeDetailLabel}>今年储值</div>
              </div>
            </div>
            {/* 去年储值 */}
            <div className={styles.rechargeDetailCard}>
              <div className={cx(styles.rechargeDetailIconWrap, styles.iconLastYear)} aria-hidden="true">
                <IconCalendarLastYear width={16} height={16} strokeWidth={2.2} />
              </div>
              <div className={styles.rechargeDetailBody}>
                <div className={styles.rechargeDetailValue}>
                  <span className={styles.rechargeDetailCurrency}>¥</span>
                  {formatClubAmount(stats.lastYearRechargeFen)}
                </div>
                <div className={styles.rechargeDetailLabel}>去年储值</div>
              </div>
            </div>
          </div>
        </div>

        {/* 等级分布 */}
        <div className={styles.breakdownSection}>
          <div className={styles.breakdownTitle}>
            <span className={styles.breakdownTitleIcon} aria-hidden="true">
              <IconLevelPie width={15} height={15} strokeWidth={2.2} />
            </span>
            会员等级分布
          </div>
          <div className={styles.breakdownGrid}>
            {LEVEL_DISPLAY_CONFIG.map((item) => (
              <div
                key={item.key}
                className={cx(styles.levelCard, styles[item.cardClass])}
              >
                {/* 右上角呼吸 dot 装饰 */}
                <div className={cx(styles.levelDot, styles[item.dotClass])} aria-hidden="true" />
                <div className={styles.levelCount}>
                  {safeNum(breakdown[item.key]).toLocaleString('zh-CN')}
                </div>
                <div className={styles.levelName}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return ReactDOM.createPortal(
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={`${memberName} 会员运营情况`}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className={styles.card}>
        {/* 弹窗头部 */}
        <div className={styles.header}>
          <div className={styles.headerMain}>
            <div className={styles.headerIcon} aria-hidden="true">
              <IconClubStats width={16} height={16} strokeWidth={2.2} />
            </div>
            <div className={styles.headerText}>
              <h2 className={styles.title}>会员运营情况</h2>
              <p className={styles.desc}>{memberName} 在 purelyClub 的 C 端会员运营数据</p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="关闭会员运营情况"
          >
            <IconClose width={16} height={16} strokeWidth={2.4} />
          </button>
        </div>

        {/* 弹窗主体 */}
        {renderBody()}

        {/* 底部关闭按钮 */}
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.footerCloseBtn}
            onClick={onClose}
          >
            关闭
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default MemberDetailClubStatsModal;
