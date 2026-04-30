import React, { useCallback, useMemo, useState } from 'react';
import PageHeader from '@components/ui/layout/PageHeader';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import styles from './partnerPayout.module.less';

// ─── 类型定义 ────────────────────────────────────────────────────

type PayoutStatus = 'pending' | 'approved' | 'paid' | 'rejected';
type AccountType = 'wechat' | 'alipay' | 'bank';
type TabKey = 'all' | 'pending' | 'paid' | 'rejected';

interface PayoutApplication {
  id: string;
  partnerName: string;
  partnerPhone: string;
  partnerCity: string;
  amount: number;
  accountType: AccountType;
  accountNo: string;
  accountName: string;
  status: PayoutStatus;
  appliedAt: string;
  paidAt?: string;
  txnNo?: string;
  rejectReason?: string;
}

// ─── 常量 ────────────────────────────────────────────────────────

const TAB_OPTIONS: { value: TabKey; label: string }[] = [
  { value: 'all',      label: '全部' },
  { value: 'pending',  label: '待处理' },
  { value: 'paid',     label: '已打款' },
  { value: 'rejected', label: '已拒绝' },
];

const ACCOUNT_LABEL: Record<AccountType, string> = {
  wechat: '微信',
  alipay: '支付宝',
  bank:   '银行卡',
};

const STATUS_CONFIG: Record<PayoutStatus, { label: string; className: string }> = {
  pending:  { label: '待处理', className: 'statusPending' },
  approved: { label: '审核中', className: 'statusApproved' },
  paid:     { label: '已打款', className: 'statusPaid' },
  rejected: { label: '已拒绝', className: 'statusRejected' },
};

// ─── Mock 数据 ──────────────────────────────────────────────────

const MOCK_APPLICATIONS: PayoutApplication[] = [
  {
    id: 'pay-001',
    partnerName: '张伟',
    partnerPhone: '138****8821',
    partnerCity: '上海',
    amount: 2000,
    accountType: 'alipay',
    accountNo: '138****8821',
    accountName: '张伟',
    status: 'pending',
    appliedAt: '2026-04-29 16:42',
  },
  {
    id: 'pay-002',
    partnerName: '李晓雪',
    partnerPhone: '139****5566',
    partnerCity: '北京',
    amount: 500,
    accountType: 'wechat',
    accountNo: 'lixiaoxue_wx',
    accountName: '李晓雪',
    status: 'pending',
    appliedAt: '2026-04-29 14:15',
  },
  {
    id: 'pay-003',
    partnerName: '王大明',
    partnerPhone: '156****9930',
    partnerCity: '广州',
    amount: 3500,
    accountType: 'bank',
    accountNo: '6222****1234',
    accountName: '王大明',
    status: 'pending',
    appliedAt: '2026-04-28 21:08',
  },
  {
    id: 'pay-004',
    partnerName: '陈芳芳',
    partnerPhone: '187****4412',
    partnerCity: '成都',
    amount: 1200,
    accountType: 'alipay',
    accountNo: '187****4412',
    accountName: '陈芳芳',
    status: 'paid',
    appliedAt: '2026-04-27 10:30',
    paidAt: '2026-04-28 09:12',
    txnNo: 'TXN20260428001',
  },
  {
    id: 'pay-005',
    partnerName: '赵思远',
    partnerPhone: '135****7701',
    partnerCity: '杭州',
    amount: 800,
    accountType: 'wechat',
    accountNo: 'zhaosiyuan',
    accountName: '赵思远',
    status: 'paid',
    appliedAt: '2026-04-26 16:55',
    paidAt: '2026-04-27 14:30',
    txnNo: 'TXN20260427001',
  },
  {
    id: 'pay-006',
    partnerName: '刘宇轩',
    partnerPhone: '180****2288',
    partnerCity: '深圳',
    amount: 10000,
    accountType: 'bank',
    accountNo: '6217****5678',
    accountName: '刘宇轩',
    status: 'rejected',
    appliedAt: '2026-04-25 09:20',
    rejectReason: '银行卡账号信息有误，请重新提交',
  },
];

