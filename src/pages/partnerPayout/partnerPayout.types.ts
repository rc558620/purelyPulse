// 合伙人打款页面类型定义
// 数值字段仅做类型建模，UI 展示统一在消费层经 safeNum 处理。
export type PartnerPayoutStatus = 'pending' | 'approved' | 'paid' | 'rejected';
export type PartnerPayoutAccountType = 'wechat' | 'alipay' | 'bank';
export type PartnerPayoutTabKey = 'all' | 'pending' | 'paid' | 'rejected';

export interface PartnerPayoutApplication {
  /** 申请主键 */
  id: string;
  /** 合伙人姓名 */
  partnerName: string;
  /** 合伙人手机号 */
  partnerPhone: string;
  /** 合伙人所在城市 */
  partnerCity: string;
  /** 申请金额，单位分 */
  amount: number;
  /** 收款账户类型 */
  accountType: PartnerPayoutAccountType;
  /** 收款账号 */
  accountNo: string;
  /** 收款人姓名 */
  accountName: string;
  /** 当前打款状态 */
  status: PartnerPayoutStatus;
  /** 申请时间 */
  appliedAt: string;
  /** 打款时间 */
  paidAt?: string;
  /** 打款流水号 */
  txnNo?: string;
  /** 拒绝原因 */
  rejectReason?: string;
}

export interface PartnerPayoutSummary {
  /** 待处理申请数 */
  pendingCount: number;
  /** 待打款金额，单位分 */
  pendingAmount: number;
  /** 已打款累计金额，单位分 */
  paidAmount: number;
}

export interface PartnerPayoutStats {
  /** 记录总数 */
  totalCount: number;
  /** 待处理记录数 */
  pendingCount: number;
  /** 已打款记录数 */
  paidCount: number;
  /** 已拒绝记录数 */
  rejectedCount: number;
}

export interface UsePartnerPayoutPageReturn {
  /** 当前激活的筛选标签 */
  activeTab: PartnerPayoutTabKey;
  /** 当前展开的申请主键 */
  expandedApplicationId: string | null;
  /** 当前正在提交的申请主键 */
  submittingApplicationId: string | null;
  /** 当前筛选后的申请列表 */
  filteredApplications: PartnerPayoutApplication[];
  /** 页面首屏加载中 */
  isLoading: boolean;
  /** 页面是否存在提交动作 */
  isSubmitting: boolean;
  /** 页面错误文案 */
  errorMessage: string;
  /** 汇总统计数据 */
  summary: PartnerPayoutSummary;
  /** 页面状态统计 */
  stats: PartnerPayoutStats;
  /** 切换筛选标签 */
  handleTabChange: (tab: PartnerPayoutTabKey) => void;
  /** 切换申请卡片展开态 */
  handleApplicationToggle: (id: string) => void;
  /** 确认打款 */
  handleApprove: (id: string) => Promise<void>;
  /** 拒绝打款 */
  handleReject: (id: string) => Promise<void>;
  /** 重新加载页面数据 */
  handleRetry: () => void;
}
