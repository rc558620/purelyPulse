/// <reference types="vite/client" />

declare module 'china-area-data';

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_TIMEOUT?: string;
  readonly VITE_LOGIN_API_PATH?: string;
  readonly VITE_AUTH_PROFILE_API_PATH?: string;
  readonly VITE_HOME_OVERVIEW_API_PATH?: string;
  readonly VITE_PARTNER_REVIEW_API_PATH?: string;
  readonly VITE_PARTNER_REVIEW_APPROVE_API_PATH?: string;
  readonly VITE_PARTNER_REVIEW_REJECT_API_PATH?: string;
  readonly VITE_PARTNER_PAYOUT_API_PATH?: string;
  readonly VITE_PARTNER_PAYOUT_APPROVE_API_PATH?: string;
  readonly VITE_PARTNER_PAYOUT_REJECT_API_PATH?: string;
  readonly VITE_REVENUE_DETAIL_API_PATH?: string;
  readonly VITE_PROMOTION_DETAIL_API_PATH?: string;
  readonly VITE_MEMBER_POINTS_API_PATH?: string;
  readonly VITE_PARTNER_BEANS_API_PATH?: string;
  readonly VITE_MEMBER_LIST_API_PATH?: string;
  readonly VITE_MEMBER_DETAIL_API_PATH?: string;
  readonly VITE_SET_MEMBERSHIP_API_PATH?: string;
  readonly VITE_MEMBER_BAN_API_PATH?: string;
  readonly VITE_MEMBER_UNBAN_API_PATH?: string;
  readonly VITE_ADJUST_MEMBER_POINTS_API_PATH?: string;
  readonly VITE_ADJUST_PARTNER_BEANS_API_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
