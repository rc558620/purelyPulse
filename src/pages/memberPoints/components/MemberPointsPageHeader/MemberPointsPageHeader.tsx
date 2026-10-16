// memberPoints 页面头部组件：标题随视图切换，右侧操作区由页面传入
import React from 'react';
import PageHeader from '@components/ui/layout/PageHeader';

interface MemberPointsPageHeaderProps {
  title: string;
  onBack: () => void;
  rightExtra?: React.ReactNode;
}

const MemberPointsPageHeader: React.FC<MemberPointsPageHeaderProps> = React.memo(({
  title,
  onBack,
  rightExtra,
}) => (
  <PageHeader title={title} onBack={onBack} rightExtra={rightExtra} />
));

export default MemberPointsPageHeader;
