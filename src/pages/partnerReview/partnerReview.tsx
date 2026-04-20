import React, { useCallback, useMemo, useState } from 'react';
import PageHeader from '@components/ui/layout/PageHeader';
import { useAnimatedNavigate } from '@hooks/useAnimatedNavigate';
import styles from './partnerReview.module.less';

// ─── 类型定义 ────────────────────────────────────────────────────
type ApplicationStatus = 'pending' | 'approved' | 'rejected';

interface PartnerApplication {
  id: string;
  name: string;
  phone: string;
  city: string;
  appliedAt: string;
  reason: string;
  avatar: string;
  status: ApplicationStatus;
}

// ─── Mock 数据 ──────────────────────────────────────────────────
const INITIAL_APPLICATIONS: PartnerApplication[] = [
  {
    id: 'app-001',
    name: '刘梅',
    phone: '138****9021',
    city: '深圳',
    appliedAt: '2026-04-19 14:32',
    reason: '我有稳定的客户资源，在健身行业深耕5年，拥有私教学员200+，希望通过合伙人计划为更多用户提供健康管理服务。',
    avatar: '刘',
    status: 'pending',
  },
  {
    id: 'app-002',
    name: '陈建国',
    phone: '139****5566',
    city: '武汉',
    appliedAt: '2026-04-19 10:15',
    reason: '本人经营健康食品门店多年，拥有忠实消费群体，希望通过平台合作扩大影响力，互利共赢。',
    avatar: '陈',
    status: 'pending',
  },
  {
    id: 'app-003',
    name: '王雅婷',
    phone: '156****8830',
    city: '成都',
    appliedAt: '2026-04-18 21:08',
    reason: '小红书健康博主，粉丝量15万+，专注于营养健康内容创作，愿意为平台做内容推广，希望正式成为合伙人。',
    avatar: '王',
    status: 'pending',
  },
  {
    id: 'app-004',
    name: '周浩然',
    phone: '187****4412',
    city: '南京',
    appliedAt: '2026-04-18 16:44',
    reason: '从事企业健康福利采购工作，对接多家大型企业HR，有意向通过合伙人渠道为企业员工提供健康服务套餐。',
    avatar: '周',
    status: 'pending',
  },
  {
    id: 'app-005',
    name: '林晓燕',
    phone: '135****7701',
    city: '厦门',
    appliedAt: '2026-04-17 09:55',
    reason: '瑜伽馆主理人，专注女性身心健康，会员群体精准，希望引入平台服务提升会员体验。',
    avatar: '林',
    status: 'pending',
  },
];

