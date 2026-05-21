// 会员详情备注卡片：展示会员备注信息。
import React from 'react';
import { IconMessageBubble } from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
import pageStyles from '../../../../../memberDetail.module.less';
import styles from './MemberDetailRemarkCard.module.less';

interface MemberDetailRemarkCardProps {
  remark: string;
}

const MemberDetailRemarkCard: React.FC<MemberDetailRemarkCardProps> = React.memo(({ remark }) => (
  <div className={styles.root}>
    <div className={pageStyles.remarkCard}>
      <div className={pageStyles.remarkLabel}>
        <IconMessageBubble />
        备注
      </div>
      <p className={pageStyles.remarkText}>{remark}</p>
    </div>
  </div>
));

MemberDetailRemarkCard.displayName = 'MemberDetailRemarkCard';

export default MemberDetailRemarkCard;
