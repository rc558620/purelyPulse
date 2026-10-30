// 图片查看器：左右滑动切换的状态机（跟手拖拽 + 惯性 / 回弹收尾 + 索引落地）
//
// 动画只动 transform，分三个阶段：
// 1. idle      静止：只渲染当前图；
// 2. dragging  跟手：渲染邻图，位移由手势经 rAF 合帧直接写入 DOM，
//               不触发 React 重渲染，保证 60fps 跟手；
// 3. settling  收尾：松手后由手势层决定 commit（惯性切图）或 cancel（回弹归位），
//               起止位移交给 CSS transition，transitionend 落地索引
//               （事件丢失时由兜底计时器强制落地）。
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { safeNum } from '@utils/utils';

/** 滑动方向：next = 向左滑看下一张；prev = 向右滑看上一张 */
export type ImageViewerSlideDirection = 'prev' | 'next';

/**
 * 切图收尾参考时长（毫秒）：整屏位移对应该时长（与 @duration-normal 一致）。
 * 跟手松手只走剩余距离，时长按同一速度等比缩放，
 * 保证「按钮切换」与「跟手滑动」是同一种速度观感，而不是各演各的。
 */
const SETTLE_BASE_MS = 300;
/** 收尾时长下限（毫秒）：贴脸松手也该看得见，不能瞬移 */
const SETTLE_MIN_MS = 160;
/** 收尾时长上限（毫秒）：快速轻扫也不拖成慢动作 */
const SETTLE_MAX_MS = 400;
/**
 * 收尾兜底时长（毫秒）。必须大于最长收尾时长：
 * 过渡还没结束就强制落地会把动画切半，正是旧版「切换后闪烁 / 跳变」的来源。
 */
const SLIDE_FALLBACK_MS = 600;

/** 模块级检测一次「减少动态效果」偏好：开启时直接切换，不播放滑动动画 */
const prefersReducedMotion = (): boolean => (
  typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches
);

/** 跟手位移：手指向左（dx 为负）图随手指走 */
const followTransform = (dx: number): string => `translate3d(${dx}px, 0, 0)`;

/** 邻图待命位：下一张在右侧、上一张在左侧，再叠加跟手位移 */
const standbyTransform = (direction: ImageViewerSlideDirection, dx: number): string => (
  direction === 'next'
    ? `translate3d(calc(100% + ${dx}px), 0, 0)`
    : `translate3d(calc(-100% + ${dx}px), 0, 0)`
);

/** 收尾时邻图（即将成为当前图）的目标位：commit 落到屏幕中央，cancel 退回屏幕外 */
const incomingSettleTarget = (
  direction: ImageViewerSlideDirection,
  outcome: 'commit' | 'cancel',
): string => {
  if (outcome === 'commit') return 'translate3d(0, 0, 0)';
  return direction === 'next' ? 'translate3d(100%, 0, 0)' : 'translate3d(-100%, 0, 0)';
};

/** 收尾时当前图（即将退场）的目标位：commit 滑出屏幕，cancel 弹回中央 */
const currentSettleTarget = (
  direction: ImageViewerSlideDirection,
  outcome: 'commit' | 'cancel',
): string => {
  if (outcome === 'cancel') return 'translate3d(0, 0, 0)';
  return direction === 'next' ? 'translate3d(-100%, 0, 0)' : 'translate3d(100%, 0, 0)';
};

type SlidePhase =
  | { kind: 'idle' }
  | { kind: 'dragging'; direction: ImageViewerSlideDirection }
  | {
      kind: 'settling';
      direction: ImageViewerSlideDirection;
      /** 本次滑动的目标索引 */
      targetIndex: number;
      /** 松手瞬间已落盘的横向位移（px）：收尾过渡的起点 */
      fromDx: number;
      /** commit = 切图落地；cancel = 回弹归位 */
      outcome: 'commit' | 'cancel';
    };

export interface ImageViewerSlideState {
  /** 本次滑动的目标索引 */
  targetIndex: number;
  /** 滑动方向，决定入场 / 出场位移方向 */
  direction: ImageViewerSlideDirection;
}

export interface ImageViewerSlideStyles {
  /** 出场图（当前图）的行内位移 */
  current: CSSProperties;
  /** 入场图（邻图）的行内位移 */
  incoming: CSSProperties;
}

export interface UseImageViewerSlideOptions {
  /** 已落地的当前索引 */
  index: number;
  /** 图片总数 */
  total: number;
  /** 浮层是否可见：关闭时清空滑动态，避免下次打开残留动画 */
  visible: boolean;
  /** 动画结束后提交新索引 */
  onCommitIndex: (nextIndex: number) => void;
}

