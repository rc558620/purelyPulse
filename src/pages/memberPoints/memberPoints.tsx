/**
 * memberPoints —— 会员积分管理页
 *
 * 功能：
 *  - 统计概览（总记录数 / 管理员调整 / 今日变动）
 *  - Tab 筛选：全部 / 仅管理员调整 / 获得 / 消耗
 *  - 用户搜索（按姓名/手机号）
 *  - 积分变动记录列表
 *  - 调整弹窗：对指定用户进行 +/- 积分操作
 */
import React, { useCallback, useMemo, useState } from 'react';
import PageHeader from '@components/ui/layout/PageHeader';
import SlidingTabBar from '@components/ui/filter/SlidingTabBar/SlidingTabBar';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import { cx } from '@utils/utils';
import AdjustPointsModal from './components/AdjustPointsModal/AdjustPointsModal';
import type { PointsRecord, PointsSource, UserSnapshot } from './memberPoints.types';
import { MOCK_POINTS_RECORDS, MOCK_USERS } from './memberPoints.mock';
import styles from './memberPoints.module.less';

// ─── 来源标签映射 ──────────────────────────────────────────────────
const SOURCE_LABELS: Record<PointsSource, string> = {
  purchase_bonus: '购买奖励',
  deduct_payment: '抵扣消费',
  admin_adjust:   '管理员调整',
  expire:         '积分过期',
};

// ─── 变动类型样式 ─────────────────────────────────────────────────
type RecordAmountVariant = 'earn' | 'spend' | 'expire';

function getAmountClass(record: PointsRecord): RecordAmountVariant {
  if (record.type === 'earn') return 'earn';
  if (record.type === 'expire') return 'expire';
  return 'spend';
}

// ─── 时间格式化 ───────────────────────────────────────────────────
function fmtTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ─── Tab 选项 ──────────────────────────────────────────────────────
type FilterTab = 'all' | 'admin' | 'earn' | 'spend';

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'all',   label: '全部'       },
  { value: 'admin', label: '管理员调整' },
  { value: 'earn',  label: '获得'       },
  { value: 'spend', label: '消耗'       },
];

// ─── 组件 ──────────────────────────────────────────────────────────

