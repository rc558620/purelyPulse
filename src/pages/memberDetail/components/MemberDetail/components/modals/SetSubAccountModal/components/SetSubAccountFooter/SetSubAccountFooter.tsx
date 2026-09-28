// SetSubAccountFooter：弹窗底部操作栏，承载取消与保存配额。
import React from 'react';
import styles from '../../SetSubAccountModal.module.less';

interface SetSubAccountFooterProps {
  /** 提交中：按钮进入 loading 文案并禁用 */
  isSubmitting: boolean;
  /** 无资格且已选了配额时禁止保存 */
  isConfirmDisabled: boolean;
  /** 关闭弹窗 */
  onClose: () => void;
  /** 提交配额 */
  onConfirm: () => void;
}

const SetSubAccountFooter: React.FC<SetSubAccountFooterProps> = ({
  isSubmitting,
  isConfirmDisabled,
  onClose,
  onConfirm,
}) => (
  <div className={styles.sheetActions}>
    <button
      type="button"
      className={styles.cancelBtn}
      onClick={onClose}
      disabled={isSubmitting}
    >
      取消
    </button>
    <button
      type="button"
      className={styles.confirmBtn}
      onClick={onConfirm}
      disabled={isConfirmDisabled}
    >
      {isSubmitting ? '保存中...' : '保存配额'}
    </button>
  </div>
);

export default SetSubAccountFooter;
