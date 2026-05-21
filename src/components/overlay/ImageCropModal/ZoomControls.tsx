// 裁剪弹窗缩放控制区：zoom 滑块 + 居中按钮
import React from 'react';
import { IconZoom, IconCenter } from '../_shared/icons';
import styles from './ImageCropModal.module.less';

interface ZoomControlsProps {
  /** 当前缩放值（0.1 ~ 3） */
  zoom: number;
  /** 缩放值变更回调 */
  onZoomChange: (zoom: number) => void;
  /** 点击居中按钮回调 */
  onCenter: () => void;
  /** 重置缩放到初始值的回调 */
  onResetZoom: () => void;
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.01;

/** 将 zoom 值映射为 CSS 自定义属性百分比（用于 slider 填充色） */
const toSliderPercent = (zoom: number): string => {
  const pct = ((zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100;
  return `${pct.toFixed(2)}%`;
};

const ZoomControls: React.FC<ZoomControlsProps> = ({ zoom, onZoomChange, onCenter, onResetZoom }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onZoomChange(Number(e.target.value));
  };

  return (
    <div className={styles.controls}>
      {/* zoom 滑块 */}
      <label className={styles.zoomLabel}>
        <IconZoom />
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={ZOOM_STEP}
          value={zoom}
          onChange={handleChange}
          className={styles.zoomSlider}
          style={{ '--slider-percent': toSliderPercent(zoom) } as React.CSSProperties}
          aria-label="调整缩放比例"
        />
      </label>
      {/* 居中按钮：重置 crop 坐标到原点，同时重置缩放 */}
      <button
        type="button"
        className={styles.centerBtn}
        onClick={() => { onCenter(); onResetZoom(); }}
        title="重置位置"
        aria-label="重置图片位置"
      >
        <IconCenter />
      </button>
    </div>
  );
};

export default React.memo(ZoomControls);
