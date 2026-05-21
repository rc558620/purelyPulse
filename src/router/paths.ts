// 路由 path 常量：作为跨模块复用的单一数据源。
export const ROUTE_PATHS = {
    root: '/',
    login: '/login',
    home: '/home',
    partnerReview: '/partner-review',
    partnerPayout: '/partner-payout',
    revenueDetail: '/revenue-detail',
    promotionDetail: '/promotion-detail',
    // ─── 会员管理 ────────────────────────────────────────────────
    memberPoints: '/member-points',
    partnerBeans: '/partner-beans',
    // ─── 会员列表 / 详情 ──────────────────────────────────────────
    memberList:   '/member-list',
    memberDetail: '/member-list/detail',
    // ─── 用户管理 ────────────────────────────────────────────────
    banManagement: '/ban-management',
} as const;