// ─── 组件 ───────────────────────────────────────────────────────
const PartnerReview: React.FC = () => {
  const navigate = useAnimatedNavigate();

  const [applications, setApplications] = useState<PartnerApplication[]>(INITIAL_APPLICATIONS);
  const [appFilter, setAppFilter] = useState<ApplicationStatus | 'all'>('all');
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);

  const pendingCount = applications.filter(a => a.status === 'pending').length;
  const approvedCount = applications.filter(a => a.status === 'approved').length;
  const rejectedCount = applications.filter(a => a.status === 'rejected').length;

  const filteredApps = useMemo(() => {
    if (appFilter === 'all') return applications;
    return applications.filter(a => a.status === appFilter);
  }, [applications, appFilter]);

  const handleApprove = useCallback((id: string) => {
    setApplications(prev =>
      prev.map(a => a.id === id ? { ...a, status: 'approved' as const } : a)
    );
    setExpandedAppId(null);
  }, []);

  const handleReject = useCallback((id: string) => {
    setApplications(prev =>
      prev.map(a => a.id === id ? { ...a, status: 'rejected' as const } : a)
    );
    setExpandedAppId(null);
  }, []);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedAppId(prev => prev === id ? null : id);
  }, []);

  const FILTER_TABS: { value: ApplicationStatus | 'all'; label: string }[] = [
    { value: 'all',      label: '全部' },
    { value: 'pending',  label: `待审核${pendingCount > 0 ? `（${pendingCount}）` : ''}` },
    { value: 'approved', label: '已通过' },
    { value: 'rejected', label: '已拒绝' },
  ];

  return (
    <div className={styles.pageContainer}>
      <div className={styles.blurOrb} aria-hidden="true" />

      <PageHeader
        title="合伙人申请审核"
        onBack={() => navigate(-1)}
      />

      <main className={styles.contentWrapper}>

        {/* 统计概览 */}
        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <span className={styles.statNum}>{applications.length}</span>
            <span className={styles.statLabel}>总申请</span>
          </div>
          <div className={styles.statDivider} aria-hidden="true" />
          <div className={styles.statItem}>
            <span className={`${styles.statNum} ${styles.statNumPending}`}>{pendingCount}</span>
            <span className={styles.statLabel}>待审核</span>
          </div>
          <div className={styles.statDivider} aria-hidden="true" />
          <div className={styles.statItem}>
            <span className={`${styles.statNum} ${styles.statNumApproved}`}>{approvedCount}</span>
            <span className={styles.statLabel}>已通过</span>
          </div>
          <div className={styles.statDivider} aria-hidden="true" />
          <div className={styles.statItem}>
            <span className={`${styles.statNum} ${styles.statNumRejected}`}>{rejectedCount}</span>
            <span className={styles.statLabel}>已拒绝</span>
          </div>
        </div>

        {/* 筛选 Tab */}
        <div className={styles.filterWrap}>
          {FILTER_TABS.map(tab => (
            <button
              key={tab.value}
              className={`${styles.filterBtn} ${appFilter === tab.value ? styles.filterBtnActive : ''}`}
              onClick={() => setAppFilter(tab.value)}
              aria-pressed={appFilter === tab.value}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 申请列表 */}
        <div className={styles.listCard}>
          {filteredApps.length === 0 ? (
            <div className={styles.emptyState}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M9 9l6 6M15 9l-6 6" />
              </svg>
              <span>
                暂无{appFilter === 'pending' ? '待审核' : appFilter === 'approved' ? '已通过' : appFilter === 'rejected' ? '已拒绝' : ''}申请
              </span>
            </div>
          ) : (
            filteredApps.map(app => (
              <div
                key={app.id}
                className={`${styles.appItem} ${expandedAppId === app.id ? styles.appItemExpanded : ''}`}
              >
                {/* 主信息行（可点击展开） */}
                <div
                  className={styles.appItemMain}
                  onClick={() => handleToggleExpand(app.id)}
                  role="button"
                  aria-expanded={expandedAppId === app.id}
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && handleToggleExpand(app.id)}
                >
                  {/* 头像 */}
                  <div
                    className={`${styles.appAvatar} ${
                      app.status === 'approved' ? styles.appAvatarApproved :
                      app.status === 'rejected' ? styles.appAvatarRejected : ''
                    }`}
                    aria-hidden="true"
                  >
                    {app.avatar}
                  </div>

                  {/* 姓名 + 手机 + 时间 */}
                  <div className={styles.appInfo}>
                    <div className={styles.appNameRow}>
                      <span className={styles.appName}>{app.name}</span>
                      <span className={styles.appCity}>📍 {app.city}</span>
                    </div>
                    <div className={styles.appMeta}>
                      <span>{app.phone}</span>
                      <span className={styles.appMetaDot} aria-hidden="true" />
                      <span>{app.appliedAt}</span>
                    </div>
                  </div>

                  {/* 状态 + 展开箭头 */}
                  <div className={styles.appStatusWrap}>
                    {app.status === 'pending' && (
                      <span className={styles.statusPending}>待审核</span>
                    )}
                    {app.status === 'approved' && (
                      <span className={styles.statusApproved}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        已通过
                      </span>
                    )}
                    {app.status === 'rejected' && (
                      <span className={styles.statusRejected}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        已拒绝
                      </span>
                    )}
                    <svg
                      className={`${styles.expandArrow} ${expandedAppId === app.id ? styles.expandArrowOpen : ''}`}
                      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                      aria-hidden="true"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>

                {/* 展开详情 */}
                {expandedAppId === app.id && (
                  <div className={styles.appDetail}>
                    <div className={styles.reasonLabel}>申请理由</div>
                    <p className={styles.reasonText}>{app.reason}</p>

                    {app.status === 'pending' && (
                      <div className={styles.actionRow}>
                        <button
                          className={styles.rejectBtn}
                          onClick={() => handleReject(app.id)}
                          aria-label={`拒绝 ${app.name} 的申请`}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                          不通过
                        </button>
                        <button
                          className={styles.approveBtn}
                          onClick={() => handleApprove(app.id)}
                          aria-label={`通过 ${app.name} 的申请`}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          通过
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </main>
    </div>
  );
};

export default PartnerReview;
