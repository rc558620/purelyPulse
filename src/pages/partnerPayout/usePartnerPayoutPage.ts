// 合伙人打款页面状态编排 hook
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { showToast } from '@components/ui/feedback/Toast';
import { safeNum } from '@utils/utils';
import {
  fetchPartnerPayoutList,
  submitPartnerPayoutApprove,
  submitPartnerPayoutReject,
} from './partnerPayout.service';
import type {
  PartnerPayoutApplication,
  PartnerPayoutConfirmAction,
  PartnerPayoutConfirmState,
  PartnerPayoutStats,
  PartnerPayoutStatus,
  PartnerPayoutSummary,
  PartnerPayoutTabKey,
  UsePartnerPayoutPageReturn,
} from './partnerPayout.types';

interface PartnerPayoutDerivedState {
  /** 当前筛选后的申请列表 */
  filteredApplications: PartnerPayoutApplication[];
  /** 页面头部汇总数据 */
  summary: PartnerPayoutSummary;
  /** 页面统计数据（后端优先，回退前端计算） */
  stats: PartnerPayoutStats;
}

const buildDerivedState = (
  applications: PartnerPayoutApplication[],
  activeTab: PartnerPayoutTabKey,
  serverStats?: PartnerPayoutStats | null,
): PartnerPayoutDerivedState => {
  const pendingApplications: PartnerPayoutApplication[] = [];
  const approvedApplications: PartnerPayoutApplication[] = [];
  const paidApplications: PartnerPayoutApplication[] = [];
  const rejectedApplications: PartnerPayoutApplication[] = [];
  let pendingAmount = 0;

  for (const application of applications) {
    if (application.status === 'pending') {
      pendingApplications.push(application);
      pendingAmount += safeNum(application.amount);
      continue;
    }

    if (application.status === 'approved') {
      approvedApplications.push(application);
      continue;
    }

    if (application.status === 'paid') {
      paidApplications.push(application);
      continue;
    }

    if (application.status === 'rejected') {
      rejectedApplications.push(application);
    }
  }

  const getFilteredApplications = (): PartnerPayoutApplication[] => {
    switch (activeTab) {
      case 'pending':
        return pendingApplications;
      case 'approved':
        return approvedApplications;
      case 'paid':
        return paidApplications;
      case 'rejected':
        return rejectedApplications;
      default:
        return applications;
    }
  };

  // 基于当前页数据计算的前端 stats（作为 serverStats 缺失时的回退）
  const computedStats: PartnerPayoutStats = {
    totalCount: applications.length,
    pendingCount: pendingApplications.length,
    approvedCount: approvedApplications.length,
    paidCount: paidApplications.length,
    rejectedCount: rejectedApplications.length,
  };

  // 优先使用后端返回的 stats，回退到前端计算
  const derivedStats: PartnerPayoutStats = serverStats
    ? {
      totalCount: serverStats.totalCount || computedStats.totalCount,
      pendingCount: serverStats.pendingCount || computedStats.pendingCount,
      approvedCount: serverStats.approvedCount || computedStats.approvedCount,
      paidCount: serverStats.paidCount || computedStats.paidCount,
      rejectedCount: serverStats.rejectedCount || computedStats.rejectedCount,
    }
    : computedStats;

  return {
    filteredApplications: getFilteredApplications(),
    summary: {
      pendingCount: pendingApplications.length,
      pendingAmount,
      paidAmount: paidApplications.reduce((total, application) => total + safeNum(application.amount), 0),
    },
    stats: derivedStats,
  };
};

const formatCurrentDateTime = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
};

const updateApplicationStatus = (
  applications: PartnerPayoutApplication[],
  id: string,
  status: PartnerPayoutStatus,
  options?: { rejectReason?: string },
): PartnerPayoutApplication[] => applications.map((application) => {
  if (application.id !== id) {
    return application;
  }

  if (status === 'approved') {
    return {
      ...application,
      status,
      rejectReason: undefined,
    };
  }

  if (status === 'paid') {
    return {
      ...application,
      status,
      paidAt: application.paidAt ?? formatCurrentDateTime(),
      rejectReason: undefined,
    };
  }

  return {
    ...application,
    status,
    rejectReason: status === 'rejected' ? (options?.rejectReason ?? '打款申请已拒绝') : undefined,
  };
});

