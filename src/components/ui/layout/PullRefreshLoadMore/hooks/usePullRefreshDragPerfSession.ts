// 管理下拉刷新拖拽性能会话模型与摘要计算
import { safeNum } from '@utils/utils';
import type { PullRefreshDebugPayload } from './usePullRefreshDebugReporter';

export type PullRefreshGestureInputSource = 'touch' | 'mouse';

export interface DragPerfSession {
  source: PullRefreshGestureInputSource;
  startTime: number;
  frameCount: number;
  totalFrameDelta: number;
  lastFrameTime: number | null;
  minFrameDelta: number;
  maxFrameDelta: number;
  longTaskCount: number;
  totalLongTaskDuration: number;
  maxLongTaskDuration: number;
  frameLoopId: number | null;
  longTaskObserver: PerformanceObserver | null;
}

export interface DragPerfSummary extends PullRefreshDebugPayload {
  source: PullRefreshGestureInputSource;
  reason: string;
  durationMs: number;
  sampledFrames: number;
  estimatedFps: number;
  avgFrameDeltaMs: number;
  minFrameDeltaMs: number;
  maxFrameDeltaMs: number;
  longTaskCount: number;
  totalLongTaskMs: number;
  maxLongTaskMs: number;
}

interface BuildDragPerfSummaryOptions {
  session: DragPerfSession;
  endTime: number;
  reason: string;
}

export const createDragPerfSession = (
  source: PullRefreshGestureInputSource,
  startTime: number,
): DragPerfSession => ({
  source,
  startTime,
  frameCount: 0,
  totalFrameDelta: 0,
  lastFrameTime: null,
  minFrameDelta: Number.POSITIVE_INFINITY,
  maxFrameDelta: 0,
  longTaskCount: 0,
  totalLongTaskDuration: 0,
  maxLongTaskDuration: 0,
  frameLoopId: null,
  longTaskObserver: null,
});

export const buildDragPerfSummary = ({
  session,
  endTime,
  reason,
}: BuildDragPerfSummaryOptions): DragPerfSummary => {
  const durationMs = Math.max(safeNum(endTime) - safeNum(session.startTime), 0);
  const avgFrameDeltaMs = session.frameCount > 0 ? safeNum(session.totalFrameDelta) / safeNum(session.frameCount) : 0;
  const estimatedFps = avgFrameDeltaMs > 0 ? 1000 / safeNum(avgFrameDeltaMs) : 0;

  return {
    source: session.source,
    reason,
    durationMs: Number(durationMs.toFixed(2)),
    sampledFrames: session.frameCount,
    estimatedFps: Number(estimatedFps.toFixed(2)),
    avgFrameDeltaMs: Number(avgFrameDeltaMs.toFixed(2)),
    minFrameDeltaMs: session.minFrameDelta === Number.POSITIVE_INFINITY ? 0 : Number(session.minFrameDelta.toFixed(2)),
    maxFrameDeltaMs: Number(session.maxFrameDelta.toFixed(2)),
    longTaskCount: session.longTaskCount,
    totalLongTaskMs: Number(session.totalLongTaskDuration.toFixed(2)),
    maxLongTaskMs: Number(session.maxLongTaskDuration.toFixed(2)),
  };
};
