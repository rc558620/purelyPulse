// 合伙人申请审核页类型：统一列表项、状态枚举与页面 hook 返回结构。

/** 申请审核状态 */
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

/** 筛选标签 */
export type ReviewFilterTab = 'all' | 'pending' | 'approved' | 'rejected';

/** 审核提交动作 */
export type ReviewSubmitAction = 'approve' | 'reject';

/** 合伙人合作意向 */
export type PartnerIntention = 'agent' | 'invest' | 'resource' | 'other';

/** 合伙人申请信息 */
export interface PartnerApplication {
  /** 申请唯一标识 */
  id: string;
  /** 申请人姓名 */
  name: string;
  /** 申请人手机号（已脱敏） */
  phone: string;
  /** 申请人所在城市 */
  city: string;
  /** 申请提交时间 */
  appliedAt: string;
  /** 申请理由 */
  reason: string;
  /** 头像文字（取姓名首字） */
  avatar: string;
  /** 头像图片地址 */
  avatarUrl?: string;
  /** 审核状态 */
  status: ApplicationStatus;
  /** 合作意向 */
  intention: PartnerIntention;
}

/** 合伙人审核统计 */
export interface PartnerReviewStats {
  /** 申请总数 */
  totalCount: number;
  /** 待审核数量 */
  pendingCount: number;
  /** 已通过数量 */
  approvedCount: number;
  /** 已拒绝数量 */
  rejectedCount: number;
}

/** 确认弹窗目标 */
export interface PartnerReviewConfirmTarget {
  /** 目标申请 */
  application: PartnerApplication;
  /** 审核动作 */
  action: ReviewSubmitAction;
}

/** 合伙人申请审核页控制器返回值 */
export interface UsePartnerReviewPageReturn {
  /** 全量申请列表 */
  applications: PartnerApplication[];
  /** 当前筛选后的申请列表 */
  filteredApplications: PartnerApplication[];
  /** 当前激活的筛选标签 */
  activeTab: ReviewFilterTab;
  /** 当前展开的申请 id */
  expandedId: string | null;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 当前提交中的申请 id */
  submittingActionId: string | null;
  /** 当前提交中的动作类型 */
  submittingActionType: ReviewSubmitAction | null;
  /** 错误信息 */
  errorMessage: string;
  /** 审核统计 */
  stats: PartnerReviewStats;
  /** 确认弹窗目标 */
  confirmTarget: PartnerReviewConfirmTarget | null;
  /** 设置筛选标签 */
  setActiveTab: (tab: ReviewFilterTab) => void;
  /** 切换申请展开态 */
  handleToggleExpand: (id: string) => void;
  /** 打开确认弹窗 */
  handleOpenConfirm: (application: PartnerApplication, action: ReviewSubmitAction) => void;
  /** 取消确认弹窗 */
  handleCancelConfirm: () => void;
  /** 确认审核操作 */
  handleConfirm: () => Promise<void>;
  /** 重新加载列表 */
  retryLoad: () => void;
}