const INITIAL_CONFIRM_STATE: PartnerPayoutConfirmState = {
  visible: false,
  action: 'approve',
  application: null,
};

export const usePartnerPayoutPage = (): UsePartnerPayoutPageReturn => {
  const [applications, setApplications] = useState<PartnerPayoutApplication[]>([]);
  const [activeTab, setActiveTab] = useState<PartnerPayoutTabKey>('all');
  const [expandedApplicationId, setExpandedApplicationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submittingApplicationId, setSubmittingApplicationId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmState, setConfirmState] = useState<PartnerPayoutConfirmState>(INITIAL_CONFIRM_STATE);
  const [serverStats, setServerStats] = useState<PartnerPayoutStats | null>(null);
  const requestIdRef = useRef(0);
  const isSubmittingRef = useRef(false);

  const loadPartnerPayoutData = useCallback(async (): Promise<void> => {
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;
    setIsLoading(true);

    try {
      const response = await fetchPartnerPayoutList();
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setApplications(response.applications);
      setServerStats(response.stats);
      setErrorMessage('');
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setApplications([]);
      setServerStats(null);
      setErrorMessage(error instanceof Error ? error.message : '获取合伙人打款列表失败');
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadPartnerPayoutData();
  }, [loadPartnerPayoutData]);

  const { filteredApplications, summary, stats } = useMemo(
    () => buildDerivedState(applications, activeTab, serverStats),
    [activeTab, applications, serverStats],
  );

  const handleApplicationToggle = useCallback((id: string): void => {
    if (isSubmittingRef.current) {
      return;
    }
    setExpandedApplicationId((prevExpandedId) => (prevExpandedId === id ? null : id));
  }, []);

  const handleOpenConfirm = useCallback((id: string, action: PartnerPayoutConfirmAction): void => {
    if (isSubmittingRef.current) {
      return;
    }
    const targetApplication = applications.find((application) => application.id === id);
    if (!targetApplication) {
      return;
    }
    setConfirmState({
      visible: true,
      action,
      application: targetApplication,
    });
  }, [applications]);

  const handleCloseConfirm = useCallback((): void => {
    if (isSubmittingRef.current) {
      return;
    }
    setConfirmState(INITIAL_CONFIRM_STATE);
  }, []);

  const handleConfirmSubmit = useCallback(async (action: PartnerPayoutConfirmAction, rejectReason?: string): Promise<void> => {
    const targetId = confirmState.application?.id;
    if (!targetId || isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;
    setSubmittingApplicationId(targetId);
    try {
      if (action === 'approve') {
        await submitPartnerPayoutApprove(targetId);
        setApplications((prevApplications) => updateApplicationStatus(prevApplications, targetId, 'approved'));
        showToast({ type: 'success', message: '已确认打款，等待处理' });
      } else {
        const effectiveReason = rejectReason ?? '打款申请已拒绝';
        await submitPartnerPayoutReject(targetId, effectiveReason);
        setApplications((prevApplications) => updateApplicationStatus(prevApplications, targetId, 'rejected', { rejectReason: effectiveReason }));
        showToast({ type: 'success', message: '已拒绝打款申请' });
      }
      setConfirmState(INITIAL_CONFIRM_STATE);
      setExpandedApplicationId(null);
      // 乐观更新后刷新一次列表，保证与服务端状态一致
      await loadPartnerPayoutData();
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : (action === 'approve' ? '确认打款失败，请稍后重试' : '拒绝打款失败，请稍后重试'),
      });
      await loadPartnerPayoutData();
    } finally {
      isSubmittingRef.current = false;
      setSubmittingApplicationId(null);
    }
  }, [confirmState.application?.id, loadPartnerPayoutData]);

  const handleRetry = useCallback((): void => {
    void loadPartnerPayoutData();
  }, [loadPartnerPayoutData]);

  const handleTabChange = useCallback((tab: PartnerPayoutTabKey): void => {
    setActiveTab(tab);
  }, []);

  return {
    activeTab,
    expandedApplicationId,
    submittingApplicationId,
    filteredApplications,
    isLoading,
    isSubmitting: submittingApplicationId !== null,
    errorMessage,
    summary,
    stats,
    confirmState,
    handleTabChange,
    handleApplicationToggle,
    handleOpenConfirm,
    handleCloseConfirm,
    handleConfirmSubmit,
    handleRetry,
  };
};