export interface UseImageViewerSlideResult {
  /** 正在播放的滑动状态（拖拽 / 收尾中）；null 表示静止 */
  slide: ImageViewerSlideState | null;
  /** 收尾起始帧两张图的行内位移；拖拽与静止态为 null（位移由指令式写入 / 本就无位移） */
  slideStyles: ImageViewerSlideStyles | null;
  /** 收尾结果：commit = 切图（减速续接）；cancel = 回弹（弹性归位）；null = 不在收尾态 */
  settleOutcome: 'commit' | 'cancel' | null;
  /** 是否可以开始新的拖拽：静止、多于一张图、未开启减动态 */
  canBeginDrag: boolean;
  /** 切到上一张（带滑动动画），已在首张时无操作 */
  navigatePrev: () => void;
  /** 切到下一张（带滑动动画），已在末张时无操作 */
  navigateNext: () => void;
  /** 手势锁定横向时调用：挂载邻图；越界返回 false */
  beginDrag: (direction: ImageViewerSlideDirection) => boolean;
  /** 拖拽中回传横向位移（rAF 合帧后写入 DOM） */
  updateDrag: (dx: number) => void;
  /** 松手回弹：未达切换阈值，邻图退回屏幕外 */
  cancelDrag: () => void;
  /** 出场图（当前图）宿主节点：指令式写入跟手位移 / 收尾目标位 */
  currentHostRef: React.RefObject<HTMLDivElement | null>;
  /** 入场图（邻图）宿主节点：transitionend 落在此节点上 */
  incomingHostRef: React.RefObject<HTMLDivElement | null>;
}

