/**
 * Global Echarts Component
 * @description A reusable wrapper for ECharts diagrams.
 */
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { cx } from '@utils/utils';
import styles from './Echarts.module.less';

interface EchartsProps {
    option: echarts.EChartsOption;
    style?: React.CSSProperties;
    className?: string;
}

const Echarts: React.FC<EchartsProps> = ({ option, style, className }) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<echarts.ECharts | null>(null);

    // Init once on mount, cleanup on unmount
    useEffect(() => {
        if (!chartRef.current) return;

        // Patch addEventListener to force passive:true for scroll/touch events
        // This suppresses browser Violation warnings caused by ECharts internals
        const PASSIVE_EVENTS = ['touchstart', 'touchmove', 'wheel', 'mousewheel'];
        const origAddEventListener = EventTarget.prototype.addEventListener;
        EventTarget.prototype.addEventListener = function (
            type: string,
            listener: EventListenerOrEventListenerObject,
            options?: boolean | AddEventListenerOptions,
        ) {
            if (PASSIVE_EVENTS.includes(type)) {
                const patched: AddEventListenerOptions =
                    typeof options === 'object'
                        ? { ...options, passive: true }
                        : { passive: true, capture: Boolean(options) };
                return origAddEventListener.call(this, type, listener, patched);
            }
            return origAddEventListener.call(this, type, listener, options);
        };

        chartInstance.current = echarts.init(chartRef.current);

        // Restore original immediately after init
        EventTarget.prototype.addEventListener = origAddEventListener;

        // 用 ResizeObserver 观察容器自身尺寸变化（比 window.resize 更精准）
        // 可覆盖：window resize、flex/grid 布局变化导致的容器尺寸改变
        const ro = new ResizeObserver(() => {
            chartInstance.current?.resize();
        });
        ro.observe(chartRef.current);

        return () => {
            ro.disconnect();
            chartInstance.current?.dispose();
            chartInstance.current = null;
        };
    }, []);

    // Update option whenever it changes
    useEffect(() => {
        if (!chartInstance.current) return;
        chartInstance.current.setOption(option, { notMerge: false, lazyUpdate: true });
    }, [option]);

    return (
        <div 
            ref={chartRef} 
            className={cx(styles.echartsContainer, className)} 
            style={style} 
        />
    );
};

export default Echarts;
