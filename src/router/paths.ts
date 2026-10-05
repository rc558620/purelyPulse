// 路由 path 常量：作为跨模块复用的单一数据源。
export const ROUTE_PATHS = {
    root: '/',
    login: '/login',
    home: '/home',
    partnerReview: '/partner-review',
    partnerPayout: '/partner-payout',
    revenueDetail: '/revenue-detail',
    promotionDetail: '/promotion-detail',
    // ─── 个人中心 ────────────────────────────────────────────────
    profile: '/profile',
    changePassword: '/change-password',
    changeNickname: '/change-nickname',
    // ─── 会员管理 ────────────────────────────────────────────────
    memberPoints: '/member-points',
    partnerBeans: '/partner-beans',
    // 新客额度管理：平台运营查看 / 设置各门店的新客额度
    newCustomerQuota: '/new-customer-quota',
    // ─── 会员列表 / 详情 ──────────────────────────────────────────
    memberList:   '/member-list',
    memberDetail: '/member-list/detail',
    // 会员记录管理：跨会员聚合四类记录（充值 / 等级设置 / 调整续费 / 子账号）
    memberRecords: '/member-records',
    // ─── 用户管理 ────────────────────────────────────────────────
    banManagement: '/ban-management',
    // ─── 会员设置 ────────────────────────────────────────────────
    membershipSettings: '/membership-settings',
} as const;