// ─── 子组件：摘要统计栏 ──────────────────────────────────────────

interface SummaryBarProps {
  applications: PayoutApplication[];
}

const SummaryBar: React.FC<SummaryBarProps> = React.memo(({ applications }) => {
  const pendingCount = applications.filter(a => a.status === 'pending').length;
  const paidTotal = applications
    .filter(a => a.status === 'paid')
    .reduce((sum, a) => sum + a.amount, 0);
  const pendingTotal = applications
    .filter(a => a.status === 'pending')
    .reduce((sum, a) => sum + a.amount, 0);

  return (
    <div className={styles.summaryBar}>
      <div className={styles.summaryItem}>
        <div className={`${styles.summaryVal} ${pendingCount > 0 ? styles.summaryValPending : ''}`}>
          {pendingCount}
        </div>
        <div className={styles.summaryLabel}>待处理</div>
      </div>
      <div className={styles.summaryDivider} aria-hidden="true" />
      <div className={styles.summaryItem}>
        <div className={styles.summaryVal}>
          ¥{pendingTotal.toLocaleString('zh-CN')}
        </div>
        <div className={styles.summaryLabel}>待打款金额</div>
      </div>
      <div className={styles.summaryDivider} aria-hidden="true" />
      <div className={styles.summaryItem}>
        <div className={styles.summaryVal}>
          ¥{paidTotal.toLocaleString('zh-CN')}
        </div>
        <div className={styles.summaryLabel}>已打款累计</div>
      </div>
    </div>
  );
});

SummaryBar.displayName = 'SummaryBar';

// ─── 子组件：单条申请卡片 ────────────────────────────────────────

