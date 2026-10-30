// 图片查看器：左右拖拽跟手切换手势（触屏 + 鼠标）
//
// 手势生命周期：
//   按下 → 首个有效位移判定意图（横向跟手 / 纵向放弃）
//        → 拖拽中实时回传横向位移（调用方写入 transform，实现「拖到中间」的跟手效果）
//        → 松手按「位移距离 + 横向速度」判定：达到阈值惯性切图，否则回弹归位。
// 本文件只做手势识别，不感知索引越界：越界由调用方 onDragStart 返回 false 表达，
// 此时放弃跟手（不做位移），与旧版「直接忽略」保持一致。
import { useCallback, useRef } from 'react';
import type { ImageViewerSlideDirection } from './useImageViewerSlide';

/** 触发切换的最小位移（px）：与「舞台宽度 × 比例」取大者，慢速小位移不切图 */
const SWIPE_THRESHOLD_PX = 50;
/** 拖拽超过舞台宽度的该比例即切图（拖得够远） */
const SWIPE_DISTANCE_RATIO = 0.2;
/** 触发切换的最小横向速度（px/ms）：快速轻扫也切图 */
const FLICK_VELOCITY = 0.5;
/** 手势方向判定阈值（px）：不超过则视为抖动，不锁方向 */
const AXIS_LOCK_PX = 8;

export interface UseImageViewerSwipeOptions {
  /** 当前是否可以开始新的拖拽（浮层静止、多于一张图、未开启减动态） */
  canBeginDrag: boolean;
  /** 首次锁定横向拖拽：调用方挂载邻图；返回 false 表示该方向越界，放弃跟手 */
  onDragStart: (direction: ImageViewerSlideDirection) => boolean;
  /** 拖拽中：回传横向位移（px，负值向左） */
  onDragMove: (dx: number) => void;
  /** 松手切图：向左 = 下一张 */
  onSwipeLeft: () => void;
  /** 松手切图：向右 = 上一张 */
  onSwipeRight: () => void;
  /** 松手回弹：未达阈值，取消拖拽归位 */
  onDragCancel: () => void;
}

export interface ImageViewerSwipeHandlers {
  onTouchStart: (event: React.TouchEvent) => void;
  onTouchMove: (event: React.TouchEvent) => void;
  onTouchEnd: (event: React.TouchEvent) => void;
  onTouchCancel: (event: React.TouchEvent) => void;
  onMouseDown: (event: React.MouseEvent) => void;
  /** 捕获阶段拦截拖拽后浏览器补发的 click，避免拖拽误关闭浮层 */
  onClickCapture: (event: React.MouseEvent) => void;
}

/** 单次手势的状态机 */
interface GestureState {
  startX: number;
  startY: number;
  /** 最近一次横向位移采样：用于松手时估算横向速度 */
  lastX: number;
  lastTime: number;
  axis: 'undecided' | 'horizontal' | 'vertical';
  direction: ImageViewerSlideDirection | null;
  /** 是否已进入跟手态（onDragMove 持续回传） */
  dragging: boolean;
  stageWidth: number;
}