const MemberPoints: React.FC = () => {
  const navigate = useAnimatedNavigate();

  // ── 状态 ──────────────────────────────────────────────────────
  const [records, setRecords]             = useState<PointsRecord[]>(MOCK_POINTS_RECORDS);
  const [users, setUsers]                 = useState<UserSnapshot[]>(MOCK_USERS);
  const [activeTab, setActiveTab]         = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery]     = useState('');
  const [adjustTarget, setAdjustTarget]   = useState<UserSnapshot | null>(null);
  const [showUserPicker, setShowUserPicker] = useState(false);

  // ── 统计概览 ──────────────────────────────────────────────────
  const totalRecords    = records.length;
  const adminAdjustCount = records.filter(r => r.source === 'admin_adjust').length;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayChangeCount = records.filter(r => r.createdAt >= today.getTime()).length;

  // ── 筛选记录 ──────────────────────────────────────────────────
  const filteredRecords = useMemo(() => {
    let list = records;

    // Tab 筛选
    if (activeTab === 'admin') list = list.filter(r => r.source === 'admin_adjust');
    else if (activeTab === 'earn')  list = list.filter(r => r.type === 'earn');
    else if (activeTab === 'spend') list = list.filter(r => r.type !== 'earn');

    // 搜索
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(r =>
        r.userName.includes(q) ||
        r.userPhone.includes(q) ||
        r.description.toLowerCase().includes(q),
      );
    }

    return list;
  }, [records, activeTab, searchQuery]);

  // ── 用户选择器筛选 ────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!showUserPicker || !q) return users;
    return users.filter(u => u.name.includes(q) || u.phone.includes(q));
  }, [users, searchQuery, showUserPicker]);

  // ── 操作回调 ──────────────────────────────────────────────────

  const handleOpenAdjust = useCallback((user: UserSnapshot) => {
    setAdjustTarget(user);
    setShowUserPicker(false);
  }, []);

  const handleConfirmAdjust = useCallback((userId: string, delta: number, reason: string) => {
    // 添加一条新记录
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const newRecord: PointsRecord = {
      id:          `pts-${Date.now()}`,
      userId,
      userName:    user.name,
      userPhone:   user.phone,
      amount:      delta,
      type:        delta > 0 ? 'earn' : 'spend',
      source:      'admin_adjust',
      description: reason,
      createdAt:   Date.now(),
    };

    setRecords(prev => [newRecord, ...prev]);

    // 更新用户余额
    setUsers(prev =>
      prev.map(u =>
        u.id === userId
          ? { ...u, availablePoints: Math.max(0, u.availablePoints + delta) }
          : u,
      ),
    );

    setAdjustTarget(null);
  }, [users]);

  const handleCloseAdjust = useCallback(() => {
    setAdjustTarget(null);
  }, []);

  // ─── 渲染 ──────────────────────────────────────────────────────

  return (
    <div className={styles.pageContainer}>
      <div className={styles.blurOrb} aria-hidden="true" />

      <PageHeader
        title="会员积分管理"
        onBack={() => navigate(-1)}
        rightExtra={
          <button
            type="button"
            className={styles.adjustBtn}
            onClick={() => setShowUserPicker(true)}
            aria-label="调整用户积分"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            调整积分
          </button>
        }
      />

      <main className={styles.contentWrapper}>

        {/* ── 统计概览 ───────────────────────────────────────────── */}
        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <span className={styles.statNum}>{totalRecords}</span>
            <span className={styles.statLabel}>总记录数</span>
          </div>
          <div className={styles.statDivider} aria-hidden="true" />
          <div className={styles.statItem}>
            <span className={cx(styles.statNum, styles.statNumAccent)}>{adminAdjustCount}</span>
            <span className={styles.statLabel}>管理员调整</span>
          </div>
          <div className={styles.statDivider} aria-hidden="true" />
          <div className={styles.statItem}>
            <span className={cx(styles.statNum, styles.statNumToday)}>{todayChangeCount}</span>
            <span className={styles.statLabel}>今日变动</span>
          </div>
        </div>

        {/* ── 搜索框 ─────────────────────────────────────────────── */}
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="搜索用户姓名 / 手机号 / 说明..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            aria-label="搜索积分记录"
          />
          {searchQuery && (
            <button
              type="button"
              className={styles.searchClear}
              onClick={() => setSearchQuery('')}
              aria-label="清除搜索"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* ── Tab 筛选 ────────────────────────────────────────────── */}
        <SlidingTabBar
          options={FILTER_TABS}
          value={activeTab}
          onChange={v => setActiveTab(v as FilterTab)}
          variant="pill"
          ariaLabel="积分记录筛选"
        />

        {/* ── 记录列表 ────────────────────────────────────────────── */}
        <div className={styles.listCard}>
          <div className={styles.listHeader}>
            <span className={styles.listTitle}>变动记录</span>
            <span className={styles.listCount}>{filteredRecords.length} 条</span>
          </div>

          {filteredRecords.length === 0 ? (
            <div className={styles.emptyState} role="status">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>暂无积分记录</span>
            </div>
          ) : (
            <div className={styles.recordList}>
              {filteredRecords.map(record => {
                const variant = getAmountClass(record);
                return (
                  <div key={record.id} className={styles.recordItem}>
                    {/* 左：来源图标 */}
                    <div
                      className={cx(
                        styles.recordIcon,
                        variant === 'earn'  && styles.recordIconEarn,
                        variant === 'spend' && styles.recordIconSpend,
                        variant === 'expire' && styles.recordIconExpire,
                      )}
                      aria-hidden="true"
                    >
                      {variant === 'earn' ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      ) : variant === 'expire' ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      )}
                    </div>

                    {/* 中：信息区 */}
                    <div className={styles.recordInfo}>
                      <div className={styles.recordTopRow}>
                        <span className={styles.recordUserName}>{record.userName}</span>
                        <span className={styles.recordPhone}>{record.userPhone}</span>
                        <span className={cx(
                          styles.recordSourceTag,
                          record.source === 'admin_adjust' && styles.recordSourceTagAdmin,
                        )}>
                          {SOURCE_LABELS[record.source]}
                        </span>
                      </div>
                      <div className={styles.recordDesc}>{record.description}</div>
                      <div className={styles.recordTime}>{fmtTime(record.createdAt)}</div>
                    </div>

                    {/* 右：数量 */}
                    <div
                      className={cx(
                        styles.recordAmount,
                        variant === 'earn'   && styles.recordAmountEarn,
                        variant === 'spend'  && styles.recordAmountSpend,
                        variant === 'expire' && styles.recordAmountExpire,
                      )}
                    >
                      {record.amount > 0 ? `+${record.amount}` : record.amount}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>

      {/* ── 用户选择器弹窗（选择要调整的用户）────────────────────── */}
      {showUserPicker && (
        <div className={styles.pickerOverlay} onClick={() => setShowUserPicker(false)} role="dialog" aria-modal="true" aria-label="选择要调整积分的用户">
          <div className={styles.pickerCard} onClick={e => e.stopPropagation()}>
            <div className={styles.pickerHeader}>
              <span className={styles.pickerTitle}>选择用户</span>
              <button type="button" className={styles.pickerClose} onClick={() => setShowUserPicker(false)} aria-label="关闭">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className={styles.pickerSearch}>
              <input
                className={styles.pickerSearchInput}
                type="text"
                placeholder="搜索姓名或手机号..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
                aria-label="搜索用户"
              />
            </div>
            <div className={styles.pickerList}>
              {filteredUsers.map(user => (
                <button
                  key={user.id}
                  type="button"
                  className={styles.pickerUserItem}
                  onClick={() => handleOpenAdjust(user)}
                >
                  <div className={styles.pickerAvatar} aria-hidden="true">{user.name[0]}</div>
                  <div className={styles.pickerUserInfo}>
                    <span className={styles.pickerUserName}>{user.name}</span>
                    <span className={styles.pickerUserPhone}>{user.phone}</span>
                  </div>
                  <div className={styles.pickerBalance}>
                    <span className={styles.pickerBalanceVal}>{user.availablePoints.toLocaleString('zh-CN')}</span>
                    <span className={styles.pickerBalanceLbl}>积分</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 积分调整弹窗 ──────────────────────────────────────────── */}
      {adjustTarget && (
        <AdjustPointsModal
          user={adjustTarget}
          onClose={handleCloseAdjust}
          onConfirm={handleConfirmAdjust}
        />
      )}
    </div>
  );
};

export default MemberPoints;
