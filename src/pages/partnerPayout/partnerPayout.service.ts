// 合伙人打款服务层：封装列表请求、动作提交与后端字段映射。
import { createKeyedInFlightRequest, http, resolveEnvPath } from '@utils/http';
import { safeNum } from '@utils/utils';
import type {
  PartnerPayoutAccountType,
  PartnerPayoutApplication,
  PartnerPayoutStats,
  PartnerPayoutStatus,
} from './partnerPayout.types';

const PARTNER_PAYOUT_API_PATH = resolveEnvPath(import.meta.env.VITE_PARTNER_PAYOUT_API_PATH, '/pulse/growth/admin/payouts');
const PARTNER_PAYOUT_APPROVE_API_PATH = resolveEnvPath(import.meta.env.VITE_PARTNER_PAYOUT_APPROVE_API_PATH, '/pulse/growth/admin/payouts/{id}/approve');
const PARTNER_PAYOUT_REJECT_API_PATH = resolveEnvPath(import.meta.env.VITE_PARTNER_PAYOUT_REJECT_API_PATH, '/pulse/growth/admin/payouts/{id}/reject');

const LIST_SOURCE_CANDIDATES = ['list', 'items', 'rows', 'records', 'applications', 'data'] as const;
const STATS_SOURCE_CANDIDATES = ['stats', 'summary', 'overview'] as const;
const ID_CANDIDATES = ['id', 'applicationId', 'payoutId', 'withdrawId'] as const;
const PARTNER_NAME_CANDIDATES = ['partnerName', 'name', 'userName', 'memberName'] as const;
const PARTNER_PHONE_CANDIDATES = ['partnerPhone', 'phone', 'mobile', 'phoneNumber'] as const;
const PARTNER_CITY_CANDIDATES = ['partnerCity', 'city', 'regionName', 'storeCity'] as const;
const ACCOUNT_TYPE_CANDIDATES = ['accountType', 'withdrawType', 'payType', 'channel'] as const;
const ACCOUNT_NO_CANDIDATES = ['accountNo', 'accountNumber', 'receivingAccount', 'bankCardNo'] as const;
const ACCOUNT_NAME_CANDIDATES = ['accountName', 'realName', 'receiverName', 'bankAccountName'] as const;
const STATUS_CANDIDATES = ['status', 'payoutStatus', 'withdrawStatus', 'reviewStatus'] as const;
const APPLIED_AT_CANDIDATES = ['appliedAt', 'applyTime', 'createdAt', 'submitTime'] as const;
const PAID_AT_CANDIDATES = ['paidAt', 'payTime', 'processedAt', 'updatedAt'] as const;
const TXN_NO_CANDIDATES = ['txnNo', 'transactionNo', 'tradeNo', 'serialNo'] as const;
const REJECT_REASON_CANDIDATES = ['rejectReason', 'rejectRemark', 'remark', 'reason'] as const;
const AMOUNT_FEN_CANDIDATES = ['amountFen', 'withdrawAmountFen', 'paidAmountFen'] as const;
const AMOUNT_YUAN_CANDIDATES = ['amount', 'withdrawAmount', 'paidAmount'] as const;

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

