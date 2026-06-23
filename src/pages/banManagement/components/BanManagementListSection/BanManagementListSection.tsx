// 封禁管理列表区块：负责加载态、空态、错误态与会员列表装配。
import React from 'react';
import { EmptyState, InertiaSpinner } from '@components/ui/feedback';
import { isNonEmptyArray } from '@utils/utils';
import type { MemberListItem } from '../../../memberList/memberList.types';
import type { BanManagementConfirmTarget } from '../../banManagement.types';
import { IconBanEmptyState } from '../BanManagementIcons/BanManagementIcons';
import { BanManagementMemberCard } from '../BanManagementMemberCard/BanManagementMemberCard';
import styles from './BanManagementListSection.module.less';

interface BanManagementListSectionProps {
  members: MemberListItem[];
  expandedId: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isSubmitting: boolean;
  errorMessage: string;
  hasSearchQuery: boolean;
  showEmptyState: boolean;
  submittingMemberId: string;
  onRetry: () => void;
  onSearchClear: () => void;
  onToggleExpand: (id: string) => void;
  onOpenConfirm: (member: BanManagementConfirmTarget['member'], action: BanManagementConfirmTarget['action']) => void;
}

const BanManagementListSectionComponent: React.FC<BanManagementListSectionProps> = ({
  members,
  expandedId,
  isLoading,
  isRefreshing,
  isSubmitting,
  errorMessage,
  hasSearchQuery,
  showEmptyState,
  submittingMemberId,
  onRetry,
  onSearchClear,
  onToggleExpand,
  onOpenConfirm,
}) => {
  return (
    <div className={styles.listCard}>
      <div className={styles.listCardAccent} aria-hidden="true" />

      {isLoading ? (
        <div className={styles.loadingState} role="status">
          <InertiaSpinner spinning size="lg" variant="brand" />
          <span>封禁列表加载中...</span>
        </div>
      ) : null}

      {!isLoading && errorMessage ? (
        <div className={styles.emptyState} role="alert">
          <span>{errorMessage}</span>
          <button type="button" className={styles.emptySearchClear} onClick={onRetry}>
            重新加载
          </button>
        </div>
      ) : null}

      {showEmptyState ? (
        <div className={styles.emptyState} role="status">
          <EmptyState
            icon={<IconBanEmptyState />}
            title="暂无符合条件的用户"
            desc={hasSearchQuery ? '试试清空搜索词或切换用户状态筛选。' : '当前筛选条件下没有可管理的用户。'}
            actionText={hasSearchQuery ? '清除搜索' : '重新加载'}
            onAction={hasSearchQuery ? onSearchClear : onRetry}
          />
        </div>
      ) : null}

      {!isLoading && !errorMessage && isNonEmptyArray(members)
        ? members.map((member) => (
          <BanManagementMemberCard
            key={member.id}
            member={member}
            isExpanded={expandedId === member.id}
            isRefreshing={isRefreshing}
            isSubmitting={isSubmitting && submittingMemberId === member.id}
            onToggleExpand={onToggleExpand}
            onOpenConfirm={onOpenConfirm}
          />
        ))
        : null}
    </div>
  );
};

export const BanManagementListSection = React.memo(BanManagementListSectionComponent);

BanManagementListSection.displayName = 'BanManagementListSection';
