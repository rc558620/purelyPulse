// 会员模块接口路径：统一从环境变量解析，缺失时回退默认路径。
import { resolveEnvPath } from '@utils/http';

/** 会员列表接口路径。 */
export const MEMBER_LIST_API_PATH = resolveEnvPath(import.meta.env.VITE_MEMBER_LIST_API_PATH, '/pulse/membership/admin/members');
/** 会员详情接口路径。 */
export const MEMBER_DETAIL_API_PATH = resolveEnvPath(import.meta.env.VITE_MEMBER_DETAIL_API_PATH, '/pulse/membership/admin/members/{id}');
/** 积分流水接口路径。 */
export const MEMBER_POINTS_API_PATH = resolveEnvPath(import.meta.env.VITE_MEMBER_POINTS_API_PATH, '/pulse/membership/admin/points/logs');
/** 纯利豆流水接口路径。 */
export const PARTNER_BEANS_API_PATH = resolveEnvPath(import.meta.env.VITE_PARTNER_BEANS_API_PATH, '/pulse/membership/admin/beans/logs');
/** 积分调整接口路径。 */
export const ADJUST_MEMBER_POINTS_API_PATH = resolveEnvPath(import.meta.env.VITE_ADJUST_MEMBER_POINTS_API_PATH, '/pulse/membership/admin/members/{id}/points/adjust');
/** 纯利豆调整接口路径。 */
export const ADJUST_PARTNER_BEANS_API_PATH = resolveEnvPath(import.meta.env.VITE_ADJUST_PARTNER_BEANS_API_PATH, '/pulse/membership/admin/members/{id}/beans/adjust');
/** 会员等级设置接口路径。 */
export const SET_MEMBERSHIP_API_PATH = resolveEnvPath(import.meta.env.VITE_SET_MEMBERSHIP_API_PATH, '/pulse/membership/admin/members/{id}/membership');
/** 首购锁定价重置接口路径。 */
export const RESET_MEMBER_LOCKED_PRICE_API_PATH = resolveEnvPath(
  import.meta.env.VITE_RESET_MEMBER_LOCKED_PRICE_API_PATH,
  '/pulse/membership/admin/members/{id}/locked-price/reset',
);
/** 会员成交价预览接口路径。 */
export const PREVIEW_MEMBERSHIP_PRICE_API_PATH = resolveEnvPath(
  import.meta.env.VITE_PREVIEW_MEMBERSHIP_PRICE_API_PATH,
  '/pulse/membership/admin/members/{id}/membership/pricing-preview',
);
/** 子账号加价补录接口路径。 */
export const BACKFILL_SUB_ACCOUNT_AMOUNT_API_PATH = resolveEnvPath(
  import.meta.env.VITE_BACKFILL_SUB_ACCOUNT_AMOUNT_API_PATH,
  '/pulse/membership/admin/members/{id}/deal-price/sub-account',
);
/** 续费价读写接口路径。 */
export const MEMBER_RENEWAL_PRICE_API_PATH = resolveEnvPath(
  import.meta.env.VITE_MEMBER_RENEWAL_PRICE_API_PATH,
  '/pulse/membership/admin/members/{id}/renewal-price',
);
/** 封禁会员接口路径。 */
export const MEMBER_BAN_API_PATH = resolveEnvPath(import.meta.env.VITE_MEMBER_BAN_API_PATH, '/pulse/membership/admin/members/{id}/ban');
/** 解封会员接口路径。 */
export const MEMBER_UNBAN_API_PATH = resolveEnvPath(import.meta.env.VITE_MEMBER_UNBAN_API_PATH, '/pulse/membership/admin/members/{id}/unban');
/** 注销会员接口路径。 */
export const MEMBER_CANCEL_API_PATH = resolveEnvPath(import.meta.env.VITE_MEMBER_CANCEL_API_PATH, '/pulse/membership/admin/members/{id}/cancel');
/** 子账号配额设置接口路径。 */
export const SET_SUB_ACCOUNT_QUOTA_API_PATH = resolveEnvPath(import.meta.env.VITE_SET_SUB_ACCOUNT_QUOTA_API_PATH, '/pulse/membership/admin/members/{id}/sub-accounts/quota');
/** purelyClub C 端会员运营统计接口路径。 */
export const MEMBER_CLUB_STATS_API_PATH = resolveEnvPath(import.meta.env.VITE_MEMBER_CLUB_STATS_API_PATH, '/pulse/membership/admin/members/{id}/club-stats');
/** 营业详情统计接口路径。 */
export const MEMBER_SALES_STATS_API_PATH = resolveEnvPath(import.meta.env.VITE_MEMBER_SALES_STATS_API_PATH, '/pulse/membership/admin/members/{id}/sales-stats');

/** 会员相关请求的最终目标：URL 与（旧协议下的）id 查询参数。 */
export interface MemberRequestTarget {
  url: string;
  params?: { id: string };
}

/** 按会员 id 展开接口路径中的 `{id}` / `:id` 占位符；无占位符时回退为末尾追加 id。 */
export const resolveMemberActionPath = (rawPath: string, memberId: string): MemberRequestTarget => {
  if (rawPath.includes(':id')) {
    return {
      url: rawPath.replace(':id', encodeURIComponent(memberId)),
    };
  }

  if (rawPath.includes('{id}')) {
    return {
      url: rawPath.replace('{id}', encodeURIComponent(memberId)),
    };
  }

  return {
    url: `${rawPath.replace(/\/+$/, '')}/${encodeURIComponent(memberId)}`,
    params: undefined,
  };
};

/** 详情接口路径解析：额外兼容以 `/detail` 结尾、id 走 query 的旧协议。 */
export const resolveMemberDetailRequestPath = (id: string): MemberRequestTarget => {
  if (MEMBER_DETAIL_API_PATH.includes(':id')) {
    return {
      url: MEMBER_DETAIL_API_PATH.replace(':id', encodeURIComponent(id)),
    };
  }

  if (MEMBER_DETAIL_API_PATH.includes('{id}')) {
    return {
      url: MEMBER_DETAIL_API_PATH.replace('{id}', encodeURIComponent(id)),
    };
  }

  if (MEMBER_DETAIL_API_PATH.endsWith('/detail')) {
    return {
      url: MEMBER_DETAIL_API_PATH,
      params: { id },
    };
  }

  return {
    url: `${MEMBER_DETAIL_API_PATH.replace(/\/+$/, '')}/${encodeURIComponent(id)}`,
  };
};
