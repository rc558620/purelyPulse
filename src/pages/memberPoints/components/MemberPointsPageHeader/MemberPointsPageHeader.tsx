// memberPoints 页面头部组件
import React from 'react';
import PageHeader from '@components/ui/layout/PageHeader';
import MemberPointsHeaderAction from '../MemberPointsHeaderAction/MemberPointsHeaderAction';

interface MemberPointsPageHeaderProps {
  isSubmitting: boolean;
  onBack: () => void;
  onOpenUserPicker: () => void;
}

const MemberPointsPageHeader: React.FC<MemberPointsPageHeaderProps> = React.memo(({
  isSubmitting,
  onBack,
  onOpenUserPicker,
}) => (
  <PageHeader
    title="会员积分管理"
    onBack={onBack}
    rightExtra={<MemberPointsHeaderAction disabled={isSubmitting} onClick={onOpenUserPicker} />}
  />
));

export default MemberPointsPageHeader;
