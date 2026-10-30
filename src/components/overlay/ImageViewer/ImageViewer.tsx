// 全局图片查看器浮层：支持左右拖拽跟手切换（惯性 / 回弹）、移动端手势、键盘操作与遮罩关闭
import React, { memo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cx, isNonEmptyArray, safeNum } from '@utils/utils';
import { IconChevronLeft, IconChevronRight, IconClose } from '../_shared/icons';
import ImageViewerDots from './components/ImageViewerDots/ImageViewerDots';
import ImageViewerSlide from './components/ImageViewerSlide/ImageViewerSlide';
import { useImageViewerIndex } from './hooks/useImageViewerIndex';
import { useImageViewerLayerEffects } from './hooks/useImageViewerLayerEffects';
import { useImageViewerSlide } from './hooks/useImageViewerSlide';
import { useImageViewerSwipe } from './hooks/useImageViewerSwipe';
import type { ImageViewerProps } from './ImageViewer.types';
import styles from './ImageViewer.module.less';

const ImageViewer: React.FC<ImageViewerProps> = memo(({
  images,
  initialIndex = 0,
  visible,
  onClose,
}) => {
  const total = images.length;
  const { index, canPrev, canNext, goTo } = useImageViewerIndex({
    total,
    initialIndex,
    visible,
  });
  const {
    slide,
    slideStyles,
    settleOutcome,
    canBeginDrag,
    navigatePrev,
    navigateNext,
    beginDrag,
    updateDrag,
    cancelDrag,
    currentHostRef,
    incomingHostRef,
  } = useImageViewerSlide({
    index,
    total,
    visible,
    onCommitIndex: goTo,
  });
  const swipeHandlers = useImageViewerSwipe({
    canBeginDrag,
    onDragStart: beginDrag,
    onDragMove: updateDrag,
    onSwipeLeft: navigateNext,
    onSwipeRight: navigatePrev,
    onDragCancel: cancelDrag,
  });

  useImageViewerLayerEffects({
    visible,
    onClose,
    onPrev: navigatePrev,
    onNext: navigateNext,
    keyboardNavigationEnabled: total > 1,
  });

  // 邻图预加载：入场图若等切换动画开始时才请求网络，动画中会空白、加载完成后突然弹出（闪烁）。
  // 已请求过的地址记入 Set，避免父组件重渲染导致重复预加载。
  const preloadedSrcSetRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!visible) return;
    [index - 1, index, index + 1].forEach((neighborIndex) => {
      const src = images[neighborIndex];
      if (!src || preloadedSrcSetRef.current.has(src)) return;
      preloadedSrcSetRef.current.add(src);
      const preloader = new Image();
      preloader.src = src;
    });
  }, [images, index, visible]);

  if (!visible || !isNonEmptyArray(images)) return null;

  const currentImage = images[index] ?? '';
  const incomingImage = slide ? images[slide.targetIndex] ?? '' : '';
  // 滑动态同时渲染出场图与入场图（两张图各自动 transform，跟手位移由指令式写入），
  // 过渡结束由入场图的 transitionend 落地索引；key 用图片索引，
  // 落地时入场图复用同一 DOM 节点，画面不跳变。
  // 跟手态不挂过渡（手指到哪图到哪）；收尾态按松手结果挂减速 / 回弹过渡，
  // 与按钮切换共用同一条减速曲线与速度，两种入口观感一致。
  const slideClassName = settleOutcome === 'commit'
    ? styles.slideSettleCommit
    : settleOutcome === 'cancel'
      ? styles.slideSettleCancel
      : undefined;

  return createPortal(
    <div
      className={styles.mask}
      role="dialog"
      aria-modal="true"
      aria-label="图片查看"
      onClick={onClose}
    >
      <button
        type="button"
        className={cx(styles.iconBtn, styles.closeBtn)}
        onClick={onClose}
        aria-label="关闭"
      >
        <IconClose />
      </button>

      {total > 1 && (
        <button
          type="button"
          className={cx(styles.iconBtn, styles.prevBtn)}
          // 越界时不卸载按钮（避免翻到首张时按钮突然消失、布局跳动），仅置灰禁用
          disabled={!canPrev}
          onClick={(event) => {
            event.stopPropagation();
            navigatePrev();
          }}
          aria-label="上一张"
        >
          <IconChevronLeft />
        </button>
      )}

      {/* 图片舞台：铺满遮罩负责手势 */}
      <figure
        className={cx(styles.stage, slide ? styles.stageGrabbing : undefined)}
        {...swipeHandlers}
      >
        {slide ? (
          <>
            <ImageViewerSlide
              key={`image-viewer-slide-${index}`}
              hostRef={currentHostRef}
              src={currentImage}
              alt={`第 ${safeNum(index) + 1} 张`}
              className={slideClassName}
              style={slideStyles?.current}
            />
            <ImageViewerSlide
              key={`image-viewer-slide-${slide.targetIndex}`}
              hostRef={incomingHostRef}
              src={incomingImage}
              alt={`第 ${safeNum(slide.targetIndex) + 1} 张`}
              className={slideClassName}
              style={slideStyles?.incoming}
            />
          </>
        ) : (
          <ImageViewerSlide
            key={`image-viewer-slide-${index}`}
            hostRef={currentHostRef}
            src={currentImage}
            alt={`第 ${safeNum(index) + 1} 张`}
          />
        )}
      </figure>

      {total > 1 && (
        <button
          type="button"
          className={cx(styles.iconBtn, styles.nextBtn)}
          disabled={!canNext}
          onClick={(event) => {
            event.stopPropagation();
            navigateNext();
          }}
          aria-label="下一张"
        >
          <IconChevronRight />
        </button>
      )}

      <div className={styles.footer} onClick={(event) => event.stopPropagation()}>
        {images.length > 1 && (
          <ImageViewerDots total={images.length} activeIndex={index} />
        )}
        <span className={styles.counter}>{`${index + 1} / ${images.length}`}</span>
      </div>
    </div>,
    document.body,
  );
});

ImageViewer.displayName = 'ImageViewer';
export default ImageViewer;
