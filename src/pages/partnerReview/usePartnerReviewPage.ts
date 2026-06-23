// 合伙人申请审核页控制器：管理列表加载、筛选、确认弹窗与审核提交流程。
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
  PartnerReviewConfirmTarget,
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
  const [confirmTarget, setConfirmTarget] = useState<PartnerReviewConfirmTarget | null>(null);
  const requestIdRef = useRef(0);
  // Bug #2: 用 ref 做防重提交守卫，避免双击时 state 还未更新就发起第二次请求
  const isSubmittingRef = useRef(false);

  const isSubmitting = Boolean(submittingActionId);

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

  // Bug #4: 审核提交期间锁定卡片展开/折叠
  const handleToggleExpand = useCallback((id: string): void => {
    if (isSubmitting) {
      return;
    }

    setExpandedId((prevExpandedId) => (prevExpandedId === id ? null : id));
  }, [isSubmitting]);

  // Bug #1: 打开确认弹窗，替代原来的直接提交
  const handleOpenConfirm = useCallback((application: PartnerApplication, action: ReviewSubmitAction): void => {
    if (isSubmitting) {
      return;
    }

    setConfirmTarget({ application, action });
  }, [isSubmitting]);

  const handleCancelConfirm = useCallback((): void => {
    if (isSubmitting) {
      return;
    }

    setConfirmTarget(null);
  }, [isSubmitting]);

  // Bug #1 & #2 & #3 & #5: 确认弹窗的确认回调
  const handleConfirm = useCallback(async (): Promise<void> => {
    // Bug #2: 用 ref 做防重提交守卫，避免双击和闭包陈旧问题
    if (isSubmittingRef.current) {
      return;
    }

    if (!confirmTarget) {
      return;
    }

    const { application, action } = confirmTarget;
    const nextStatus: ApplicationStatus = action === 'approve' ? 'approved' : 'rejected';

    isSubmittingRef.current = true;
    setSubmittingActionId(application.id);
    setSubmittingActionType(action);

    try {
      if (action === 'approve') {
        await submitPartnerReviewApprove(application.id);
      } else {
        await submitPartnerReviewReject(application.id);
      }

      showToast({
        type: 'success',
        message: action === 'approve' ? `已通过「${application.name}」的申请` : `已拒绝「${application.name}」的申请`,
      });

      setConfirmTarget(null);
      setExpandedId(null);

      // Bug #5: 审核成功后刷新列表，确保与后端数据一致
      requestIdRef.current += 1;
      try {
        const response = await fetchPartnerReviewList();
        setApplications(response.applications);
      } catch {
        // 刷新失败时本地更新状态作为兜底
        setApplications((prevApplications) =>
          prevApplications.map((item) =>
            item.id === application.id ? { ...item, status: nextStatus } : item,
          ),
        );
      }
    } catch (error) {
      // Bug #3: 移除 throw error，错误已通过 showToast 展示，无需再次抛出
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : (action === 'approve' ? '审核通过失败，请稍后重试' : '审核拒绝失败，请稍后重试'),
      });
    } finally {
      isSubmittingRef.current = false;
      setSubmittingActionId(null);
      setSubmittingActionType(null);
    }
  }, [confirmTarget]);

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
    confirmTarget,
    setActiveTab,
    handleToggleExpand,
    handleOpenConfirm,
    handleCancelConfirm,
    handleConfirm,
    retryLoad,
  };
};
