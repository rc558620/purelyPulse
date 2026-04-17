// 裁剪弹窗底部按钮区：取消 / 使用原图（可选）/ 确定裁剪
import React from 'react';
import styles from './ImageCropModal.module.less';

interface CropModalFooterProps {
  /** 点击取消回调 */
  onCancel: () => void;
  /** 点击确定裁剪回调 */
  onConfirm: () => void;
  /**
   * 点击「使用原图」回调，传入则显示该按钮，不传则隐藏。
   */
  onUseOriginal?: () => void;
}

const CropModalFooter: React.FC<CropModalFooterProps> = ({
  onCancel,
  onConfirm,
  onUseOriginal,
}) => (
  <div className={styles.modalFooter}>
    {/* 取消按钮 */}
    <button type="button" className={styles.cancelBtn} onClick={onCancel}>
      取消
    </button>
    {/* 使用原图（可选） */}
    {onUseOriginal && (
      <button type="button" className={styles.originalBtn} onClick={onUseOriginal}>
        使用原图
      </button>
    )}
    {/* 确定裁剪 */}
    <button type="button" className={styles.confirmBtn} onClick={onConfirm}>
      确定裁剪
    </button>
  </div>
);

export default React.memo(CropModalFooter);