export const useImageViewerSwipe = ({
  canBeginDrag,
  onDragStart,
  onDragMove,
  onSwipeLeft,
  onSwipeRight,
  onDragCancel,
}: UseImageViewerSwipeOptions): ImageViewerSwipeHandlers => {
  const gestureRef = useRef<GestureState | null>(null);
  // 拖拽结束后浏览器仍可能补发 click（鼠标拖拽、部分内核的触摸模拟），
  // 这里标记一次，由 onClickCapture 吞掉，防止拖拽误关闭浮层。
  const suppressClickRef = useRef(false);

  const beginGesture = useCallback((x: number, y: number, stageWidth: number): void => {
    gestureRef.current = {
      startX: x,
      startY: y,
      lastX: x,
      lastTime: performance.now(),
      axis: 'undecided',
      direction: null,
      dragging: false,
      stageWidth,
    };
  }, []);

  const handleMove = useCallback(
    (x: number, y: number): void => {
      const gesture = gestureRef.current;
      if (!gesture) return;

      const dx = x - gesture.startX;
      const dy = y - gesture.startY;

      if (gesture.axis === 'undecided') {
        if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return;
        if (Math.abs(dx) < Math.abs(dy)) {
          // 纵向意图：放弃手势，交还页面（浮层已禁滚，但不阻碍后续交互）
          gestureRef.current = null;
          return;
        }
        gesture.axis = 'horizontal';
        gesture.direction = dx < 0 ? 'next' : 'prev';
        // 判定为拖拽后，拖拽结束补发的 click 必须吞掉
        suppressClickRef.current = true;
        if (canBeginDrag && onDragStart(gesture.direction)) {
          gesture.dragging = true;
        }
      }

      if (gesture.axis !== 'horizontal') return;

      gesture.lastX = x;
      gesture.lastTime = performance.now();
      if (gesture.dragging) {
        onDragMove(x - gesture.startX);
      }
    },
    [canBeginDrag, onDragMove, onDragStart],
  );

  const endGesture = useCallback(
    (x: number, y: number): void => {
      const gesture = gestureRef.current;
      gestureRef.current = null;
      if (!gesture) return;

      const dx = x - gesture.startX;
      const dy = y - gesture.startY;

      // 纵向 / 未锁方向：不切图（点按与滚动意图）
      if (gesture.axis === 'vertical') return;
      if (gesture.axis === 'undecided') {
        // 无位移过程的快速轻扫：按总位移判定，保持旧版的轻扫切图能力
        if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) <= Math.abs(dy)) return;
        gesture.axis = 'horizontal';
        gesture.direction = dx < 0 ? 'next' : 'prev';
        suppressClickRef.current = true;
      }

      const elapsed = performance.now() - gesture.lastTime;
      const velocity = elapsed > 0 ? (x - gesture.lastX) / elapsed : 0;
      const distance = Math.abs(dx);
      const threshold = Math.max(SWIPE_THRESHOLD_PX, gesture.stageWidth * SWIPE_DISTANCE_RATIO);

      // 拖得够远，或松手时仍有横向速度（轻扫），即切图；否则回弹归位
      const shouldNavigate = distance >= threshold || Math.abs(velocity) >= FLICK_VELOCITY;

      if (!shouldNavigate) {
        if (gesture.dragging) onDragCancel();
        return;
      }
      if (dx < 0) {
        onSwipeLeft();
        return;
      }
      onSwipeRight();
    },
    [onDragCancel, onSwipeLeft, onSwipeRight],
  );

  const cancelGesture = useCallback((): void => {
    const gesture = gestureRef.current;
    gestureRef.current = null;
    if (gesture?.dragging) onDragCancel();
  }, [onDragCancel]);

  const onTouchStart = useCallback(
    (event: React.TouchEvent): void => {
      if (event.touches.length > 1) {
        gestureRef.current = null;
        return;
      }
      const touch = event.touches[0];
      if (!touch) return;
      beginGesture(touch.clientX, touch.clientY, event.currentTarget.getBoundingClientRect().width);
    },
    [beginGesture],
  );

  const onTouchMove = useCallback(
    (event: React.TouchEvent): void => {
      if (event.touches.length > 1) {
        cancelGesture();
        return;
      }
      const touch = event.touches[0];
      if (!touch) return;
      handleMove(touch.clientX, touch.clientY);
    },
    [cancelGesture, handleMove],
  );

  const onTouchEnd = useCallback(
    (event: React.TouchEvent): void => {
      const touch = event.changedTouches[0];
      if (!touch) return;
      endGesture(touch.clientX, touch.clientY);
    },
    [endGesture],
  );

  const onTouchCancel = useCallback((): void => cancelGesture(), [cancelGesture]);

  const onMouseDown = useCallback(
    (event: React.MouseEvent): void => {
      if (event.button !== 0) return;
      // 阻止默认行为：避免拖拽时选中文字 / 触发原生图片拖拽
      event.preventDefault();
      beginGesture(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect().width);

      // 鼠标拖拽可能移出舞台，移动 / 抬起监听挂在 window 上
      const handleWindowMouseMove = (moveEvent: MouseEvent): void => {
        handleMove(moveEvent.clientX, moveEvent.clientY);
      };
      const handleWindowMouseUp = (upEvent: MouseEvent): void => {
        window.removeEventListener('mousemove', handleWindowMouseMove);
        window.removeEventListener('mouseup', handleWindowMouseUp);
        endGesture(upEvent.clientX, upEvent.clientY);
      };

      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
    },
    [beginGesture, endGesture, handleMove],
  );

  const onClickCapture = useCallback((event: React.MouseEvent): void => {
    if (!suppressClickRef.current) return;
    suppressClickRef.current = false;
    event.stopPropagation();
  }, []);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel,
    onMouseDown,
    onClickCapture,
  };
};