export const useImageViewerSlide = ({
  index,
  total,
  visible,
  onCommitIndex,
}: UseImageViewerSlideOptions): UseImageViewerSlideResult => {
  const [phase, setPhase] = useState<SlidePhase>({ kind: 'idle' });
  // 同步镜像：手势 / 动画回调里需要立即判断当前阶段，state 读到的是渲染前的值。
  // 渲染期不写 ref（并发渲染下不安全，也被 react-hooks/refs 禁止），
  // 改在最早执行的布局 effect 里同步，保证同次提交内的后续 effect 能读到新值。
  const phaseRef = useRef<SlidePhase>(phase);

  const currentHostRef = useRef<HTMLDivElement | null>(null);
  const incomingHostRef = useRef<HTMLDivElement | null>(null);
  // 与旧实现的 ref 初始化等价：整个浮层生命周期内只检测一次
  const [reducedMotion] = useState(prefersReducedMotion);
  const fallbackTimerRef = useRef<number | null>(null);
  const dragFrameRef = useRef<number | null>(null);
  /** 已写入 DOM 的跟手位移：松手收尾以此为起点，避免与画面跳变 */
  const appliedDxRef = useRef(0);
  /** 待写入的最新跟手位移（rAF 合帧用） */
  const pendingDxRef = useRef(0);

  // 可见性变化（打开 / 关闭）时清空滑动态：
  // state 用渲染期调整（React 官方「adjusting state when a prop changes」模式），
  // 避免在 effect 内同步 setState 引发级联渲染；ref 在下方 effect 里同步清空。
  const [prevVisible, setPrevVisible] = useState(visible);
  if (prevVisible !== visible) {
    setPrevVisible(visible);
    setPhase({ kind: 'idle' });
  }

  // 阶段镜像同步：必须声明在其他布局 effect 之前，先于它们执行
  useLayoutEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const clearFallbackTimer = useCallback((): void => {
    if (fallbackTimerRef.current === null) return;
    window.clearTimeout(fallbackTimerRef.current);
    fallbackTimerRef.current = null;
  }, []);

  const clearDragFrame = useCallback((): void => {
    if (dragFrameRef.current === null) return;
    window.cancelAnimationFrame(dragFrameRef.current);
    dragFrameRef.current = null;
  }, []);

  /** 指令式写入跟手位移：当前图随手指、邻图在屏幕外待命位同步跟随 */
  const applyDrag = useCallback((dx: number, direction: ImageViewerSlideDirection): void => {
    appliedDxRef.current = dx;
    if (currentHostRef.current) {
      currentHostRef.current.style.transform = followTransform(dx);
    }
    if (incomingHostRef.current) {
      incomingHostRef.current.style.transform = standbyTransform(direction, dx);
    }
  }, []);

  /** 落地：清空滑动态并把目标索引提交给调用方（同一批更新，画面无跳变） */
  const finishSettle = useCallback((): void => {
    if (phaseRef.current.kind !== 'settling') return;
    const { outcome, targetIndex } = phaseRef.current;

    clearFallbackTimer();
    clearDragFrame();
    // 清掉指令式位移与时长：commit 时入场图会被复用为当前图，
    // 残留 transform / transitionDuration 会影响下次拖拽与收尾判定
    if (currentHostRef.current) {
      currentHostRef.current.style.transform = '';
      currentHostRef.current.style.transitionDuration = '';
    }
    if (incomingHostRef.current) {
      incomingHostRef.current.style.transform = '';
      incomingHostRef.current.style.transitionDuration = '';
    }

    setPhase({ kind: 'idle' });
    if (outcome === 'commit') onCommitIndex(targetIndex);
  }, [clearDragFrame, clearFallbackTimer, onCommitIndex]);

  const startSettling = useCallback((
    direction: ImageViewerSlideDirection,
    targetIndex: number,
    fromDx: number,
    outcome: 'commit' | 'cancel',
  ): void => {
    clearDragFrame();
    clearFallbackTimer();
    setPhase({ kind: 'settling', direction, targetIndex, fromDx, outcome });
  }, [clearDragFrame, clearFallbackTimer]);

  const beginDrag = useCallback((direction: ImageViewerSlideDirection): boolean => {
    if (phaseRef.current.kind !== 'idle') return false;
    if (reducedMotion) return false;

    const targetIndex = safeNum(index) + (direction === 'next' ? 1 : -1);
    if (targetIndex < 0 || targetIndex >= safeNum(total)) return false;

    clearFallbackTimer();
    clearDragFrame();
    appliedDxRef.current = 0;
    setPhase({ kind: 'dragging', direction });
    return true;
  }, [clearDragFrame, clearFallbackTimer, index, reducedMotion, total]);

  const updateDrag = useCallback((dx: number): void => {
    if (phaseRef.current.kind !== 'dragging') return;
    pendingDxRef.current = dx;
    // 一帧最多写一次 DOM：手势事件可能比屏幕刷新更密集
    if (dragFrameRef.current !== null) return;
    dragFrameRef.current = requestAnimationFrame(() => {
      dragFrameRef.current = null;
      if (phaseRef.current.kind !== 'dragging') return;
      applyDrag(pendingDxRef.current, phaseRef.current.direction);
    });
  }, [applyDrag]);

  const cancelDrag = useCallback((): void => {
    const current = phaseRef.current;
    if (current.kind !== 'dragging') return;
    const targetIndex = safeNum(index) + (current.direction === 'next' ? 1 : -1);
    startSettling(current.direction, targetIndex, appliedDxRef.current, 'cancel');
  }, [index, startSettling]);

  const navigate = useCallback((direction: ImageViewerSlideDirection): void => {
    const current = phaseRef.current;
    // 收尾进行中忽略后续切换：按钮连点、键盘长按、手势连滑都可能触发
    if (current.kind === 'settling') return;

    // 拖拽松手直接切图：从跟手位置接着滑到目标位，画面连续不断
    if (current.kind === 'dragging') {
      if (current.direction !== direction) return;
      const targetIndex = safeNum(index) + (direction === 'next' ? 1 : -1);
      if (targetIndex < 0 || targetIndex >= safeNum(total)) return;
      startSettling(direction, targetIndex, appliedDxRef.current, 'commit');
      return;
    }

    const targetIndex = safeNum(index) + (direction === 'next' ? 1 : -1);
    if (targetIndex < 0 || targetIndex >= safeNum(total)) return;

    // 减少动态效果：直接落地，索引与序号同步更新，不挂动画
    if (reducedMotion) {
      onCommitIndex(targetIndex);
      return;
    }
    startSettling(direction, targetIndex, 0, 'commit');
  }, [index, onCommitIndex, reducedMotion, startSettling, total]);

  const navigatePrev = useCallback((): void => navigate('prev'), [navigate]);
  const navigateNext = useCallback((): void => navigate('next'), [navigate]);

  // 拖拽起始：邻图入场即就位到屏幕外待命位，避免跟手前闪现在屏幕中央。
  // 收尾起始：写入起始位移 → 强制一次样式刷新（记录 before-change style）→
  // 切到目标位移触发过渡。缺少中间那次刷新，同帧内的两轮样式写入会被浏览器
  // 合并为一次变更，过渡不触发，表现为「瞬移 / 闪烁」。
  // 目标位移只做指令式写入：slideStyles 由 useMemo 稳定持有起始值，
  // 同一次收尾内 React 不会重写 style，指令值可安全存活到落地。
  // DOM 未就绪属极端情况：不写位移即可，兜底计时器仍会保证索引落地。
  useLayoutEffect(() => {
    if (phase.kind === 'dragging') {
      applyDrag(appliedDxRef.current, phase.direction);
      return;
    }
    if (phase.kind !== 'settling') return;

    const current = currentHostRef.current;
    const incoming = incomingHostRef.current;
    if (!current || !incoming) return;

    const { direction, fromDx, outcome } = phase;
    // 1) 起始位移（拖拽松手时 DOM 已是跟手位置，重复写同值无副作用）
    applyDrag(fromDx, direction);
    // 2) 读一次布局：既强制样式刷新（记录 before-change style），又量取舞台宽度
    const stageWidth = incoming.offsetWidth;
    // 3) 切图收尾按「剩余距离 ÷ 参考速度」定时长：按钮整屏 300ms，
    //    跟手松手只走剩余距离但同速——两种入口速度一致，快速轻扫也不会被拖慢。
    if (outcome === 'commit' && stageWidth > 0) {
      const remainingRatio = Math.max(0, stageWidth - Math.abs(fromDx)) / stageWidth;
      const durationMs = Math.min(
        Math.max(SETTLE_BASE_MS * remainingRatio, SETTLE_MIN_MS),
        SETTLE_MAX_MS,
      );
      current.style.transitionDuration = `${durationMs}ms`;
      incoming.style.transitionDuration = `${durationMs}ms`;
    }
    // 4) 写入目标位移，触发过渡
    current.style.transform = currentSettleTarget(direction, outcome);
    incoming.style.transform = incomingSettleTarget(direction, outcome);
  }, [applyDrag, phase]);

  // 收尾监听：入场图的 transform 过渡结束即落地索引；
  // transitionend 丢失（元素被移除 / 过渡被跳过）时由兜底计时器强制落地。
  useLayoutEffect(() => {
    if (phase.kind !== 'settling') return;
    const incoming = incomingHostRef.current;

    const handleTransitionEnd = (event: TransitionEvent): void => {
      // 只认入场图自身的过渡，忽略子元素冒泡上来的 transitionend
      if (event.target !== incoming) return;
      finishSettle();
    };

    if (incoming) incoming.addEventListener('transitionend', handleTransitionEnd);
    fallbackTimerRef.current = window.setTimeout(finishSettle, SLIDE_FALLBACK_MS);

    return (): void => {
      if (incoming) incoming.removeEventListener('transitionend', handleTransitionEnd);
      clearFallbackTimer();
    };
  }, [clearFallbackTimer, finishSettle, phase]);

  // 关闭时清空滑动态镜像与计时器（effect 内只写 ref / 清计时器，不 setState）
  useEffect(() => {
    if (visible) return;
    phaseRef.current = { kind: 'idle' };
    clearFallbackTimer();
    clearDragFrame();
    appliedDxRef.current = 0;
  }, [clearDragFrame, clearFallbackTimer, visible]);

  // 卸载清理计时器与未执行的合帧，避免组件已销毁仍回写状态
  useEffect(() => () => {
    clearFallbackTimer();
    clearDragFrame();
  }, [clearDragFrame, clearFallbackTimer]);

  const slide: ImageViewerSlideState | null = useMemo(() => {
    if (phase.kind === 'dragging') {
      return {
        targetIndex: safeNum(index) + (phase.direction === 'next' ? 1 : -1),
        direction: phase.direction,
      };
    }
    if (phase.kind === 'settling') {
      return { targetIndex: phase.targetIndex, direction: phase.direction };
    }
    return null;
  }, [index, phase]);

  // 收尾起始帧的行内位移由 React 持有（落盘后立刻被指令式目标值覆盖），
  // 拖拽态全部交给指令式写入，React 不参与，避免重渲染抢写。
  const slideStyles: ImageViewerSlideStyles | null = useMemo(() => {
    if (phase.kind !== 'settling') return null;

    const { direction, fromDx } = phase;
    return {
      current: { transform: followTransform(fromDx) },
      incoming: { transform: standbyTransform(direction, fromDx) },
    };
  }, [phase]);

  return {
    slide,
    slideStyles,
    settleOutcome: phase.kind === 'settling' ? phase.outcome : null,
    canBeginDrag: phase.kind === 'idle' && !reducedMotion && safeNum(total) > 1,
    navigatePrev,
    navigateNext,
    beginDrag,
    updateDrag,
    cancelDrag,
    currentHostRef,
    incomingHostRef,
  };
};
