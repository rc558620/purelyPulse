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
  /** 页面统计数据 */
  stats: PartnerPayoutStats;
}

const buildDerivedState = (
  applications: PartnerPayoutApplication[],
  activeTab: PartnerPayoutTabKey,
): PartnerPayoutDerivedState => {
  const pendingApplications: PartnerPayoutApplication[] = [];
  const paidApplications: PartnerPayoutApplication[] = [];
  const rejectedApplications: PartnerPayoutApplication[] = [];
  let pendingAmount = 0;

  for (const application of applications) {
    if (application.status === 'pending') {
      pendingApplications.push(application);
      pendingAmount += safeNum(application.amount);
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

  return {
    filteredApplications: activeTab === 'all'
      ? applications
      : activeTab === 'pending'
        ? pendingApplications
        : activeTab === 'paid'
          ? paidApplications
          : rejectedApplications,
    summary: {
      pendingCount: pendingApplications.length,
      pendingAmount,
      paidAmount: paidApplications.reduce((total, application) => total + safeNum(application.amount), 0),
    },
    stats: {
      totalCount: applications.length,
      pendingCount: pendingApplications.length,
      paidCount: paidApplications.length,
      rejectedCount: rejectedApplications.length,
    },
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
): PartnerPayoutApplication[] => applications.map((application) => {
  if (application.id !== id) {
    return application;
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
    rejectReason: status === 'rejected' ? application.rejectReason ?? '后台处理中' : undefined,
  };
});

export const usePartnerPayoutPage = (): UsePartnerPayoutPageReturn => {
  const [applications, setApplications] = useState<PartnerPayoutApplication[]>([]);
  const [activeTab, setActiveTab] = useState<PartnerPayoutTabKey>('all');
  const [expandedApplicationId, setExpandedApplicationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submittingApplicationId, setSubmittingApplicationId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
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
      setErrorMessage('');
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setApplications([]);
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
    () => buildDerivedState(applications, activeTab),
    [activeTab, applications],
  );

  const handleApplicationToggle = useCallback((id: string): void => {
    if (isSubmittingRef.current) {
      return;
    }
    setExpandedApplicationId((prevExpandedId) => (prevExpandedId === id ? null : id));
  }, []);

  const handleApprove = useCallback(async (id: string): Promise<void> => {
    if (isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;
    setSubmittingApplicationId(id);
    try {
      await submitPartnerPayoutApprove(id);
      setApplications((prevApplications) => updateApplicationStatus(prevApplications, id, 'paid'));
      setExpandedApplicationId((prevExpandedId) => (prevExpandedId === id ? null : prevExpandedId));
      showToast({ type: 'success', message: '已确认打款' });
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : '确认打款失败，请稍后重试',
      });
      await loadPartnerPayoutData();
    } finally {
      isSubmittingRef.current = false;
      setSubmittingApplicationId(null);
    }
  }, [loadPartnerPayoutData]);

  const handleReject = useCallback(async (id: string): Promise<void> => {
    if (isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;
    setSubmittingApplicationId(id);
    try {
      await submitPartnerPayoutReject(id);
      setApplications((prevApplications) => updateApplicationStatus(prevApplications, id, 'rejected'));
      setExpandedApplicationId((prevExpandedId) => (prevExpandedId === id ? null : prevExpandedId));
      showToast({ type: 'success', message: '已拒绝打款申请' });
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : '拒绝打款失败，请稍后重试',
      });
      await loadPartnerPayoutData();
    } finally {
      isSubmittingRef.current = false;
      setSubmittingApplicationId(null);
    }
  }, [loadPartnerPayoutData]);

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
    handleTabChange,
    handleApplicationToggle,
    handleApprove,
    handleReject,
    handleRetry,
  };
};
