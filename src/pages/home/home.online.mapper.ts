// 首页在线板块映射：把后端不可信的在线概览字段收敛成前端语义模型。
import type { HomeOverviewData } from './home.types';
import { getNestedRecord, isPlainObject, pickNumberArray, pickNumberField } from './home.normalize';

type HomeOnlineSection = Pick<HomeOverviewData, 'onlineCount' | 'onlinePeak' | 'onlineTrend' | 'onlineGrowthRate'>;

const createEmptyOnlineSection = (): HomeOnlineSection => ({
  onlineCount: 0,
  onlinePeak: 0,
  onlineTrend: [],
  onlineGrowthRate: 0,
});

/** 在线概览来源：优先嵌套对象，缺失时按响应本身兜底。 */
export const mapOnlineSection = (response: unknown): HomeOnlineSection => {
  const onlineRoot = getNestedRecord(response, ['online', 'onlineOverview', 'live', 'liveOverview'])
    ?? (isPlainObject(response) ? response : null);

  if (!onlineRoot) {
    return createEmptyOnlineSection();
  }

  return {
    onlineCount: pickNumberField(onlineRoot, ['onlineCount', 'count', 'currentOnline', 'currentCount']),
    onlinePeak: pickNumberField(onlineRoot, ['onlinePeak', 'peak', 'peakCount', 'todayPeak']),
    onlineTrend: pickNumberArray(onlineRoot, ['onlineTrend', 'trend', 'trendData', 'series', 'values']),
    onlineGrowthRate: pickNumberField(onlineRoot, ['onlineGrowthRate', 'onlineChangeRatio', 'growthRate', 'compareRate', 'increaseRate']),
  };
};