interface ApplicationCardProps {
  app: PayoutApplication;
  expanded: boolean;
  onToggle: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const ApplicationCard: React.FC<ApplicationCardProps> = React.memo(({
  app, expanded, onToggle, onApprove, onReject,
}) => {
  const statusCfg = STATUS_CONFIG[app.status];

  return (
    <div className={`${styles.card} ${expanded ? styles.cardExpanded : ''}`}>
      {/* 可点击主行 */}
      <div
        className={styles.cardMain}
        onClick={() => onToggle(app.id)}
        role="button"
        aria-expanded={expanded}
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onToggle(app.id)}
      >
        {/* 头像 */}
        <div className={`${styles.avatar} ${styles[`avatar_${app.status}`]}`} aria-hidden="true">
          {app.partnerName[0]}
        </div>

        {/* 姓名 + 金额 */}
        <div className={styles.cardInfo}>
          <div className={styles.cardNameRow}>
            <span className={styles.cardName}>{app.partnerName}</span>
            <span className={styles.cardCity}>📍 {app.partnerCity}</span>
          </div>
          <div className={styles.cardMeta}>
            <span>{app.partnerPhone}</span>
            <span className={styles.metaDot} aria-hidden="true" />
            <span>{app.appliedAt}</span>
          </div>
        </div>

        {/* 金额 + 状态 + 展开箭头 */}
        <div className={styles.cardRight}>
          <div className={styles.cardAmount}>
            ¥{app.amount.toLocaleString('zh-CN')}
          </div>
          <div className={styles[statusCfg.className]}>
            {statusCfg.label}
          </div>
          <svg
            className={`${styles.expandArrow} ${expanded ? styles.expandArrowOpen : ''}`}
            width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* 展开详情 */}
      {expanded && (
        <div className={styles.cardDetail}>
          <div className={styles.detailDivider} aria-hidden="true" />

          {/* 收款信息网格 */}
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>收款方式</span>
              <span className={styles.detailVal}>{ACCOUNT_LABEL[app.accountType]}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>收款账号</span>
              <span className={styles.detailVal}>{app.accountNo}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>收款人</span>
              <span className={styles.detailVal}>{app.accountName}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>申请金额</span>
              <span className={`${styles.detailVal} ${styles.detailValAmount}`}>
                ¥{app.amount.toLocaleString('zh-CN')}
              </span>
            </div>
            {app.txnNo && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>流水号</span>
                <span className={styles.detailVal}>{app.txnNo}</span>
              </div>
            )}
            {app.paidAt && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>打款时间</span>
                <span className={styles.detailVal}>{app.paidAt}</span>
              </div>
            )}
          </div>

          {/* 拒绝原因 */}
          {app.rejectReason && (
            <div className={styles.rejectTip}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>拒绝原因：{app.rejectReason}</span>
            </div>
          )}

          {/* 待处理操作按钮 */}
          {app.status === 'pending' && (
            <div className={styles.actionRow}>
              <button
                className={styles.rejectBtn}
                onClick={e => { e.stopPropagation(); onReject(app.id); }}
                aria-label={`拒绝 ${app.partnerName} 的打款申请`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                拒绝
              </button>
              <button
                className={styles.approveBtn}
                onClick={e => { e.stopPropagation(); onApprove(app.id); }}
                aria-label={`确认打款给 ${app.partnerName}`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
                确认打款
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

ApplicationCard.displayName = 'ApplicationCard';

// ─── 主页面组件 ─────────────────────────────────────────────────

const PartnerPayout: React.FC = () => {
  const navigate = useAnimatedNavigate();

  const [applications, setApplications] = useState<PayoutApplication[]>(MOCK_APPLICATIONS);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const pendingCount = useMemo(
    () => applications.filter(a => a.status === 'pending').length,
    [applications],
  );

  const filtered = useMemo(() => {
    switch (activeTab) {
      case 'pending':  return applications.filter(a => a.status === 'pending');
      case 'paid':     return applications.filter(a => a.status === 'paid');
      case 'rejected': return applications.filter(a => a.status === 'rejected');
      default:         return applications;
    }
  }, [applications, activeTab]);

  const handleToggle = useCallback((id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  const handleApprove = useCallback((id: string) => {
    setApplications(prev =>
      prev.map(a => a.id === id
        ? {
            ...a,
            status: 'paid' as const,
            paidAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
            txnNo: `TXN${Date.now()}`,
          }
        : a,
      ),
    );
    setExpandedId(null);
  }, []);

  const handleReject = useCallback((id: string) => {
    setApplications(prev =>
      prev.map(a => a.id === id
        ? { ...a, status: 'rejected' as const, rejectReason: '信息审核不通过，请重新提交' }
        : a,
      ),
    );
    setExpandedId(null);
  }, []);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.blurOrb} aria-hidden="true" />

      <PageHeader
        title="合伙人打款"
        onBack={() => navigate(-1)}
      />

      <main className={styles.contentWrapper}>

        {/* 摘要统计 */}
        <SummaryBar applications={applications} />

        {/* 筛选 Tab */}
        <div className={styles.filterWrap}>
          {TAB_OPTIONS.map(tab => (
            <button
              key={tab.value}
              className={`${styles.filterBtn} ${activeTab === tab.value ? styles.filterBtnActive : ''}`}
              onClick={() => setActiveTab(tab.value)}
              aria-pressed={activeTab === tab.value}
            >
              {tab.label}
              {tab.value === 'pending' && pendingCount > 0 && (
                <span className={styles.filterBadge}>{pendingCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* 申请列表 */}
        <div className={styles.listWrap}>
          {filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
                <rect x="2" y="5" width="20" height="14" rx="3" />
                <line x1="2" y1="10" x2="22" y2="10" />
                <line x1="6" y1="15" x2="10" y2="15" />
                <line x1="14" y1="15" x2="18" y2="15" />
              </svg>
              <span>暂无{activeTab === 'pending' ? '待处理' : activeTab === 'paid' ? '已打款' : activeTab === 'rejected' ? '已拒绝' : ''}记录</span>
            </div>
          ) : (
            filtered.map(app => (
              <ApplicationCard
                key={app.id}
                app={app}
                expanded={expandedId === app.id}
                onToggle={handleToggle}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))
          )}
        </div>

      </main>
    </div>
  );
};

export default PartnerPayout;
