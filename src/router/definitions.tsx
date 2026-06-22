/**
 * 路由声明层。
 *
 * 这个文件只回答一个问题：
 * “系统里有哪些路由，它们分别对应哪个页面，需要套什么守卫？”
 */
import { Navigate } from 'react-router-dom';
import ProtectedRoute from '@components/business/ProtectedRoute';
import { getPersistedAccessToken } from '@pages/login/shared/authSession';
import { ROUTE_PATHS } from './paths';
import { pages } from './pages';
import type { AppRouteDefinition, RouteWrapper } from './types';

const withAuthGuard: RouteWrapper = (page) => (
    <ProtectedRoute
        check={() => Boolean(getPersistedAccessToken())}
        fallback={ROUTE_PATHS.login}
        preloadFallback={pages.login.preload}
        message="请先登录后再访问"
    >
        {page}
    </ProtectedRoute>
);

export const routeDefinitions: AppRouteDefinition[] = [
    { path: ROUTE_PATHS.root, element: <Navigate to={ROUTE_PATHS.login} replace /> },
    { path: ROUTE_PATHS.login, page: pages.login },
    { path: ROUTE_PATHS.home, page: pages.home, wrap: withAuthGuard },
    { path: ROUTE_PATHS.profile, page: pages.profile, wrap: withAuthGuard },
    { path: ROUTE_PATHS.changePassword, page: pages.changePassword, wrap: withAuthGuard },
    { path: ROUTE_PATHS.changeNickname, page: pages.changeNickname, wrap: withAuthGuard },
    { path: ROUTE_PATHS.partnerReview, page: pages.partnerReview, wrap: withAuthGuard },
    { path: ROUTE_PATHS.partnerPayout, page: pages.partnerPayout, wrap: withAuthGuard },
    { path: ROUTE_PATHS.revenueDetail, page: pages.revenueDetail, wrap: withAuthGuard },
    { path: ROUTE_PATHS.promotionDetail, page: pages.promotionDetail, wrap: withAuthGuard },
    { path: ROUTE_PATHS.memberPoints, page: pages.memberPoints, wrap: withAuthGuard },
    { path: ROUTE_PATHS.partnerBeans, page: pages.partnerBeans, wrap: withAuthGuard },
    { path: ROUTE_PATHS.memberList, page: pages.memberList, wrap: withAuthGuard },
    { path: `${ROUTE_PATHS.memberDetail}/:id`, page: pages.memberDetail, wrap: withAuthGuard },
    { path: ROUTE_PATHS.banManagement, page: pages.banManagement, wrap: withAuthGuard },
    { path: ROUTE_PATHS.membershipSettings, page: pages.membershipSettings, wrap: withAuthGuard },
];
