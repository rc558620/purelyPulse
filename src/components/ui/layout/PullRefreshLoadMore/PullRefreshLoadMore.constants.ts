// 下拉刷新加载更多组件的默认文案与状态映射
import type { LoadMoreStatus, PullRefreshTextConfig, RefreshStatus } from './PullRefreshLoadMore.types';

export const DEFAULT_PULL_REFRESH_TEXTS: PullRefreshTextConfig = {
  idleRefreshText: '下拉刷新',
  pullingText: '继续下拉即可刷新',
  releaseToRefreshText: '松手立即刷新',
  refreshingText: '正在刷新内容...',
  refreshSuccessText: '刷新完成',
  refreshErrorText: '刷新失败，请稍后重试',
  loadingMoreText: '正在加载更多...',
  loadMoreIdleText: '点击或继续下滑加载更多',
  loadMoreErrorText: '加载失败，点击重试',
  allLoadedText: '已经到底了',
  backToTopText: '回到顶部',
};

const REFRESH_ICON_MAP: Record<RefreshStatus, string> = {
  idle: '↓',
  pulling: '↓',
  armed: '⇣',
  refreshing: '↻',
  success: '✓',
  error: '!',
};

export const getRefreshIndicatorLabel = (
  status: RefreshStatus,
  texts: PullRefreshTextConfig,
): string => {
  switch (status) {
    case 'pulling':
      return texts.pullingText;
    case 'armed':
      return texts.releaseToRefreshText;
    case 'refreshing':
      return texts.refreshingText;
    case 'success':
      return texts.refreshSuccessText;
    case 'error':
      return texts.refreshErrorText;
    default:
      return texts.idleRefreshText;
  }
};

export const getRefreshIndicatorIcon = (status: RefreshStatus): string => REFRESH_ICON_MAP[status];

export const isRefreshIndicatorSpinning = (status: RefreshStatus): boolean => status === 'refreshing';

export const getLoadMoreFooterLabel = (
  status: LoadMoreStatus,
  hasMore: boolean,
  texts: PullRefreshTextConfig,
): string => {
  if (!hasMore) {
    return texts.allLoadedText;
  }

  switch (status) {
    case 'loading':
      return texts.loadingMoreText;
    case 'error':
      return texts.loadMoreErrorText;
    default:
      return texts.loadMoreIdleText;
  }
};

export const getLoadMoreFooterIcon = (status: LoadMoreStatus, hasMore: boolean): string => {
  if (!hasMore) {
    return '✓';
  }

  if (status === 'loading') {
    return '↻';
  }

  if (status === 'error') {
    return '!';
  }

  return '↓';
};

export const isLoadMoreFooterSpinning = (status: LoadMoreStatus): boolean => status === 'loading';
