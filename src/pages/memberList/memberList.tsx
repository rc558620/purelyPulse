/**
 * memberList —— 会员列表页
 *
 * 功能：
 *  - 统计概览（总人数 / 活跃 / 合伙人 / 封禁）
 *  - Tab 筛选：全部 / 正常 / 未活跃 / 已封禁
 *  - 等级筛选 Chip：全部 / 免费 / 月卡 / 季卡 / 年卡
 *  - 搜索（姓名/手机）
 *  - 会员卡片列表
 *  - 点击卡片跳转会员详情
 */
import React, { useCallback, useMemo, useState } from 'react';
import PageHeader from '@components/ui/layout/PageHeader';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import { ROUTE_PATHS } from '../../router/paths';
import {
  MOCK_MEMBER_LIST,
  LEVEL_LABEL,
  STATUS_LABEL,
  AVATAR_COLORS,
} from './memberList.mock';
import type { MemberFilterLevel, MemberFilterStatus, MemberListItem } from './memberList.types';
import styles from './memberList.module.less';

// ─── 工具 ──────────────────────────────────────────────────────────
function fmtAmount(fen: number): string {
  return (fen / 100).toFixed(0);
}

function fmtRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const DAY = 86_400_000;
  if (diff < DAY) return '今天';
  if (diff < 2 * DAY) return '昨天';
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} 天前`;
  if (diff < 30 * DAY) return `${Math.floor(diff / (7 * DAY))} 周前`;
  if (diff < 365 * DAY) return `${Math.floor(diff / (30 * DAY))} 个月前`;
  return `${Math.floor(diff / (365 * DAY))} 年前`;
}

// ─── 常量 ──────────────────────────────────────────────────────────
const STATUS_TABS: { value: MemberFilterStatus; label: string }[] = [
  { value: 'all',      label: '全部' },
  { value: 'active',   label: '正常' },
  { value: 'inactive', label: '未活跃' },
  { value: 'banned',   label: '封禁' },
];

const LEVEL_FILTERS: { value: MemberFilterLevel; label: string }[] = [
  { value: 'all',       label: '全部等级' },
  { value: 'annual',    label: '年卡' },
  { value: 'quarterly', label: '季卡' },
  { value: 'monthly',   label: '月卡' },
  { value: 'free',      label: '免费' },
];

// ─── 子组件：会员卡片 ────────────────────────────────────────────────
interface MemberCardProps {
  member: MemberListItem;
  onClick: (id: string) => void;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, onClick }) => {
  const avatarBg = AVATAR_COLORS[member.avatarColorIdx % AVATAR_COLORS.length];

  return (
    <button
      type="button"
      className={styles.memberCard}
      onClick={() => onClick(member.id)}
      aria-label={`查看 ${member.name} 的会员详情`}
    >
      {/* 左：头像 */}
      <div
        className={styles.memberAvatar}
        style={{ background: avatarBg }}
        aria-hidden="true"
      >
        {member.avatarChar}
        {member.isPartner && (
          <span className={styles.partnerDot} aria-label="合伙人" />
        )}
      </div>

      {/* 中：基本信息 */}
      <div className={styles.memberInfo}>
        <div className={styles.memberNameRow}>
          <span className={styles.memberName}>{member.name}</span>
          <span className={`${styles.levelBadge} ${styles[`level_${member.level}`]}`}>
            {LEVEL_LABEL[member.level]}
          </span>
          {member.isPartner && (
            <span className={styles.partnerBadge}>合伙人</span>
          )}
        </div>
        <div className={styles.memberPhone}>{member.phone}</div>
        <div className={styles.memberMeta}>
          <span className={styles.metaItem}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            {member.availablePoints.toLocaleString('zh-CN')} 积分
          </span>
          {member.beanBalance > 0 && (
            <span className={styles.metaItem}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M8.5 8.5c.8-1 2-1.5 3.5-1.5 2.5 0 4 1.5 4 3.5 0 1.5-.8 2.5-2 3" />
              </svg>
              {member.beanBalance.toLocaleString('zh-CN')} 豆
            </span>
          )}
          <span className={styles.metaItemTime}>
            活跃 {fmtRelativeTime(member.lastActiveAt)}
          </span>
        </div>
      </div>

      {/* 右：充值金额 + 箭头 */}
      <div className={styles.memberRight}>
        <div className={styles.memberRecharge}>
          <span className={styles.rechargeAmt}>
            ¥{fmtAmount(member.totalRecharged)}
          </span>
          <span className={styles.rechargeLabel}>累计充值</span>
        </div>
        <div className={`${styles.statusDot} ${styles[`status_${member.status}`]}`} />
        <svg
          className={styles.memberArrow}
          width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
          aria-hidden="true"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </button>
  );
};

// ─── 主页面组件 ─────────────────────────────────────────────────────
const MemberList: React.FC = () => {
  const navigate = useAnimatedNavigate();

  const [statusFilter, setStatusFilter] = useState<MemberFilterStatus>('all');
  const [levelFilter,  setLevelFilter]  = useState<MemberFilterLevel>('all');
  const [searchQuery,  setSearchQuery]  = useState('');

  // ── 统计 ──────────────────────────────────────────────────────
  const totalCount    = MOCK_MEMBER_LIST.length;
  const activeCount   = MOCK_MEMBER_LIST.filter(m => m.status === 'active').length;
  const partnerCount  = MOCK_MEMBER_LIST.filter(m => m.isPartner).length;
  const bannedCount   = MOCK_MEMBER_LIST.filter(m => m.status === 'banned').length;

  // ── 过滤 ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return MOCK_MEMBER_LIST.filter(m => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (levelFilter  !== 'all' && m.level  !== levelFilter)  return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        if (!m.name.toLowerCase().includes(q) && !m.phone.includes(q)) return false;
      }
      return true;
    });
  }, [statusFilter, levelFilter, searchQuery]);

  const handleCardClick = useCallback((id: string) => {
    navigate(`${ROUTE_PATHS.memberDetail}/${id}`);
  }, [navigate]);

  const handleSearchClear = useCallback(() => setSearchQuery(''), []);

  return (
    <div className={styles.pageContainer}>
      {/* 背景装饰 */}
      <div className={styles.blurOrb} aria-hidden="true" />
      <div className={styles.blurOrb2} aria-hidden="true" />

      <PageHeader
        title="会员管理"
        onBack={() => navigate(-1)}
      />

      <main className={styles.contentWrapper}>

        {/* ── 统计概览 ─────────────────────────────────────────── */}
        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <span className={styles.statNum}>{totalCount}</span>
            <span className={styles.statLabel}>总会员</span>
          </div>
          <div className={styles.statDivider} aria-hidden="true" />
          <div className={styles.statItem}>
            <span className={`${styles.statNum} ${styles.statNumGreen}`}>{activeCount}</span>
            <span className={styles.statLabel}>活跃</span>
          </div>
          <div className={styles.statDivider} aria-hidden="true" />
          <div className={styles.statItem}>
            <span className={`${styles.statNum} ${styles.statNumAmber}`}>{partnerCount}</span>
            <span className={styles.statLabel}>合伙人</span>
          </div>
          <div className={styles.statDivider} aria-hidden="true" />
          <div className={styles.statItem}>
            <span className={`${styles.statNum} ${styles.statNumRed}`}>{bannedCount}</span>
            <span className={styles.statLabel}>封禁</span>
          </div>
        </div>

        {/* ── 搜索框 ───────────────────────────────────────────── */}
        <div className={styles.searchWrap}>
          <div className={styles.searchIcon} aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <input
            className={styles.searchInput}
            type="search"
            placeholder="搜索姓名 / 手机号"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            aria-label="搜索会员"
          />
          {searchQuery && (
            <button
              type="button"
              className={styles.searchClear}
              onClick={handleSearchClear}
              aria-label="清除搜索"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* ── 状态 Tab ─────────────────────────────────────────── */}
        <div className={styles.tabRow} role="tablist" aria-label="会员状态筛选">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              role="tab"
              aria-selected={statusFilter === tab.value}
              className={`${styles.tabBtn} ${statusFilter === tab.value ? styles.tabBtnActive : ''}`}
              onClick={() => setStatusFilter(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── 等级 Chip ────────────────────────────────────────── */}
        <div className={styles.chipRow} role="group" aria-label="等级筛选">
          {LEVEL_FILTERS.map(f => (
            <button
              key={f.value}
              className={`${styles.chipBtn} ${levelFilter === f.value ? styles.chipBtnActive : ''}`}
              onClick={() => setLevelFilter(f.value)}
              aria-pressed={levelFilter === f.value}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ── 列表 ─────────────────────────────────────────────── */}
        <div className={styles.listCard}>
          {/* 列表头部 */}
          <div className={styles.listHeader}>
            <span className={styles.listTitle}>会员列表</span>
            <span className={styles.listCount}>共 {filtered.length} 位</span>
          </div>

          {filtered.length === 0 ? (
            <div className={styles.emptyState} role="status">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>暂无符合条件的会员</span>
            </div>
          ) : (
            <div className={styles.memberList}>
              {filtered.map(member => (
                <MemberCard
                  key={member.id}
                  member={member}
                  onClick={handleCardClick}
                />
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default MemberList;
