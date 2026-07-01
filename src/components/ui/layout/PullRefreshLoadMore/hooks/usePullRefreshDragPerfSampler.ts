// 管理下拉刷新拖拽性能采样器的启动与清理
import { safeNum } from '@utils/utils';
import type { DragPerfSession } from './usePullRefreshDragPerfSession';

interface StartDragPerfSamplerOptions {
  session: DragPerfSession;
  trackLongTask: boolean;
  getActiveSession: () => DragPerfSession | null;
}

export const stopDragPerfSampler = (session: DragPerfSession): void => {
  if (session.frameLoopId !== null) {
    window.cancelAnimationFrame(session.frameLoopId);
    session.frameLoopId = null;
  }

  session.longTaskObserver?.disconnect();
  session.longTaskObserver = null;
};

export const startDragPerfSampler = ({
  session,
  trackLongTask,
  getActiveSession,
}: StartDragPerfSamplerOptions): void => {
  const sampleFrame = (timestamp: number): void => {
    const activeSession = getActiveSession();
    if (activeSession !== session) {
      return;
    }

    if (session.lastFrameTime !== null) {
      const frameDelta = Math.max(safeNum(timestamp) - safeNum(session.lastFrameTime), 0);
      session.frameCount += 1;
      session.totalFrameDelta += frameDelta;
      session.minFrameDelta = Math.min(session.minFrameDelta, frameDelta);
      session.maxFrameDelta = Math.max(session.maxFrameDelta, frameDelta);
    }

    session.lastFrameTime = safeNum(timestamp);
    session.frameLoopId = window.requestAnimationFrame(sampleFrame);
  };

  session.frameLoopId = window.requestAnimationFrame(sampleFrame);

  if (!trackLongTask) {
    return;
  }

  session.longTaskObserver = new window.PerformanceObserver((entryList) => {
    entryList.getEntries().forEach((entry) => {
      session.longTaskCount += 1;
      session.totalLongTaskDuration += safeNum(entry.duration);
      session.maxLongTaskDuration = Math.max(session.maxLongTaskDuration, safeNum(entry.duration));
    });
  });

  session.longTaskObserver.observe({ entryTypes: ['longtask'] });
};
