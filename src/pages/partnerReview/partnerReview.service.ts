// 合伙人申请审核服务层：封装列表请求、审核动作与后端字段映射。
import { createKeyedInFlightRequest, http, resolveEnvPath } from '@utils/http';
import { safeNum } from '@utils/utils';
import type {
  ApplicationStatus,
  PartnerApplication,
  PartnerReviewStats,
} from './partnerReview.types';

const PARTNER_REVIEW_API_PATH = resolveEnvPath(import.meta.env.VITE_PARTNER_REVIEW_API_PATH, '/pulse/growth/admin/partner-applications');
const PARTNER_REVIEW_APPROVE_API_PATH = resolveEnvPath(import.meta.env.VITE_PARTNER_REVIEW_APPROVE_API_PATH, '/pulse/growth/admin/partner-applications/{id}/approve');
const PARTNER_REVIEW_REJECT_API_PATH = resolveEnvPath(import.meta.env.VITE_PARTNER_REVIEW_REJECT_API_PATH, '/pulse/growth/admin/partner-applications/{id}/reject');

const LIST_SOURCE_CANDIDATES = ['list', 'items', 'rows', 'records', 'applications', 'data'] as const;
const STATS_SOURCE_CANDIDATES = ['stats', 'summary', 'overview'] as const;
const ID_CANDIDATES = ['id', 'applicationId', 'reviewId', 'partnerApplyId'] as const;
const NAME_CANDIDATES = ['name', 'partnerName', 'userName', 'nickname'] as const;
const PHONE_CANDIDATES = ['phone', 'mobile', 'phoneNumber'] as const;
const CITY_CANDIDATES = ['city', 'regionName', 'storeCity', 'addressCity'] as const;
const APPLIED_AT_CANDIDATES = ['appliedAt', 'applyTime', 'createdAt', 'submitTime'] as const;
const REASON_CANDIDATES = ['reason', 'applyReason', 'remark', 'description'] as const;
const AVATAR_CANDIDATES = ['avatar', 'avatarText', 'avatarInitial'] as const;
const STATUS_CANDIDATES = ['status', 'reviewStatus', 'partnerStatus', 'state'] as const;

const isPlainObject = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const getNestedRecord = (value: unknown, keys: readonly string[]): Record<string, unknown> | null => {
  if (!isPlainObject(value)) {
    return null;
  }

  for (const key of keys) {
    const candidate = value[key];
    if (isPlainObject(candidate)) {
      return candidate;
    }
  }

  return null;
};

const getNestedArray = (value: unknown, keys: readonly string[]): unknown[] => {
  if (Array.isArray(value)) {
    return value;
  }

  if (!isPlainObject(value)) {
    return [];
  }

  for (const key of keys) {
    const candidate = value[key];
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
};

const normalizeNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const sanitizedValue = value.replace(/,/g, '').trim();
    if (!sanitizedValue) {
      return 0;
    }
    const parsedValue = Number(sanitizedValue);
    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return 0;
};

const pickStringField = (value: unknown, keys: readonly string[]): string => {
  if (!isPlainObject(value)) {
    return '';
  }

  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return '';
};

const pickNumberField = (value: unknown, keys: readonly string[]): number => {
  if (!isPlainObject(value)) {
    return 0;
  }

  for (const key of keys) {
    const candidate = value[key];
    const normalizedValue = normalizeNumber(candidate);
    if (normalizedValue !== 0 || candidate === 0 || candidate === '0') {
      return safeNum(normalizedValue);
    }
  }

  return 0;
};

const formatDateTime = (value: unknown): string => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  const numericValue = normalizeNumber(value);
  if (numericValue > 0) {
    const timestamp = numericValue < 1_000_000_000_000 ? numericValue * 1000 : numericValue;
    const date = new Date(timestamp);
    if (!Number.isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hour}:${minute}`;
    }
  }

  return '--';
};

const pickFormattedDateTime = (value: unknown, keys: readonly string[]): string => {
  if (!isPlainObject(value)) {
    return '--';
  }

  for (const key of keys) {
    const formattedValue = formatDateTime(value[key]);
    if (formattedValue !== '--') {
      return formattedValue;
    }
  }

  return '--';
};

const maskPhone = (value: string): string => {
  const normalizedValue = value.replace(/\s+/g, '');
  if (!/^1\d{10}$/.test(normalizedValue)) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, 3)}****${normalizedValue.slice(-4)}`;
};

const normalizeStatus = (value: string): ApplicationStatus => {
  switch (value.toLowerCase()) {
    case 'approved':
    case 'pass':
    case 'passed':
    case 'success':
      return 'approved';
    case 'rejected':
    case 'reject':
    case 'failed':
    case 'refused':
      return 'rejected';
    case 'pending':
    case 'waiting':
    case 'reviewing':
    case 'submitted':
    default:
      return 'pending';
  }
};

