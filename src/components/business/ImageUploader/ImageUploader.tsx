// 通用图片上传组件：点击/拖拽选择 → 裁剪或用原图 → 上传 COS → 回传远程 URL
// 由商品图片（goods/marketing）与客存物品图片共用，落地后的 value 恒为 http(s) 远程地址
import React, { memo, useCallback } from 'react';
import ImageCropModal from '@components/overlay/ImageCropModal';
import { IconSpinner, IconTrash } from '@components/ui/_shared/icons';
import icCloudUpload from '@assets/image/Additional/cloud_upload.svg';
import { cx } from '@utils/utils';
import useImageUpload from './useImageUpload';
import styles from './ImageUploader.module.less';

export interface ImageUploaderProps {
  /** 当前图片 URL（COS / CDN 远程地址） */
  value?: string;
  /** 图片变更回调，参数恒为可持久化的远程 URL；移除时为 '' */
  onChange?: (url: string) => void;
  /** 裁剪框宽高比（如 1=正方形），不传则自由比例 */
  aspect?: number;
  /** 裁剪弹窗标题 */
  title?: string;
  /** 上传区提示文案 */
  tip?: string;
  /** 禁用态：不可选择、不可删除 */
  disabled?: boolean;
  /** 上传中态回调：true 时调用方应拦住提交按钮 */
  onUploadingChange?: (uploading: boolean) => void;
  /** 移除图片回调；不传时回落到 onChange?.('') */
  onRemove?: () => void;
  /** 紧凑模式：高度跟随父容器、隐藏格式提示，用于多图上传的小方槽 */
  compact?: boolean;
}

const DEFAULT_TIP = '点击或拖拽上传图片';

const ImageUploader: React.FC<ImageUploaderProps> = memo(({
  value,
  onChange,
  aspect,
  title = '裁剪图片',
  tip = DEFAULT_TIP,
  disabled = false,
  onUploadingChange,
  onRemove,
  compact = false,
}) => {
  const {
    fileInputRef,
    isDragging,
    cropVisible,
    pendingCropSrc,
    uploading,
    handleClick,
    handleFileChange,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleCropConfirm,
    handleCropCancel,
    handleUseOriginal,
  } = useImageUpload({ onChange, disabled, onUploadingChange });

  // 移除按钮在上层容器里，点击必须截断冒泡，否则会顺带唤起文件选择器
  const handleRemove = useCallback((e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    if (onRemove) {
      onRemove();
      return;
    }
    onChange?.('');
  }, [onChange, onRemove]);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-hidden="true"
      />
      <div
        className={cx(
          styles.imageUploader,
          compact && styles.imageUploaderCompact,
          isDragging && styles.imageUploaderDragging,
          disabled && styles.imageUploaderDisabled,
        )}
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {value ? (
          <img src={value} alt="图片预览" className={styles.imagePreview} />
        ) : (
          <div className={styles.imagePlaceholder}>
            <img src={icCloudUpload} alt="Upload" className={styles.uploadIcon} />
            <span>{isDragging ? '释放以上传' : tip}</span>
            {compact ? null : <span className={styles.uploadTip}>支持 JPG、PNG、GIF，最大 5MB</span>}
          </div>
        )}

        {value && !disabled && !uploading ? (
          <button
            type="button"
            className={styles.removeBtn}
            onClick={handleRemove}
            aria-label="移除图片"
          >
            <IconTrash width="14" height="14" />
          </button>
        ) : null}

        {uploading ? (
          <div className={styles.uploadingOverlay} aria-live="polite">
            <IconSpinner className={styles.uploadingSpinner} width="24" height="24" />
            <span>图片上传中...</span>
          </div>
        ) : null}
      </div>
      <ImageCropModal
        visible={cropVisible}
        imageSrc={pendingCropSrc}
        onCancel={handleCropCancel}
        onConfirm={handleCropConfirm}
        onUseOriginal={handleUseOriginal}
        {...(aspect !== undefined ? { aspect } : {})}
        title={title}
        cropShape="rect"
      />
    </>
  );
});

ImageUploader.displayName = 'ImageUploader';

export default ImageUploader;