const pickFenAmountField = (value: unknown): number => {
  if (!isPlainObject(value)) {
    return 0;
  }

  for (const key of AMOUNT_FEN_CANDIDATES) {
    const candidate = value[key];
    const normalizedValue = normalizeNumber(candidate);
    if (normalizedValue !== 0 || candidate === 0 || candidate === '0') {
      return Math.round(normalizedValue);
    }
  }

  for (const key of AMOUNT_YUAN_CANDIDATES) {
    const candidate = value[key];
    const normalizedValue = normalizeNumber(candidate);
    if (normalizedValue !== 0 || candidate === 0 || candidate === '0') {
      return Math.round(normalizedValue * 100);
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

const normalizeAccountType = (value: string): PartnerPayoutAccountType => {
  switch (value.toLowerCase()) {
    case 'wechat':
    case 'wx':
    case 'weixin':
      return 'wechat';
    case 'bank':
    case 'bankcard':
    case 'bank_card':
      return 'bank';
    case 'alipay':
    case 'ali':
    default:
      return 'alipay';
  }
};

const normalizeStatus = (value: string): PartnerPayoutStatus => {
  switch (value.toLowerCase()) {
    case 'paid':
    case 'success':
    case 'completed':
    case 'done':
      return 'paid';
    case 'rejected':
    case 'reject':
    case 'failed':
    case 'cancelled':
      return 'rejected';
    case 'approved':
    case 'reviewing':
    case 'processing':
    case 'pending':
    case 'waiting':
    case 'submitted':
    default:
      return 'pending';
  }
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
      payoutId: normalizedId,
    },
  };
};

const mapPartnerPayoutApplication = (rawValue: unknown): PartnerPayoutApplication | null => {
  if (!isPlainObject(rawValue)) {
    return null;
  }

  const id = pickStringField(rawValue, ID_CANDIDATES);
  if (!id) {
    return null;
  }

  const paidAt = pickFormattedDateTime(rawValue, PAID_AT_CANDIDATES);
  const partnerName = pickStringField(rawValue, PARTNER_NAME_CANDIDATES) || '未命名合伙人';
  const partnerPhone = maskPhone(pickStringField(rawValue, PARTNER_PHONE_CANDIDATES));
  const partnerCity = pickStringField(rawValue, PARTNER_CITY_CANDIDATES) || '--';
  const accountType = normalizeAccountType(pickStringField(rawValue, ACCOUNT_TYPE_CANDIDATES));
  const accountNo = pickStringField(rawValue, ACCOUNT_NO_CANDIDATES) || '--';
  const accountName = pickStringField(rawValue, ACCOUNT_NAME_CANDIDATES) || partnerName;
  const status = normalizeStatus(pickStringField(rawValue, STATUS_CANDIDATES));

  return {
    id,
    partnerName,
    partnerPhone: partnerPhone || '--',
    partnerCity,
    amount: pickFenAmountField(rawValue),
    accountType,
    accountNo,
    accountName,
    status,
    appliedAt: pickFormattedDateTime(rawValue, APPLIED_AT_CANDIDATES),
    paidAt: paidAt !== '--' ? paidAt : undefined,
    txnNo: pickStringField(rawValue, TXN_NO_CANDIDATES) || undefined,
    rejectReason: pickStringField(rawValue, REJECT_REASON_CANDIDATES) || undefined,
  };
};

const computeStats = (applications: PartnerPayoutApplication[]): PartnerPayoutStats => ({
  totalCount: applications.length,
  pendingCount: applications.filter((application) => application.status === 'pending').length,
  paidCount: applications.filter((application) => application.status === 'paid').length,
  rejectedCount: applications.filter((application) => application.status === 'rejected').length,
});

const mapStats = (response: unknown, applications: PartnerPayoutApplication[]): PartnerPayoutStats => {
  const statsSource = getNestedRecord(response, STATS_SOURCE_CANDIDATES)
    ?? (isPlainObject(response) ? response : null);
  if (!statsSource) {
    return computeStats(applications);
  }

  return {
    totalCount: pickNumberField(statsSource, ['totalCount', 'total', 'allCount']) || applications.length,
    pendingCount: pickNumberField(statsSource, ['pendingCount', 'waitingCount', 'todoCount']) || applications.filter((application) => application.status === 'pending').length,
    paidCount: pickNumberField(statsSource, ['paidCount', 'successCount', 'doneCount']) || applications.filter((application) => application.status === 'paid').length,
    rejectedCount: pickNumberField(statsSource, ['rejectedCount', 'failedCount']) || applications.filter((application) => application.status === 'rejected').length,
  };
};

const requestPartnerPayoutList = async (): Promise<{ applications: PartnerPayoutApplication[]; stats: PartnerPayoutStats }> => {
  const response = await http.get<unknown>(PARTNER_PAYOUT_API_PATH, {
    skipGlobalErrorHandler: true,
    errorMessage: '获取合伙人打款列表失败',
  });

  const rawApplications = getNestedArray(response, LIST_SOURCE_CANDIDATES);
  const applications = rawApplications
    .map((rawValue) => mapPartnerPayoutApplication(rawValue))
    .filter((item): item is PartnerPayoutApplication => item !== null);

  return {
    applications,
    stats: mapStats(response, applications),
  };
};

const submitPartnerPayoutAction = async (rawPath: string, id: string, action: 'approve' | 'reject'): Promise<void> => {
  const requestTarget = resolveActionPath(rawPath, id);
  const payload = action === 'approve'
    ? { txnNo: '' }
    : { rejectReason: '打款申请已拒绝' };
  await http.patch<unknown, Record<string, unknown>>(
    requestTarget.url,
    payload,
    {
      params: requestTarget.params,
      skipGlobalErrorHandler: true,
      errorMessage: action === 'approve' ? '确认打款失败，请稍后重试' : '拒绝打款失败，请稍后重试',
    },
  );
};

export const fetchPartnerPayoutList = createKeyedInFlightRequest(
  () => 'partner-payout-list',
  async (): Promise<{ applications: PartnerPayoutApplication[]; stats: PartnerPayoutStats }> => requestPartnerPayoutList(),
);

export const submitPartnerPayoutApprove = async (id: string): Promise<void> => {
  await submitPartnerPayoutAction(PARTNER_PAYOUT_APPROVE_API_PATH, id, 'approve');
};

export const submitPartnerPayoutReject = async (id: string): Promise<void> => {
  await submitPartnerPayoutAction(PARTNER_PAYOUT_REJECT_API_PATH, id, 'reject');
};
