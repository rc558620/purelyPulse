/**
 * partnerBeans —— 合伙人纯利豆管理页
 *
 * 功能：
 *  - 统计概览（总记录数 / 管理员调整 / 提现次数 / 推广奖励）
 *  - Tab 筛选：全部 / 仅管理员调整 / 获得 / 消耗/提现
 *  - 用户搜索（按姓名/手机号）
 *  - 纯利豆变动记录列表
 *  - 调整弹窗：对指定合伙人进行 +/- 纯利豆操作
 */
import React, { useCallback, useMemo, useState } from 'react';
import PageHeader from '@components/ui/layout/PageHeader';
import SlidingTabBar from '@components/ui/filter/SlidingTabBar/SlidingTabBar';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import { cx } from '@utils/utils';
import AdjustBeanModal from './components/AdjustBeanModal/AdjustBeanModal';
import type { BeanRecord, BeanSource, UserSnapshot } from '../memberPoints/memberPoints.types';
import { MOCK_BEAN_RECORDS, MOCK_PARTNER_USERS } from './partnerBeans.mock';
import styles from './partnerBeans.module.less';

// ─── 来源标签映射 ──────────────────────────────────────────────────
const SOURCE_LABELS: Record<BeanSource, string> = {
  promo_reward:    '推广奖励',
  deduct_payment:  '抵扣消费',
  withdrawal:      '提现扣除',
  admin_adjust:    '管理员调整',
};

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
  { value: 'spend', label: '消耗/提现'  },
];

// ─── 组件 ──────────────────────────────────────────────────────────

