// 首页状态区块：负责首屏加载态与错误态展示。
import { memo } from 'react';
import { EmptyState, InertiaSpinner } from '@components/ui/feedback';
import { IconHomeEmptyState } from '../HomeIcons/HomeIcons';
import styles from './HomeOverviewState.module.less';

interface HomeOverviewStateProps {
  isLoading: boolean;
  hasLoaded: boolean;
  errorMessage: string;
  retryLoad: () => void;
}

const HomeOverviewState = memo(({
  isLoading,
  hasLoaded,
  errorMessage,
  retryLoad,
}: HomeOverviewStateProps): React.JSX.Element | null => {
  if (isLoading && !hasLoaded) {
    return (
      <div className={styles.statusCard}>
        <InertiaSpinner spinning size="lg" variant="brand" />
        <span className={styles.statusTitle}>正在加载首页总览...</span>
        <span className={styles.statusDesc}>稍等一下，正在同步实时数据</span>
      </div>
    );
  }

  if (!isLoading && !hasLoaded && errorMessage) {
    return (
      <div className={styles.statusCard} role="alert">
        <EmptyState
          icon={<IconHomeEmptyState />}
          title="首页总览加载失败"
          desc={errorMessage}
          actionText="重新加载"
          onAction={retryLoad}
        />
      </div>
    );
  }

  return null;
});

HomeOverviewState.displayName = 'HomeOverviewState';

export default HomeOverviewState;
