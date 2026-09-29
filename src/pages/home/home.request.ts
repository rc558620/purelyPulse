// 首页总览请求：原始请求 + 并发去重，对外只暴露去重后的读请求。
import { createKeyedInFlightRequest, http, resolveEnvPath } from '@utils/http';
import { mapHomeOverview } from './home.mapper';
import type { HomeOverviewData, HomeOverviewQuery } from './home.types';

const HOME_OVERVIEW_API_PATH = resolveEnvPath(import.meta.env.VITE_HOME_OVERVIEW_API_PATH, '/pulse/dashboard/home');

const requestHomeOverview = async (query: HomeOverviewQuery): Promise<HomeOverviewData> => {
  const response = await http.get<unknown>(HOME_OVERVIEW_API_PATH, {
    params: {
      revenuePeriod: query.revenuePeriod,
      region: query.region || undefined,
      regionCode: query.regionCode || undefined,
      customDate: query.customDate || undefined,
      customRangeStart: query.customRangeStart || undefined,
      customRangeEnd: query.customRangeEnd || undefined,
    },
    skipGlobalErrorHandler: true,
    errorMessage: '获取首页总览失败',
  });

  return mapHomeOverview(response, query.revenuePeriod);
};

/** 获取首页总览，并按完整查询条件对并发请求做去重。 */
export const fetchHomeOverview = createKeyedInFlightRequest(
  (query: HomeOverviewQuery) => JSON.stringify(query),
  async (query: HomeOverviewQuery): Promise<HomeOverviewData> => requestHomeOverview(query),
);