const PartnerBeans: React.FC = () => {
  const navigate = useAnimatedNavigate();

  // ── 状态 ──────────────────────────────────────────────────────
  const [records, setRecords]             = useState<BeanRecord[]>(MOCK_BEAN_RECORDS);
  const [users, setUsers]                 = useState<UserSnapshot[]>(MOCK_PARTNER_USERS);
  const [activeTab, setActiveTab]         = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery]     = useState('');
  const [adjustTarget, setAdjustTarget]   = useState<UserSnapshot | null>(null);
  const [showUserPicker, setShowUserPicker] = useState(false);

  // ── 统计概览 ──────────────────────────────────────────────────
  const totalRecords    = records.length;
  const adminAdjustCount = records.filter(r => r.source === 'admin_adjust').length;
  const withdrawCount    = records.filter(r => r.source === 'withdrawal').length;
  const promoRewardCount = records.filter(r => r.source === 'promo_reward').length;

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
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const newRecord: BeanRecord = {
      id:          `bean-${Date.now()}`,
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
          ? { ...u, beanBalance: Math.max(0, u.beanBalance + delta) }
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
        title="合伙人纯利豆管理"
        onBack={() => navigate(-1)}
        rightExtra={
          <button
            type="button"
            className={styles.adjustBtn}
            onClick={() => setShowUserPicker(true)}
            aria-label="调整合伙人纯利豆"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            调整纯利豆
          </button>
        }
      />

      <main className={styles.contentWrapper}>

        {/* ── 统计概览 ───────────────────────────────────────────── */}
        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <span className={styles.statNum}>{totalRecords}</span>
            <span className={styles.statLabel}>总记录</span>
          </div>
          <div className={styles.statDivider} aria-hidden="true" />
          <div className={styles.statItem}>
            <span className={cx(styles.statNum, styles.statNumAdmin)}>{adminAdjustCount}</span>
            <span className={styles.statLabel}>管理员调整</span>
          </div>
          <div className={styles.statDivider} aria-hidden="true" />
          <div className={styles.statItem}>
            <span className={cx(styles.statNum, styles.statNumPromo)}>{promoRewardCount}</span>
            <span className={styles.statLabel}>推广奖励</span>
          </div>
          <div className={styles.statDivider} aria-hidden="true" />
          <div className={styles.statItem}>
            <span className={cx(styles.statNum, styles.statNumWithdraw)}>{withdrawCount}</span>
            <span className={styles.statLabel}>提现</span>
          </div>
        </div>

        {/* ── 合伙人纯利豆余额总览 ───────────────────────────────── */}
        <div className={styles.partnerSummaryCard}>
          <div className={styles.partnerSummaryTitle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            合伙人余额一览
          </div>
          <div className={styles.partnerList}>
            {users.map(user => (
              <div key={user.id} className={styles.partnerItem}>
                <div className={styles.partnerAvatar} aria-hidden="true">{user.name[0]}</div>
                <div className={styles.partnerInfo}>
                  <span className={styles.partnerName}>{user.name}</span>
                  <span className={styles.partnerPhone}>{user.phone}</span>
                </div>
                <div className={styles.partnerBeanBalance}>
                  <span className={styles.partnerBeanVal}>{user.beanBalance.toLocaleString('zh-CN')}</span>
                  <span className={styles.partnerBeanUnit}>豆</span>
                </div>
                <button
                  type="button"
                  className={styles.quickAdjustBtn}
                  onClick={() => handleOpenAdjust(user)}
                  aria-label={`调整 ${user.name} 的纯利豆`}
                >
                  调整
                </button>
              </div>
            ))}
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
            placeholder="搜索合伙人姓名 / 手机号 / 说明..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            aria-label="搜索纯利豆记录"
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
          ariaLabel="纯利豆记录筛选"
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
              <span>暂无纯利豆记录</span>
            </div>
          ) : (
            <div className={styles.recordList}>
              {filteredRecords.map(record => {
                const isEarn     = record.type === 'earn';
                const isWithdraw = record.source === 'withdrawal';
                return (
                  <div key={record.id} className={styles.recordItem}>
                    {/* 左：图标 */}
                    <div
                      className={cx(
                        styles.recordIcon,
                        isEarn     && styles.recordIconEarn,
                        isWithdraw && styles.recordIconWithdraw,
                        !isEarn && !isWithdraw && styles.recordIconSpend,
                      )}
                      aria-hidden="true"
                    >
                      {isEarn ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      ) : isWithdraw ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 5v14M5 12l7 7 7-7" />
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
                          record.source === 'promo_reward' && styles.recordSourceTagPromo,
                          record.source === 'withdrawal'   && styles.recordSourceTagWithdraw,
                        )}>
                          {SOURCE_LABELS[record.source]}
                        </span>
                      </div>
                      <div className={styles.recordDesc}>{record.description}</div>
                      {record.relatedUser && (
                        <div className={styles.recordRelatedUser}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          被推广人：{record.relatedUser}
                        </div>
                      )}
                      <div className={styles.recordTime}>{fmtTime(record.createdAt)}</div>
                    </div>

                    {/* 右：数量 */}
                    <div
                      className={cx(
                        styles.recordAmount,
                        isEarn     && styles.recordAmountEarn,
                        isWithdraw && styles.recordAmountWithdraw,
                        !isEarn && !isWithdraw && styles.recordAmountSpend,
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

      {/* ── 用户选择器弹窗（合伙人选择）──────────────────────────── */}
      {showUserPicker && (
        <div className={styles.pickerOverlay} onClick={() => setShowUserPicker(false)} role="dialog" aria-modal="true" aria-label="选择要调整纯利豆的合伙人">
          <div className={styles.pickerCard} onClick={e => e.stopPropagation()}>
            <div className={styles.pickerHeader}>
              <span className={styles.pickerTitle}>选择合伙人</span>
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
                aria-label="搜索合伙人"
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
                    <div className={styles.pickerUserNameRow}>
                      <span className={styles.pickerUserName}>{user.name}</span>
                      <span className={styles.pickerPartnerTag}>合伙人</span>
                    </div>
                    <span className={styles.pickerUserPhone}>{user.phone}</span>
                  </div>
                  <div className={styles.pickerBalance}>
                    <span className={styles.pickerBalanceVal}>{user.beanBalance.toLocaleString('zh-CN')}</span>
                    <span className={styles.pickerBalanceLbl}>纯利豆</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 纯利豆调整弹窗 ────────────────────────────────────────── */}
      {adjustTarget && (
        <AdjustBeanModal
          user={adjustTarget}
          onClose={handleCloseAdjust}
          onConfirm={handleConfirmAdjust}
        />
      )}
    </div>
  );
};

export default PartnerBeans;
