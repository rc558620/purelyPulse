// SetSubAccountHeader：弹窗标题栏，承载标题图标与关闭入口。
import React from 'react';
import {
  IconClose,
  IconSubAccount,
} from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
import styles from '../../SetSubAccountModal.module.less';

interface SetSubAccountHeaderProps {
  /** 提交中禁止关闭：避免配额请求进行中被打断，出现「已提交但状态没刷新」的错觉 */
  isSubmitting: boolean;
  /** 关闭弹窗 */
  onClose: () => void;
}

const SetSubAccountHeader: React.FC<SetSubAccountHeaderProps> = ({ isSubmitting, onClose }) => (
  <div className={styles.sheetHeader}>
    <div className={styles.sheetTitleWrap}>
      <div className={styles.sheetTitleIcon} aria-hidden="true">
        <IconSubAccount width={16} height={16} strokeWidth={2.2} />
      </div>
      <span className={styles.sheetTitle}>子账号配额</span>
    </div>
    <button
      type="button"
      className={styles.closeBtn}
      onClick={onClose}
      aria-label="关闭"
      disabled={isSubmitting}
    >
      <IconClose />
    </button>
  </div>
);

export default SetSubAccountHeader;
