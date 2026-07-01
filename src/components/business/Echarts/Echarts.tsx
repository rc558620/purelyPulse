/**
 * Global Echarts Component
 * @description A reusable wrapper for ECharts diagrams.
 */
import React, { memo, useEffect, useMemo, useRef } from 'react';
import { BarChart, CustomChart, LineChart, PieChart } from 'echarts/charts';
import {
    GridComponent,
    LegendComponent,
    TitleComponent,
    TooltipComponent,
} from 'echarts/components';
import { LabelLayout } from 'echarts/features';
import { init, use as echartsUse } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';
import { cx } from '@utils/utils';
import styles from './Echarts.module.less';

echartsUse([
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    GridComponent,
    BarChart,
    LineChart,
    PieChart,
    CustomChart,
    LabelLayout,
    CanvasRenderer,
]);

interface EchartsProps {
    option: EChartsOption;
    style?: React.CSSProperties;
    className?: string;
    onEvents?: Record<string, (params: unknown) => void>;
}

type EventMap = NonNullable<EchartsProps['onEvents']>;

const isShallowEqualRecord = (
    prev?: Record<string, unknown>,
    next?: Record<string, unknown>,
): boolean => {
    if (prev === next) return true;
    if (!prev || !next) return !prev && !next;

    const prevKeys = Object.keys(prev);
    const nextKeys = Object.keys(next);
    if (prevKeys.length !== nextKeys.length) return false;

    for (const key of prevKeys) {
        if (prev[key] !== next[key]) return false;
    }
    return true;
};

const areStylePropsEqual = (
    prev?: React.CSSProperties,
    next?: React.CSSProperties,
): boolean => isShallowEqualRecord(
    prev as Record<string, unknown> | undefined,
    next as Record<string, unknown> | undefined,
);

const areEventMapsEqual = (
    prev?: EventMap,
    next?: EventMap,
): boolean => isShallowEqualRecord(
    prev as Record<string, unknown> | undefined,
    next as Record<string, unknown> | undefined,
);

const EchartsComponent: React.FC<EchartsProps> = ({ option, style, className, onEvents }) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<ReturnType<typeof init> | null>(null);
    const isFirstSetOption = useRef(true);
    const eventHandlersRef = useRef<EventMap | undefined>(onEvents);
    const eventProxyMapRef = useRef(new Map<string, (params: unknown) => void>());

    eventHandlersRef.current = onEvents;

    // 依赖 onEvents 的 key 集合而非引用，避免回调函数引用变化时重新绑定事件
    const eventNamesKey = useMemo(() => {
        if (!onEvents) return '';
        return Object.keys(onEvents).sort().join('|');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onEvents ? Object.keys(onEvents).sort().join('|') : '']);

    // Init once on mount, cleanup on unmount
    useEffect(() => {
        if (!chartRef.current) return;

        const eventProxyMap = eventProxyMapRef.current;

        // 仅 patch 图表容器元素的 addEventListener，强制 passive:true
        // 避免 ECharts 内部的 touch/wheel 事件触发浏览器 Violation 警告
        // 限定在单个元素而非全局 EventTarget.prototype，避免影响其他组件
        const PASSIVE_EVENTS = ['touchstart', 'touchmove', 'wheel', 'mousewheel'];
        const container = chartRef.current;
        const origAddEventListener = container.addEventListener.bind(container);
        container.addEventListener = function (
            type: string,
            listener: EventListenerOrEventListenerObject,
            options?: boolean | AddEventListenerOptions,
        ) {
            if (PASSIVE_EVENTS.includes(type)) {
                const patched: AddEventListenerOptions =
                    typeof options === 'object'
                        ? { ...options, passive: true }
                        : { passive: true, capture: Boolean(options) };
                return origAddEventListener(type, listener, patched);
            }
            return origAddEventListener(type, listener, options);
        };

        chartInstance.current = init(container);

        // init 完成后立即恢复原始 addEventListener
        container.addEventListener = origAddEventListener;

        // 用 ResizeObserver + rAF 节流观察容器尺寸变化，每帧最多 resize 一次
        // 避免拖拽窗口时高频触发导致 canvas 闪烁
        // 注意：observe 时 ResizeObserver 会立即同步触发一次回调（initial notification），
        // 此时 ECharts 入场动画尚未开始，若此时 resize() 会中止动画并跳到最终态（表现为"闪一下"）。
        // 用 skipFirst flag 跳过这次初始回调，之后的回调才是真正的尺寸变化。
        let rafId = 0;
        let skipFirst = true;
        const ro = new ResizeObserver(() => {
            if (skipFirst) {
                skipFirst = false;
                return;
            }
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                if (chartInstance.current && !chartInstance.current.isDisposed()) {
                    chartInstance.current.resize();
                }
            });
        });
        ro.observe(chartRef.current);

        return () => {
            cancelAnimationFrame(rafId);
            ro.disconnect();
            eventProxyMap.clear();
            chartInstance.current?.dispose();
            chartInstance.current = null;
        };
    }, []);

    // 首次用 lazyUpdate:false 立即渲染，确保动画在尺寸已稳定后触发；
    // 后续更新用 lazyUpdate:true 批量合并，减少不必要的重绘。
    useEffect(() => {
        if (!chartInstance.current) return;
        if (isFirstSetOption.current) {
            isFirstSetOption.current = false;
            chartInstance.current.setOption(option, { notMerge: false, lazyUpdate: false });
            return;
        }
        chartInstance.current.setOption(option, { notMerge: true, lazyUpdate: true });
    }, [option]);

    // 通过稳定代理函数绑定事件，handler 变化时仅更新 ref，不重复 off/on。
    useEffect(() => {
        const instance = chartInstance.current;
        if (!instance) return;

        const nextEventNames = eventNamesKey ? eventNamesKey.split('|').filter(Boolean) : [];
        const nextEventNameSet = new Set(nextEventNames);

        nextEventNames.forEach((eventName) => {
            if (eventProxyMapRef.current.has(eventName)) return;
            const proxy = (params: unknown) => {
                eventHandlersRef.current?.[eventName]?.(params);
            };
            eventProxyMapRef.current.set(eventName, proxy);
            instance.on(eventName, proxy);
        });

        Array.from(eventProxyMapRef.current.entries()).forEach(([eventName, proxy]) => {
            if (nextEventNameSet.has(eventName) || instance.isDisposed()) return;
            instance.off(eventName, proxy);
            eventProxyMapRef.current.delete(eventName);
        });
    }, [eventNamesKey]);

    return (
        <div
            ref={chartRef}
            className={cx(styles.echartsContainer, className)}
            style={style}
            role="img"
            aria-label="数据图表"
        />
    );
};

const Echarts = memo(EchartsComponent, (prevProps, nextProps) => {
    if (prevProps.option !== nextProps.option) return false;
    if (prevProps.className !== nextProps.className) return false;
    if (!areStylePropsEqual(prevProps.style, nextProps.style)) return false;
    if (!areEventMapsEqual(prevProps.onEvents, nextProps.onEvents)) return false;
    return true;
});

Echarts.displayName = 'Echarts';

export default Echarts;
