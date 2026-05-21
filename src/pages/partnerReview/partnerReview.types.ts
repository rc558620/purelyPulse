// 合伙人申请审核页类型：统一列表项、状态枚举与页面 hook 返回结构。
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';
export type ReviewFilterTab = 'all' | 'pending' | 'approved' | 'rejected';
export type ReviewSubmitAction = 'approve' | 'reject';

export interface PartnerApplication {
  id: string;
  name: string;
  phone: string;
  city: string;
  appliedAt: string;
  reason: string;
  avatar: string;
  status: ApplicationStatus;
}

export interface PartnerReviewStats {
  totalCount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

export interface UsePartnerReviewPageReturn {
  applications: PartnerApplication[];
  filteredApplications: PartnerApplication[];
  activeTab: ReviewFilterTab;
  expandedId: string | null;
  isLoading: boolean;
  submittingActionId: string | null;
  submittingActionType: ReviewSubmitAction | null;
  errorMessage: string;
  stats: PartnerReviewStats;
  setActiveTab: (tab: ReviewFilterTab) => void;
  handleToggleExpand: (id: string) => void;
  handleApprove: (id: string) => Promise<void>;
  handleReject: (id: string) => Promise<void>;
  retryLoad: () => void;
}
