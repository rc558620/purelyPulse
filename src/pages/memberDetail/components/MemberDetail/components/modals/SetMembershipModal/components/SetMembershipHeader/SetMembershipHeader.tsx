// 弹窗头部：标题图标按所选档位配色，右上角按钮在确认步骤变为「返回」。
import React from 'react';
import { IconClose, IconStarBadge } from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
import type { DurationOption } from '../../SetMembershipModal.types';
import styles from '../../SetMembershipModal.module.less';

interface SetMembershipHeaderProps {
  /** 当前选中档位，决定标题图标配色 */
  selectedOption: Pick<DurationOption, 'color' | 'gradientFrom' | 'gradientTo'>;
  /** 确认步骤时右上角按钮变为「返回」 */
  isConfirmStep: boolean;
  isSubmitting: boolean;
  /** 确认步骤返回上一步，选择步骤直接关闭弹窗 */
  onClose: () => void;
}

const SetMembershipHeader: React.FC<SetMembershipHeaderProps> = ({
  selectedOption,
  isConfirmStep,
  isSubmitting,
  onClose,
}) => (
  <div className={styles.sheetHeader}>
    <div className={styles.sheetTitleWrap}>
      <div
        className={styles.sheetTitleIcon}
        style={{
          background: `linear-gradient(135deg, ${selectedOption.gradientFrom}, ${selectedOption.gradientTo})`,
          borderColor: `${selectedOption.color}40`,
          color: selectedOption.color,
        }}
        aria-hidden="true"
      >
        <IconStarBadge width={16} height={16} strokeWidth={2.2} />
      </div>
      <span className={styles.sheetTitle}>设置会员等级</span>
    </div>
    <button
      type="button"
      className={styles.closeBtn}
      onClick={onClose}
      aria-label={isConfirmStep ? '返回' : '关闭'}
      disabled={isSubmitting}
    >
      <IconClose />
    </button>
  </div>
);

export default SetMembershipHeader;
