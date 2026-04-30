import React, { useCallback, useMemo, useState } from 'react';
import PageHeader from '@components/ui/layout/PageHeader';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import {
  MOCK_MEMBER_DETAILS,
  AVATAR_COLORS,
  LEVEL_LABEL,
} from '../memberList/memberList.mock';
import type { MemberDetail, MemberStatus } from '../memberList/memberList.types';
import styles from './banManagement.module.less';

// ─── 工具函数 ────────────────────────────────────────────────────

function fmtRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  <  1) return '刚刚';
  if (hours <  1) return `${mins} 分钟前`;
  if (days  <  1) return `${hours} 小时前`;
  if (days  < 30) return `${days} 天前`;
  return new Date(ts).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

// ─── 封禁理由选项 ─────────────────────────────────────────────────

const BAN_REASONS = [
  '违规操作',
  '账号异常',
  '恶意刷单',
  '违反用户协议',
  '欺诈行为',
  '其他',
];

type FilterTab = 'all' | 'active' | 'inactive' | 'banned';

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'all',      label: '全部' },
  { value: 'active',   label: '正常' },
  { value: 'inactive', label: '未活跃' },
  { value: 'banned',   label: '已封禁' },
];

// ─── 确认弹窗 ─────────────────────────────────────────────────────

interface ConfirmDialogProps {
  member: MemberDetail;
  action: 'ban' | 'unban';
  selectedReason: string;
  onReasonChange: (r: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  member,
  action,
  selectedReason,
  onReasonChange,
  onConfirm,
  onCancel,
}) => {
  const isBan = action === 'ban';

  return (
    <div
      className={styles.dialogOverlay}
      role="dialog"
      aria-modal="true"
      aria-label={isBan ? '确认封禁' : '确认解封'}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className={styles.dialogCard}>
        {/* 图标 */}
        <div className={`${styles.dialogIconWrap} ${isBan ? styles.dialogIconBan : styles.dialogIconUnban}`} aria-hidden="true">
          {isBan ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M4.93 4.93l14.14 14.14" />
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          )}
        </div>

        {/* 标题 */}
        <h2 className={styles.dialogTitle}>
          {isBan ? `确认封禁「${member.name}」` : `确认解封「${member.name}」`}
        </h2>
        <p className={styles.dialogDesc}>
          {isBan
            ? '封禁后该用户将无法登录及使用平台所有功能，封禁记录将被保存。'
            : '解封后该用户将恢复正常使用权限，可重新登录平台。'}
        </p>

        {/* 封禁时选择理由 */}
        {isBan && (
          <div className={styles.dialogReasonWrap}>
            <span className={styles.dialogReasonLabel}>封禁理由</span>
            <div className={styles.dialogReasonList}>
              {BAN_REASONS.map(r => (
                <button
                  key={r}
                  type="button"
                  className={`${styles.dialogReasonBtn} ${selectedReason === r ? styles.dialogReasonBtnActive : ''}`}
                  onClick={() => onReasonChange(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className={styles.dialogActions}>
          <button
            type="button"
            className={styles.dialogCancelBtn}
            onClick={onCancel}
          >
            取消
          </button>
          <button
            type="button"
            className={`${styles.dialogConfirmBtn} ${isBan ? styles.dialogConfirmBtnBan : styles.dialogConfirmBtnUnban}`}
            onClick={onConfirm}
            disabled={isBan && !selectedReason}
          >
            {isBan ? '确认封禁' : '确认解封'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Toast 提示（临时内联） ────────────────────────────────────────

interface ToastState {
  visible: boolean;
  message: string;
  type: 'success' | 'warn';
}

// ─── 主组件 ──────────────────────────────────────────────────────

const BanManagement: React.FC = () => {
  const navigate = useAnimatedNavigate();

  // ── 数据状态 ──
  const [members, setMembers] = useState<MemberDetail[]>(() =>
    MOCK_MEMBER_DETAILS.map(m => ({ ...m }))
  );

  // ── 筛选状态 ──
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // ── 展开/收起 ──
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── 确认弹窗 ──
  const [confirmTarget, setConfirmTarget] = useState<{ member: MemberDetail; action: 'ban' | 'unban' } | null>(null);
  const [banReason, setBanReason] = useState('');

  // ── Toast ──
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '', type: 'success' });

  const showToast = useCallback((message: string, type: ToastState['type']) => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2400);
  }, []);

  // ── 统计数字 ──
  const counts = useMemo(() => ({
    all:      members.length,
    active:   members.filter(m => m.status === 'active').length,
    inactive: members.filter(m => m.status === 'inactive').length,
    banned:   members.filter(m => m.status === 'banned').length,
  }), [members]);

  // ── 筛选后列表 ──
  const filteredMembers = useMemo(() => {
    let list = members;
    if (activeFilter !== 'all') {
      list = list.filter(m => m.status === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.phone.includes(q)
      );
    }
    return list;
  }, [members, activeFilter, searchQuery]);

  // ── 展开 ──
  const handleToggleExpand = useCallback((id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  // ── 打开确认弹窗 ──
  const handleOpenConfirm = useCallback((member: MemberDetail, action: 'ban' | 'unban') => {
    setBanReason('');
    setConfirmTarget({ member, action });
  }, []);

  // ── 确认执行 ──
  const handleConfirm = useCallback(() => {
    if (!confirmTarget) return;
    const { member, action } = confirmTarget;
    const newStatus: MemberStatus = action === 'ban' ? 'banned' : 'active';
    setMembers(prev =>
      prev.map(m =>
        m.id === member.id
          ? { ...m, status: newStatus, remark: action === 'ban' ? banReason : undefined }
          : m
      )
    );
    setConfirmTarget(null);
    setExpandedId(null);
    showToast(
      action === 'ban' ? `已封禁「${member.name}」` : `已解封「${member.name}」`,
      action === 'ban' ? 'warn' : 'success'
    );
  }, [confirmTarget, banReason, showToast]);

  // ── 取消弹窗 ──
  const handleCancelConfirm = useCallback(() => {
    setConfirmTarget(null);
    setBanReason('');
  }, []);

  return (
    <div className={styles.pageContainer}>
      {/* 背景装饰 */}
      <div className={styles.blurOrb}  aria-hidden="true" />
      <div className={styles.blurOrb2} aria-hidden="true" />

      <PageHeader title="封禁管理" onBack={() => navigate(-1)} />

      <main className={styles.contentWrapper}>

        {/* ── 统计概览 ── */}
        <div className={styles.statsRow}>
          {([ 
            { label: '全部用户', count: counts.all,      color: '' },
            { label: '正常',     count: counts.active,   color: styles.statNumActive },
            { label: '未活跃',   count: counts.inactive, color: styles.statNumInactive },
            { label: '已封禁',   count: counts.banned,   color: styles.statNumBanned },
          ] as const).map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <div className={styles.statDivider} aria-hidden="true" />}
              <div className={styles.statItem}>
                <span className={`${styles.statNum} ${s.color}`}>{s.count}</span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* ── 搜索栏 ── */}
        <div className={styles.searchWrap}>
          <div className={styles.searchIconWrap} aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            className={styles.searchInput}
            type="search"
            placeholder="搜索姓名或手机号…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            aria-label="搜索用户"
          />
          {searchQuery && (
            <button
              type="button"
              className={styles.searchClear}
              onClick={() => setSearchQuery('')}
              aria-label="清除搜索"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* ── 筛选 Tab ── */}
        <div className={styles.filterWrap} role="tablist" aria-label="筛选用户状态">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.value}
              role="tab"
              aria-selected={activeFilter === tab.value}
              className={`${styles.filterBtn} ${activeFilter === tab.value ? styles.filterBtnActive : ''}`}
              onClick={() => setActiveFilter(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── 用户列表 ── */}
        <div className={styles.listCard}>
          {/* 卡片顶部彩条 */}
          <div className={styles.listCardAccent} aria-hidden="true" />

          {filteredMembers.length === 0 ? (
            <div className={styles.emptyState} role="status">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
              <span>暂无{activeFilter !== 'all' ? (activeFilter === 'banned' ? '已封禁' : activeFilter === 'active' ? '正常' : '未活跃') : ''}用户</span>
              {searchQuery && (
                <button type="button" className={styles.emptySearchClear} onClick={() => setSearchQuery('')}>
                  清除搜索
                </button>
              )}
            </div>
          ) : (
            filteredMembers.map((member) => {
              const avatarGradient = AVATAR_COLORS[member.avatarColorIdx] ?? AVATAR_COLORS[0];
              const isBanned  = member.status === 'banned';
              const isExpanded = expandedId === member.id;

              return (
                <div
                  key={member.id}
                  className={`${styles.memberItem} ${isBanned ? styles.memberItemBanned : ''} ${isExpanded ? styles.memberItemExpanded : ''}`}
                >
                  {/* ── 主信息行 ── */}
                  <div
                    className={styles.memberMain}
                    onClick={() => handleToggleExpand(member.id)}
                    role="button"
                    aria-expanded={isExpanded}
                    aria-label={`${member.name}，${isBanned ? '已封禁' : '正常'}，点击展开详情`}
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && handleToggleExpand(member.id)}
                  >
                    {/* 头像 */}
                    <div
                      className={`${styles.memberAvatar} ${isBanned ? styles.memberAvatarBanned : ''}`}
                      style={{ background: isBanned ? undefined : avatarGradient }}
                      aria-hidden="true"
                    >
                      {member.avatarChar}
                      {isBanned && (
                        <span className={styles.memberAvatarBanIcon} aria-hidden="true">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M4.93 4.93l14.14 14.14" />
                          </svg>
                        </span>
                      )}
                    </div>

                    {/* 信息 */}
                    <div className={styles.memberInfo}>
                      <div className={styles.memberNameRow}>
                        <span className={`${styles.memberName} ${isBanned ? styles.memberNameBanned : ''}`}>
                          {member.name}
                        </span>
                        {member.isPartner && (
                          <span className={styles.partnerBadge}>
                            合伙人{member.partnerLevel ? ` ${member.partnerLevel}` : ''}
                          </span>
                        )}
                        <span className={styles.levelBadge}>
                          {LEVEL_LABEL[member.level] ?? member.level}
                        </span>
                      </div>
                      <div className={styles.memberMeta}>
                        <span>{member.phone}</span>
                        <span className={styles.memberMetaDot} aria-hidden="true" />
                        <span>最近活跃 {fmtRelativeTime(member.lastActiveAt)}</span>
                      </div>
                    </div>

                    {/* 状态标签 + 箭头 */}
                    <div className={styles.memberRight}>
                      <StatusBadge status={member.status} />
                      <svg
                        className={`${styles.expandArrow} ${isExpanded ? styles.expandArrowOpen : ''}`}
                        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                        aria-hidden="true"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>

                  {/* ── 展开详情区 ── */}
                  {isExpanded && (
                    <div className={styles.memberDetail}>

                      {/* 详情数字行 */}
                      <div className={styles.detailStats}>
                        <div className={styles.detailStatItem}>
                          <span className={styles.detailStatVal}>
                            {member.totalRecharged > 0 ? `¥${(member.totalRecharged / 100).toFixed(0)}` : '—'}
                          </span>
                          <span className={styles.detailStatLabel}>累计充值</span>
                        </div>
                        <div className={styles.detailStatDivider} aria-hidden="true" />
                        <div className={styles.detailStatItem}>
                          <span className={styles.detailStatVal}>{member.availablePoints}</span>
                          <span className={styles.detailStatLabel}>积分余额</span>
                        </div>
                        <div className={styles.detailStatDivider} aria-hidden="true" />
                        <div className={styles.detailStatItem}>
                          <span className={styles.detailStatVal}>{member.invitedCount}</span>
                          <span className={styles.detailStatLabel}>邀请人数</span>
                        </div>
                        <div className={styles.detailStatDivider} aria-hidden="true" />
                        <div className={styles.detailStatItem}>
                          <span className={styles.detailStatVal}>{member.rechargeCount}</span>
                          <span className={styles.detailStatLabel}>充值次数</span>
                        </div>
                      </div>

                      {/* 注册时间 */}
                      <div className={styles.detailMeta}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8"  y1="2" x2="8"  y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        注册于 {new Date(member.registeredAt).toLocaleDateString('zh-CN')}
                      </div>

                      {/* 封禁备注（仅已封禁时显示） */}
                      {isBanned && member.remark && (
                        <div className={styles.banRemarkWrap}>
                          <span className={styles.banRemarkIcon} aria-hidden="true">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="8" x2="12" y2="12" />
                              <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                          </span>
                          <span className={styles.banRemarkText}>{member.remark}</span>
                        </div>
                      )}

                      {/* 操作按钮 */}
                      <div className={styles.actionRow}>
                        {isBanned ? (
                          <button
                            type="button"
                            className={styles.unbanBtn}
                            onClick={() => handleOpenConfirm(member, 'unban')}
                            aria-label={`解封 ${member.name}`}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                              <polyline points="9 12 11 14 15 10" />
                            </svg>
                            解除封禁
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={styles.banBtn}
                            onClick={() => handleOpenConfirm(member, 'ban')}
                            aria-label={`封禁 ${member.name}`}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M4.93 4.93l14.14 14.14" />
                            </svg>
                            封禁账号
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </main>

      {/* ── 确认弹窗 ── */}
      {confirmTarget && (
        <ConfirmDialog
          member={confirmTarget.member}
          action={confirmTarget.action}
          selectedReason={banReason}
          onReasonChange={setBanReason}
          onConfirm={handleConfirm}
          onCancel={handleCancelConfirm}
        />
      )}

      {/* ── Toast 提示 ── */}
      {toast.visible && (
        <div
          className={`${styles.toastBar} ${toast.type === 'warn' ? styles.toastBarWarn : styles.toastBarSuccess}`}
          role="status"
          aria-live="polite"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            {toast.type === 'success'
              ? <polyline points="20 6 9 17 4 12" />
              : <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>
            }
          </svg>
          {toast.message}
        </div>
      )}
    </div>
  );
};

// ─── 状态标签子组件 ───────────────────────────────────────────────

const StatusBadge: React.FC<{ status: MemberStatus }> = ({ status }) => {
  if (status === 'banned') {
    return (
      <span className={`${styles.statusBadge} ${styles.statusBadgeBanned}`}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M4.93 4.93l14.14 14.14" />
        </svg>
        已封禁
      </span>
    );
  }
  if (status === 'inactive') {
    return (
      <span className={`${styles.statusBadge} ${styles.statusBadgeInactive}`}>
        未活跃
      </span>
    );
  }
  return (
    <span className={`${styles.statusBadge} ${styles.statusBadgeActive}`}>
      <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
        <circle cx="4" cy="4" r="4" fill="currentColor" />
      </svg>
      正常
    </span>
  );
};

export default BanManagement;
