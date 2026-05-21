import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { showToast } from '@components/ui/feedback/Toast';
import {
  fetchPartnerReviewList,
  submitPartnerReviewApprove,
  submitPartnerReviewReject,
} from './partnerReview.service';
import type {
  ApplicationStatus,
  PartnerApplication,
  PartnerReviewStats,
  ReviewFilterTab,
  ReviewSubmitAction,
  UsePartnerReviewPageReturn,
} from './partnerReview.types';

const EMPTY_STATS: PartnerReviewStats = {
  totalCount: 0,
  pendingCount: 0,
  approvedCount: 0,
  rejectedCount: 0,
};

export const usePartnerReviewPage = (): UsePartnerReviewPageReturn => {
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [activeTab, setActiveTab] = useState<ReviewFilterTab>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submittingActionId, setSubmittingActionId] = useState<string | null>(null);
  const [submittingActionType, setSubmittingActionType] = useState<ReviewSubmitAction | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const requestIdRef = useRef(0);

  const loadPageData = useCallback(async (): Promise<void> => {
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;
    setIsLoading(true);

    try {
      const response = await fetchPartnerReviewList();
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
      setErrorMessage(error instanceof Error ? error.message : '获取合伙人申请列表失败');
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadPageData();
  }, [loadPageData]);

  const { filteredApplications, stats } = useMemo((): {
    filteredApplications: PartnerApplication[];
    stats: PartnerReviewStats;
  } => {
    if (applications.length === 0) {
      return {
        filteredApplications: [],
        stats: EMPTY_STATS,
      };
    }

    const pendingApplications: PartnerApplication[] = [];
    const approvedApplications: PartnerApplication[] = [];
    const rejectedApplications: PartnerApplication[] = [];

    applications.forEach((application) => {
      if (application.status === 'pending') {
        pendingApplications.push(application);
        return;
      }

      if (application.status === 'approved') {
        approvedApplications.push(application);
        return;
      }

      rejectedApplications.push(application);
    });

    return {
      filteredApplications: activeTab === 'all'
        ? applications
        : activeTab === 'pending'
          ? pendingApplications
          : activeTab === 'approved'
            ? approvedApplications
            : rejectedApplications,
      stats: {
        totalCount: applications.length,
        pendingCount: pendingApplications.length,
        approvedCount: approvedApplications.length,
        rejectedCount: rejectedApplications.length,
      },
    };
  }, [activeTab, applications]);

  const applyReviewResult = useCallback((id: string, nextStatus: ApplicationStatus): void => {
    setApplications((prevApplications) => {
      let didUpdate = false;
      const nextApplications = prevApplications.map((application) => {
        if (application.id !== id || application.status === nextStatus) {
          return application;
        }

        didUpdate = true;
        return {
          ...application,
          status: nextStatus,
        };
      });

      return didUpdate ? nextApplications : prevApplications;
    });
    setExpandedId((prevExpandedId) => (prevExpandedId === id ? null : prevExpandedId));
  }, []);

  const handleToggleExpand = useCallback((id: string): void => {
    setExpandedId((prevExpandedId) => (prevExpandedId === id ? null : id));
  }, []);

  const handleReviewAction = useCallback(async (
    id: string,
    action: ReviewSubmitAction,
    nextStatus: ApplicationStatus,
    successMessage: string,
    failureMessage: string,
  ): Promise<void> => {
    if (submittingActionId) {
      return;
    }

    setSubmittingActionId(id);
    setSubmittingActionType(action);
    try {
      if (action === 'approve') {
        await submitPartnerReviewApprove(id);
      } else {
        await submitPartnerReviewReject(id);
      }

      applyReviewResult(id, nextStatus);
      showToast({ type: 'success', message: successMessage });
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : failureMessage,
      });
      throw error;
    } finally {
      setSubmittingActionId(null);
      setSubmittingActionType(null);
    }
  }, [applyReviewResult, submittingActionId]);

  const handleApprove = useCallback(async (id: string): Promise<void> => {
    await handleReviewAction(id, 'approve', 'approved', '申请已审核通过', '审核通过失败，请稍后重试');
  }, [handleReviewAction]);

  const handleReject = useCallback(async (id: string): Promise<void> => {
    await handleReviewAction(id, 'reject', 'rejected', '申请已拒绝', '审核拒绝失败，请稍后重试');
  }, [handleReviewAction]);

  const retryLoad = useCallback((): void => {
    void loadPageData();
  }, [loadPageData]);

  return {
    applications,
    filteredApplications,
    activeTab,
    expandedId,
    isLoading,
    submittingActionId,
    submittingActionType,
    errorMessage,
    stats,
    setActiveTab,
    handleToggleExpand,
    handleApprove,
    handleReject,
    retryLoad,
  };
};
