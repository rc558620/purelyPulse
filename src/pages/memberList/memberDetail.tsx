/**
 * memberDetail —— 会员详情页
 *
 * 功能：
 *  - 顶部信息横幅（头像 / 姓名 / 等级 / 手机 / 状态）
 *  - 核心数据卡（积分 / 纯利豆 / 累计充值 / 推广人数）
 *    - 点击积分卡 → AdjustPointsModal
 *    - 点击纯利豆卡 → AdjustBeanModal
 *  - 充值记录列表
 *  - 备注卡（有备注时显示）
 */
import React, { useMemo, useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageHeader from '@components/ui/layout/PageHeader';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import {
  MOCK_MEMBER_DETAILS,
  LEVEL_LABEL,
  AVATAR_COLORS,
} from './memberList.mock';
import type { RechargeRecord } from './memberList.types';
import AdjustPointsModal from './components/AdjustPointsModal/AdjustPointsModal';
import AdjustBeanModal   from './components/AdjustBeanModal/AdjustBeanModal';
import styles from './memberDetail.module.less';

// ─── 工具函数 ──────────────────────────────────────────────────────
function fmtAmount(fen: number): string {
  if (fen === 0) return '0';
  return (fen / 100).toFixed(0);
}

function fmtDate(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

function fmtRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const DAY = 86_400_000;
  if (diff < DAY) return '今天';
  if (diff < 2 * DAY) return '昨天';
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} 天前`;
  if (diff < 30 * DAY) return `${Math.floor(diff / (7 * DAY))} 周前`;
  return `${Math.floor(diff / (30 * DAY))} 个月前`;
}

const CHANNEL_LABEL: Record<string, string> = {
  wechat: '微信支付',
  alipay: '支付宝',
  card:   '礼品卡',
};
const CHANNEL_COLOR: Record<string, string> = {
  wechat: '#09b83e',
  alipay: '#1677ff',
  card:   '#d97706',
};

// ─── 充值记录行 ──────────────────────────────────────────────────
interface RechargeRowProps {
  record: RechargeRecord;
  isLast: boolean;
}

const RechargeRow: React.FC<RechargeRowProps> = ({ record, isLast }) => (
  <div className={`${styles.rechargeRow} ${isLast ? styles.rechargeRowLast : ''}`}>
    <div className={styles.rechargeIcon} style={{ color: CHANNEL_COLOR[record.channel] || '#64748b' }}>
      {record.channel === 'wechat' && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M8.7 14.2c-.3 0-.5-.1-.7-.3L5.5 11.4c-.4-.4-.4-1 0-1.4.4-.4 1-.4 1.4 0l1.8 1.8 4.2-4.2c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4L9.4 13.9c-.2.2-.4.3-.7.3z"/>
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/>
        </svg>
      )}
      {record.channel === 'alipay' && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <text x="12" y="16.5" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">支</text>
        </svg>
      )}
      {record.channel === 'card' && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      )}
    </div>
    <div className={styles.rechargeInfo}>
      <div className={styles.rechargePlanName}>{record.planName}</div>
      <div className={styles.rechargeMeta}>
        <span
          className={styles.rechargeChannel}
          style={{ color: CHANNEL_COLOR[record.channel] || '#64748b' }}
        >
          {CHANNEL_LABEL[record.channel] || record.channel}
        </span>
        <span className={styles.rechargeDot} aria-hidden="true" />
        <span className={styles.rechargeDate}>{fmtDate(record.createdAt)}</span>
      </div>
    </div>
    <div className={styles.rechargeRight}>
      <span className={styles.rechargeAmtValue}>¥{fmtAmount(record.amount)}</span>
      <span className={styles.rechargePoints}>+{record.pointsAwarded} 积分</span>
    </div>
  </div>
);

// ─── 主页面 ──────────────────────────────────────────────────────
const MemberDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useAnimatedNavigate();

  const member = useMemo(
    () => MOCK_MEMBER_DETAILS.find(m => m.id === id),
    [id],
  );

  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showBeanModal,   setShowBeanModal]   = useState(false);
  const [points, setPoints] = useState(member?.availablePoints ?? 0);
  const [beans,  setBeans]  = useState(member?.beanBalance  ?? 0);

  const handleAdjustPoints = useCallback((delta: number, _reason: string) => {
    setPoints(prev => Math.max(0, prev + delta));
  }, []);

  const handleAdjustBeans = useCallback((delta: number, _reason: string) => {
    setBeans(prev => Math.max(0, prev + delta));
  }, []);

  if (!member) {
    return (
      <div className={styles.pageContainer}>
        <PageHeader title="会员详情" onBack={() => navigate(-1)} />
        <div className={styles.notFound}>找不到该会员信息</div>
      </div>
    );
  }

  const avatarBg = AVATAR_COLORS[member.avatarColorIdx % AVATAR_COLORS.length];

  const statusConfig = {
    active:   { label: '正常',   cls: styles.statusActive   },
    inactive: { label: '未活跃', cls: styles.statusInactive },
    banned:   { label: '已封禁', cls: styles.statusBanned   },
  }[member.status];

  return (
    <div className={styles.pageContainer}>
      {/* 背景装饰 */}
      <div className={styles.blurOrb} aria-hidden="true" />

      <PageHeader title="会员详情" onBack={() => navigate(-1)} />

      <main className={styles.contentWrapper}>

        {/* ── 会员信息横幅 ────────────────────────────────────── */}
        <div className={styles.heroBanner}>
          <div
            className={styles.heroAvatar}
            style={{ background: avatarBg }}
            aria-hidden="true"
          >
            {member.avatarChar}
            {member.isPartner && (
              <span className={styles.heroPartnerDot} aria-label="合伙人" />
            )}
          </div>

          <div className={styles.heroInfo}>
            <div className={styles.heroNameRow}>
              <h1 className={styles.heroName}>{member.name}</h1>
              <span className={`${styles.heroLevelBadge} ${styles[`hlevel_${member.level}`]}`}>
                {LEVEL_LABEL[member.level]}
              </span>
              {member.isPartner && (
                <span className={styles.heroPartnerBadge}>
                  {member.partnerLevel || '合伙人'}
                </span>
              )}
            </div>
            <div className={styles.heroPhone}>{member.phone}</div>
            <div className={styles.heroBottomRow}>
              <span className={`${styles.heroStatus} ${statusConfig.cls}`}>
                {statusConfig.label}
              </span>
              <span className={styles.heroJoined}>
                加入于 {fmtDate(member.registeredAt)}
              </span>
              <span className={styles.heroActive}>
                活跃 {fmtRelativeTime(member.lastActiveAt)}
              </span>
            </div>
          </div>
        </div>

        {/* ── 核心数据卡 ────────────────────────────────────────── */}
        <div className={styles.metricsGrid}>

          {/* 积分卡（可点击） */}
          <button
            type="button"
            className={`${styles.metricCard} ${styles.metricCardPoints}`}
            onClick={() => setShowPointsModal(true)}
            aria-label="调整积分"
          >
            <div className={styles.metricIconWrap} aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <div className={styles.metricValue}>{points.toLocaleString('zh-CN')}</div>
            <div className={styles.metricLabel}>当前积分</div>
            <div className={styles.metricSub}>累计 {member.totalPointsEarned.toLocaleString('zh-CN')}</div>
            <div className={styles.metricEditHint} aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              调整
            </div>
          </button>

          {/* 纯利豆卡（可点击） */}
          <button
            type="button"
            className={`${styles.metricCard} ${styles.metricCardBeans}`}
            onClick={() => setShowBeanModal(true)}
            aria-label="调整纯利豆"
          >
            <div className={styles.metricIconWrap} aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="9" />
                <path d="M8.5 8.5c.8-1 2-1.5 3.5-1.5 2.5 0 4 1.5 4 3.5 0 1.5-.8 2.5-2 3" />
                <circle cx="12" cy="17" r="0.5" fill="currentColor" />
              </svg>
            </div>
            <div className={styles.metricValue}>{beans.toLocaleString('zh-CN')}</div>
            <div className={styles.metricLabel}>纯利豆余额</div>
            <div className={styles.metricSub}>
              {member.isPartner ? `合伙人 ${member.partnerLevel || ''}` : '普通会员'}
            </div>
            <div className={styles.metricEditHint} aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              调整
            </div>
          </button>

          {/* 累计充值 */}
          <div className={`${styles.metricCard} ${styles.metricCardRecharge}`}>
            <div className={styles.metricIconWrap} aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20" />
              </svg>
            </div>
            <div className={styles.metricValue}>¥{fmtAmount(member.totalRecharged)}</div>
            <div className={styles.metricLabel}>累计充值</div>
            <div className={styles.metricSub}>共 {member.rechargeCount} 笔</div>
          </div>

          {/* 推广人数 */}
          <div className={`${styles.metricCard} ${styles.metricCardInvite}`}>
            <div className={styles.metricIconWrap} aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className={styles.metricValue}>{member.invitedCount}</div>
            <div className={styles.metricLabel}>推广人数</div>
            <div className={styles.metricSub}>
              {member.invitedCount > 0 ? '有效推广' : '暂无推广'}
            </div>
          </div>

        </div>

        {/* ── 充值记录 ──────────────────────────────────────────── */}
        <div className={styles.rechargeCard}>
          <div className={styles.rechargeCardHeader}>
            <span className={styles.rechargeCardTitle}>充值记录</span>
            <span className={styles.rechargeCardCount}>{member.rechargeHistory.length} 笔</span>
          </div>

          {member.rechargeHistory.length === 0 ? (
            <div className={styles.rechargeEmpty}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20" />
              </svg>
              <span>暂无充值记录</span>
            </div>
          ) : (
            member.rechargeHistory.map((rec, i) => (
              <RechargeRow
                key={rec.id}
                record={rec}
                isLast={i === member.rechargeHistory.length - 1}
              />
            ))
          )}
        </div>

        {/* ── 备注 ──────────────────────────────────────────────── */}
        {member.remark && (
          <div className={styles.remarkCard}>
            <div className={styles.remarkLabel}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              备注
            </div>
            <p className={styles.remarkText}>{member.remark}</p>
          </div>
        )}

      </main>

      {/* ── 调整积分弹窗 ─────────────────────────────────────── */}
      {showPointsModal && (
        <AdjustPointsModal
          member={member}
          currentPoints={points}
          onClose={() => setShowPointsModal(false)}
          onConfirm={handleAdjustPoints}
        />
      )}

      {/* ── 调整纯利豆弹窗 ───────────────────────────────────── */}
      {showBeanModal && (
        <AdjustBeanModal
          member={member}
          currentBeans={beans}
          onClose={() => setShowBeanModal(false)}
          onConfirm={handleAdjustBeans}
        />
      )}
    </div>
  );
};

export default MemberDetail;