const resolveAvatar = (name: string, rawValue: unknown): string => {
  const avatar = pickStringField(rawValue, AVATAR_CANDIDATES);
  if (avatar) {
    return avatar.slice(0, 1);
  }

  return name.slice(0, 1) || '合';
};

const resolveActionPath = (rawPath: string, id: string): { url: string; params: Record<string, string> } => {
  const normalizedId = id.trim();
  if (!normalizedId) {
    return { url: rawPath, params: {} };
  }

  if (rawPath.includes('{id}')) {
    return { url: rawPath.replace(/\{id\}/g, encodeURIComponent(normalizedId)), params: {} };
  }

  if (rawPath.includes(':id')) {
    return { url: rawPath.replace(/:id\b/g, encodeURIComponent(normalizedId)), params: {} };
  }

  return {
    url: rawPath,
    params: {
      id: normalizedId,
      applicationId: normalizedId,
      reviewId: normalizedId,
    },
  };
};

const mapApplication = (rawValue: unknown): PartnerApplication | null => {
  if (!isPlainObject(rawValue)) {
    return null;
  }

  const id = pickStringField(rawValue, ID_CANDIDATES);
  if (!id) {
    return null;
  }

  const name = pickStringField(rawValue, NAME_CANDIDATES) || '未命名申请人';
  const phone = maskPhone(pickStringField(rawValue, PHONE_CANDIDATES)) || '--';
  const city = pickStringField(rawValue, CITY_CANDIDATES) || '--';
  const reason = pickStringField(rawValue, REASON_CANDIDATES) || '暂无申请理由';
  const status = normalizeStatus(pickStringField(rawValue, STATUS_CANDIDATES));

  return {
    id,
    name,
    phone,
    city,
    appliedAt: pickFormattedDateTime(rawValue, APPLIED_AT_CANDIDATES),
    reason,
    avatar: resolveAvatar(name, rawValue),
    status,
  };
};

const computeStats = (applications: PartnerApplication[]): PartnerReviewStats => ({
  totalCount: applications.length,
  pendingCount: applications.filter((application) => application.status === 'pending').length,
  approvedCount: applications.filter((application) => application.status === 'approved').length,
  rejectedCount: applications.filter((application) => application.status === 'rejected').length,
});

const mapStats = (response: unknown, applications: PartnerApplication[]): PartnerReviewStats => {
  const statsSource = getNestedRecord(response, STATS_SOURCE_CANDIDATES)
    ?? (isPlainObject(response) ? response : null);
  if (!statsSource) {
    return computeStats(applications);
  }

  return {
    totalCount: pickNumberField(statsSource, ['totalCount', 'total', 'allCount']) || applications.length,
    pendingCount: pickNumberField(statsSource, ['pendingCount', 'waitingCount', 'todoCount']) || applications.filter((application) => application.status === 'pending').length,
    approvedCount: pickNumberField(statsSource, ['approvedCount', 'passCount', 'successCount']) || applications.filter((application) => application.status === 'approved').length,
    rejectedCount: pickNumberField(statsSource, ['rejectedCount', 'rejectCount', 'failedCount']) || applications.filter((application) => application.status === 'rejected').length,
  };
};

const requestPartnerReviewList = async (): Promise<{ applications: PartnerApplication[]; stats: PartnerReviewStats }> => {
  const response = await http.get<unknown>(PARTNER_REVIEW_API_PATH, {
    skipGlobalErrorHandler: true,
    errorMessage: '获取合伙人申请列表失败',
  });

  const rawApplications = getNestedArray(response, LIST_SOURCE_CANDIDATES);
  const applications = rawApplications
    .map((rawValue) => mapApplication(rawValue))
    .filter((item): item is PartnerApplication => item !== null);

  return {
    applications,
    stats: mapStats(response, applications),
  };
};

const submitPartnerReviewAction = async (rawPath: string, id: string, action: 'approve' | 'reject'): Promise<void> => {
  const requestTarget = resolveActionPath(rawPath, id);
  const payload = action === 'approve'
    ? { note: '' }
    : { reason: '审核未通过' };
  await http.patch<unknown, Record<string, unknown>>(
    requestTarget.url,
    payload,
    {
      params: requestTarget.params,
      skipGlobalErrorHandler: true,
      errorMessage: action === 'approve' ? '审核通过失败，请稍后重试' : '审核拒绝失败，请稍后重试',
    },
  );
};

export const fetchPartnerReviewList = createKeyedInFlightRequest(
  () => 'partner-review-list',
  async (): Promise<{ applications: PartnerApplication[]; stats: PartnerReviewStats }> => requestPartnerReviewList(),
);

export const submitPartnerReviewApprove = async (id: string): Promise<void> => {
  await submitPartnerReviewAction(PARTNER_REVIEW_APPROVE_API_PATH, id, 'approve');
};

export const submitPartnerReviewReject = async (id: string): Promise<void> => {
  await submitPartnerReviewAction(PARTNER_REVIEW_REJECT_API_PATH, id, 'reject');
};
