// 统一承载下拉刷新、加载更多与回到顶部交互的移动端滚动容器
import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { cx } from '@utils/utils';
import {
  DEFAULT_PULL_REFRESH_TEXTS,
  getLoadMoreFooterIcon,
  getLoadMoreFooterLabel,
  getRefreshIndicatorIcon,
  getRefreshIndicatorLabel,
  isLoadMoreFooterSpinning,
  isRefreshIndicatorSpinning,
} from './PullRefreshLoadMore.constants';
import type { PullRefreshLoadMoreProps, PullRefreshTextConfig } from './PullRefreshLoadMore.types';
import { usePullRefreshLoadMore } from './usePullRefreshLoadMore';
import BackToTopButton from './components/BackToTopButton/BackToTopButton';
import LoadMoreFooter from './components/LoadMoreFooter/LoadMoreFooter';
import PullRefreshViewport from './components/PullRefreshViewport/PullRefreshViewport';
import RefreshIndicator from './components/RefreshIndicator/RefreshIndicator';
import RefreshRetryButton from './components/RefreshRetryButton/RefreshRetryButton';
import styles from './PullRefreshLoadMore.module.less';

const PullRefreshLoadMore: React.FC<PullRefreshLoadMoreProps> = memo(({
  children,
  className,
  contentClassName,
  onRefresh,
  onLoadMore,
  hasMore = true,
  disabled = false,
  refreshThreshold,
  maxPullDistance,
  refreshHoldDistance,
  loadMoreThreshold,
  enableMouseDrag = true,
  showBackToTop = true,
  backToTopThreshold,
  successDuration,
  errorDuration,
  pullingText,
  releaseToRefreshText,
  refreshingText,
  refreshSuccessText,
  refreshErrorText,
  idleRefreshText,
  loadingMoreText,
  loadMoreIdleText,
  loadMoreErrorText,
  allLoadedText,
  backToTopText,
  scrollToTopTrigger,
  debugLabel,
}) => {
  const texts = useMemo<PullRefreshTextConfig>(() => ({
    idleRefreshText: idleRefreshText ?? DEFAULT_PULL_REFRESH_TEXTS.idleRefreshText,
    pullingText: pullingText ?? DEFAULT_PULL_REFRESH_TEXTS.pullingText,
    releaseToRefreshText: releaseToRefreshText ?? DEFAULT_PULL_REFRESH_TEXTS.releaseToRefreshText,
    refreshingText: refreshingText ?? DEFAULT_PULL_REFRESH_TEXTS.refreshingText,
    refreshSuccessText: refreshSuccessText ?? DEFAULT_PULL_REFRESH_TEXTS.refreshSuccessText,
    refreshErrorText: refreshErrorText ?? DEFAULT_PULL_REFRESH_TEXTS.refreshErrorText,
    loadingMoreText: loadingMoreText ?? DEFAULT_PULL_REFRESH_TEXTS.loadingMoreText,
    loadMoreIdleText: loadMoreIdleText ?? DEFAULT_PULL_REFRESH_TEXTS.loadMoreIdleText,
    loadMoreErrorText: loadMoreErrorText ?? DEFAULT_PULL_REFRESH_TEXTS.loadMoreErrorText,
    allLoadedText: allLoadedText ?? DEFAULT_PULL_REFRESH_TEXTS.allLoadedText,
    backToTopText: backToTopText ?? DEFAULT_PULL_REFRESH_TEXTS.backToTopText,
  }), [
    allLoadedText,
    backToTopText,
    idleRefreshText,
    loadMoreErrorText,
    loadMoreIdleText,
    loadingMoreText,
    pullingText,
    refreshErrorText,
    refreshSuccessText,
    refreshingText,
    releaseToRefreshText,
  ]);

  const {
    containerRef,
    contentRef,
    footerRef,
    dragging,
    refreshStatus,
    loadMoreStatus,
    refreshIndicatorVisible,
    refreshIndicatorPinned,
    backToTopVisible,
    requestRefresh,
    requestLoadMore,
    scrollToTop,
  } = usePullRefreshLoadMore({
    onRefresh,
    onLoadMore,
    hasMore,
    disabled,
    refreshThreshold,
    maxPullDistance,
    refreshHoldDistance,
    loadMoreThreshold,
    enableMouseDrag,
    successDuration,
    errorDuration,
    backToTopThreshold,
    debugLabel,
  });

  const didMountRef = useRef(false);

  const refreshable = Boolean(onRefresh) && !disabled;
  const loadable = Boolean(onLoadMore) && !disabled;
  const refreshLabel = getRefreshIndicatorLabel(refreshStatus, texts);
  const refreshIcon = getRefreshIndicatorIcon(refreshStatus);
  const loadMoreLabel = getLoadMoreFooterLabel(loadMoreStatus, hasMore, texts);
  const loadMoreIcon = getLoadMoreFooterIcon(loadMoreStatus, hasMore);

  const handleLoadMore = useCallback((): void => {
    void requestLoadMore();
  }, [requestLoadMore]);

  const handleRetryRefresh = useCallback((): void => {
    void requestRefresh();
  }, [requestRefresh]);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    scrollToTop('auto');
  }, [scrollToTop, scrollToTopTrigger]);

  return (
    <div className={cx(styles.shell, className, disabled && styles.disabled)}>
      <RefreshIndicator
        visible={refreshable && refreshIndicatorVisible}
        pinned={refreshIndicatorPinned}
        status={refreshStatus}
        label={refreshLabel}
        icon={refreshIcon}
        spinning={isRefreshIndicatorSpinning(refreshStatus)}
      />

      <PullRefreshViewport
        containerRef={containerRef}
        contentRef={contentRef}
        contentClassName={contentClassName}
        dragging={dragging}
        footerContent={loadable ? (
          <LoadMoreFooter
            footerRef={footerRef}
            status={loadMoreStatus}
            hasMore={hasMore}
            label={loadMoreLabel}
            icon={loadMoreIcon}
            spinning={isLoadMoreFooterSpinning(loadMoreStatus)}
            onLoadMore={handleLoadMore}
          />
        ) : undefined}
      >
        {children}
      </PullRefreshViewport>

      <RefreshRetryButton
        visible={refreshable && refreshStatus === 'error'}
        onRetry={handleRetryRefresh}
      />

      <BackToTopButton
        visible={showBackToTop && backToTopVisible}
        label={texts.backToTopText}
        onClick={() => scrollToTop('smooth')}
      />
    </div>
  );
});

PullRefreshLoadMore.displayName = 'PullRefreshLoadMore';

export default PullRefreshLoadMore;
