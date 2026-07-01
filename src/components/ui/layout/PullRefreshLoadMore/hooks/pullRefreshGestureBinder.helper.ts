// 管理下拉刷新手势事件绑定，隔离 touch 与 pointer 监听细节
import { safeNum } from '@utils/utils';
import type { PullRefreshGestureController } from './pullRefreshGestureController.helper';

interface BindPullRefreshGestureEventsOptions {
  containerNode: HTMLDivElement;
  enableMouseDrag: boolean;
  gestureController: PullRefreshGestureController;
  setActiveMousePointerId: (pointerId: number) => void;
  matchesActiveMousePointer: (pointerId: number) => boolean;
  clearActiveMousePointer: () => void;
}

export const bindPullRefreshGestureEvents = ({
  containerNode,
  enableMouseDrag,
  gestureController,
  setActiveMousePointerId,
  matchesActiveMousePointer,
  clearActiveMousePointer,
}: BindPullRefreshGestureEventsOptions): (() => void) => {
  const { beginGesture, updateGesture, endGesture, resetGesture } = gestureController;
  const touchStartOptions: AddEventListenerOptions = { passive: true, capture: true };
  const touchMoveOptions: AddEventListenerOptions = { passive: false, capture: true };

  const handleTouchStart = (event: TouchEvent): void => {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    beginGesture(touch.clientY, event.target, 'touch');
  };

  const handleTouchMove = (event: TouchEvent): void => {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    updateGesture(touch.clientY, event);
  };

  const handlePointerDown = (event: PointerEvent): void => {
    if (!enableMouseDrag || event.pointerType !== 'mouse' || safeNum(event.button) !== 0) {
      return;
    }

    if (!beginGesture(event.clientY, event.target, 'mouse')) {
      return;
    }

    setActiveMousePointerId(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent): void => {
    if (!enableMouseDrag || event.pointerType !== 'mouse' || !matchesActiveMousePointer(event.pointerId)) {
      return;
    }

    updateGesture(event.clientY, event);
  };

  const handlePointerUp = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse' || !matchesActiveMousePointer(event.pointerId)) {
      return;
    }

    endGesture();
    clearActiveMousePointer();
  };

  const handlePointerCancel = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse' || !matchesActiveMousePointer(event.pointerId)) {
      return;
    }

    resetGesture();
    clearActiveMousePointer();
  };

  containerNode.addEventListener('touchstart', handleTouchStart, touchStartOptions);
  containerNode.addEventListener('touchmove', handleTouchMove, touchMoveOptions);
  containerNode.addEventListener('touchend', endGesture, true);
  containerNode.addEventListener('touchcancel', resetGesture, true);
  containerNode.addEventListener('pointerdown', handlePointerDown);
  containerNode.addEventListener('pointermove', handlePointerMove);
  containerNode.addEventListener('pointerup', handlePointerUp);
  containerNode.addEventListener('pointercancel', handlePointerCancel);

  return () => {
    containerNode.removeEventListener('touchstart', handleTouchStart, true);
    containerNode.removeEventListener('touchmove', handleTouchMove, true);
    containerNode.removeEventListener('touchend', endGesture, true);
    containerNode.removeEventListener('touchcancel', resetGesture, true);
    containerNode.removeEventListener('pointerdown', handlePointerDown);
    containerNode.removeEventListener('pointermove', handlePointerMove);
    containerNode.removeEventListener('pointerup', handlePointerUp);
    containerNode.removeEventListener('pointercancel', handlePointerCancel);
  };
};
