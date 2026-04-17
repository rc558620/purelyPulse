import React, {
  useRef,
  useEffect,
  useLayoutEffect,
  useImperativeHandle,
  forwardRef,
  memo,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { safeNum } from '@utils/utils';
import styles from './VerticalMarquee.module.less';

export interface VerticalMarqueeHandle {
  play: () => void;
  pause: () => void;
  reset: () => void;
}

export interface VerticalMarqueeProps<T = unknown> {
  height?: number | string; // 容器可视高度
  speed?: number; // px/s
  gap?: number; // 条目间距(px)
  pauseOnHover?: boolean; // 悬停暂停
  autoplay?: boolean; // 自动播放
  items: readonly T[]; // 数据
  renderItem?: (item: T, index: number) => ReactNode;
  style?: CSSProperties;
  className?: string;
  mask?: boolean; // 上下渐隐遮罩
  maskSize?: number; // 渐隐高度(px)
}

function cx(...p: Array<string | false | null | undefined>) {
  return p.filter(Boolean).join(' ');
}

const VerticalMarqueeInner = <T,>(
  {
    height = 240,
    speed = 40,
    gap = 0,
    pauseOnHover = true,
    autoplay = true,
    items,
    renderItem,
    style,
    className,
    mask = true,
    maskSize = 16,
  }: VerticalMarqueeProps<T>,
  ref: React.Ref<VerticalMarqueeHandle>,
) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const contentARef = useRef<HTMLDivElement | null>(null); // 单份内容（测量用）

  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const playingRef = useRef<boolean>(!!autoplay);
  const offsetRef = useRef<number>(0); // 当前位移（持续递增）
  const contentHRef = useRef<number>(0); // 单份内容高度（含 padding-bottom: gap）

  // 播放状态切换：从暂停 -> 播放时重置时间基准，避免 hover 离开猛跳
  const setPlaying = (val: boolean) => {
    playingRef.current = val;
    if (val) lastTsRef.current = null;
  };

  // 渲染 items（遵循你的 .map 约定 + 回退 key）
  const renderItems = (source: readonly T[], prefix: string) => {
    if (!Array.isArray(source) || source.length === 0) return null;
    return source.map((item, idx) => {
      const key = `vm-${prefix}-${idx}`;
      const node = renderItem ? renderItem(item, idx) : (item as unknown as ReactNode);
      return (
        <div
          key={key}
          className={cx(styles.vmItem, "vm-item")}
          style={{ marginBottom: idx === source.length - 1 ? 0 : gap }}
        >
          {node ?? null}
        </div>
      );
    });
  };

  // 高精度测量：BCR.height（包含 padding），不再额外 + gap
  const measureContentHeight = () => {
    const el = contentARef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const h = rect.height;
    contentHRef.current = h;
    return h;
  };

  // 监听尺寸变化
  useLayoutEffect(() => {
    if (!contentARef.current) return;
    measureContentHeight();

    const ro = new ResizeObserver(() => {
      const prev = contentHRef.current;
      const next = measureContentHeight();
      if (Math.abs(next - prev) > 0.1) {
        lastTsRef.current = null; // 尺寸变了，重置时间基准更平滑
      }
    });
    ro.observe(contentARef.current);

    const onResize = () => {
      measureContentHeight();
      lastTsRef.current = null;
    };
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onResize);
    };
     
  }, [items, gap]);

  // 主循环（纯 rAF，不触发 React 重渲），严格无缝
  useEffect(() => {
    const tick = (ts: number) => {
      if (!playingRef.current) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = Math.max(0, ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;

      const contentH = contentHRef.current;
      const containerH = containerRef.current?.clientHeight ?? 0;
      const shouldScroll = contentH > containerH + 0.5 && contentH > 0;

      if (shouldScroll) {
        const v = Math.max(0, speed);
        let next = offsetRef.current + v * dt;

        // 仅做减法回绕（极端掉帧用 while）
        while (next >= contentH) next -= contentH;

        offsetRef.current = next;
        if (trackRef.current) {
          trackRef.current.style.transform = `translate3d(0, -${next}px, 0)`;
        }
      } else {
        offsetRef.current = 0;
        if (trackRef.current) {
          trackRef.current.style.transform = `translate3d(0, 0, 0)`;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
    };
  }, [speed]);

  // 可见性变化：切回时不积累 dt
  useEffect(() => {
    const onVisible = () => {
      lastTsRef.current = null;
    };
    document.addEventListener('visibilitychange', onVisible, { passive: true });
    window.addEventListener('focus', onVisible, { passive: true });
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, []);

  // 悬停暂停/离开恢复
  const bindHover = pauseOnHover
    ? {
        onMouseEnter: () => setPlaying(false),
        onMouseLeave: () => setPlaying(true),
      }
    : {};

  // 暴露方法
  useImperativeHandle(
    ref,
    () => ({
      play: () => setPlaying(true),
      pause: () => setPlaying(false),
      reset: () => {
        setPlaying(false);
        offsetRef.current = 0;
        lastTsRef.current = null;
        if (trackRef.current) {
          trackRef.current.style.transform = `translate3d(0,0,0)`;
        }
        requestAnimationFrame(() => setPlaying(true));
      },
    }),
    [],
  );

  const containerH: string | number = typeof height === 'number' ? `${height}px` : height;

  // <VerticalMarquee 使用示例
  //   ref={ref}
  //   height={verticalMarqueeHeight}
  //   speed={20} // px/s
  //   gap={12}
  //   items={vm.events}
  //   renderItem={(row, idx) => (
  //     <div className="bulk-analysis__event" key={idx}>
  //       <div className="bulk-analysis__event-head">{row.headline}</div>
  //       {row.detail && <div className="bulk-analysis__event-detail">{row.detail}</div>}
  //     </div>
  //   )}
  // />

  return (
    <div
      ref={containerRef}
      className={cx(styles.vmContainer, 'vm-container', className)}
      style={{
        height: containerH,
        ...style,
        // 渐隐遮罩（可选）
        maskImage: mask
          ? `linear-gradient(to bottom,
              rgba(0,0,0,0) 0px,
              rgba(0,0,0,1) ${safeNum(maskSize)}px,
              rgba(0,0,0,1) calc(100% - ${safeNum(maskSize)}px),
              rgba(0,0,0,0) 100%)`
          : undefined,
        WebkitMaskImage: mask
          ? `linear-gradient(to bottom,
              rgba(0,0,0,0) 0px,
              rgba(0,0,0,1) ${safeNum(maskSize)}px,
              rgba(0,0,0,1) calc(100% - ${safeNum(maskSize)}px),
              rgba(0,0,0,0) 100%)`
          : undefined,
      }}
      {...bindHover}
    >
      <div
        ref={trackRef}
        className={cx(styles.vmTrack, "vm-track")}
        style={{
          // ❌ 不要 contain: paint（会裁剪导致空白）
        }}
      >
        {/* 第一份（测量用），用 padding-bottom 补缝 */}
        <div ref={contentARef} className={cx(styles.vmContent, "vm-content")} style={{ paddingBottom: gap }}>
          {renderItems(items, 'a')}
        </div>

        {/* 第二份克隆，同样 padding-bottom，保证首尾间距一致 */}
        <div className={cx(styles.vmContent, "vm-content", "vm-content--clone")} aria-hidden style={{ paddingBottom: gap }}>
          {renderItems(items, 'b')}
        </div>
      </div>
    </div>
  );
};

export const VerticalMarquee = memo(forwardRef(VerticalMarqueeInner)) as <T = unknown>(
  p: VerticalMarqueeProps<T> & { ref?: React.Ref<VerticalMarqueeHandle> },
) => React.ReactElement;

export default VerticalMarquee;
