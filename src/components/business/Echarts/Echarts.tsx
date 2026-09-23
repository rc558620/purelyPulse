/**
 * Global Echarts Component
 * @description A reusable wrapper for ECharts diagrams.
 */
import React, {
    forwardRef,
    memo,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react';
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
import { DEFAULT_CHART_HEIGHT } from './chart.constants';
import styles from './Echarts.module.less';

// 按需注册：这里只打包当前用到的能力，控制 vendor-echarts 懒加载 chunk 的体积
// （echarts/zrender 已通过 vite manualChunks 归并进该 chunk，多注册一个组件
// 就多一分全站图表共享的体积）。
//
// 需要扩展能力（dataZoom / toolbox / graphic / visualMap / markLine / dataset /
// SVG 渲染等）时，在用到它的模块里全局注册一次即可：
//   import { use } from 'echarts/core';
//   import { DataZoomComponent } from 'echarts/components';
//   use([DataZoomComponent]);
// 注意：这会增大 vendor-echarts chunk，请确认确有使用再注册。
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

/** ECharts 实例类型（避免在类型层直接依赖 echarts 内部导出） */
type EChartsInstance = ReturnType<typeof init>;

/**
 * option 更新策略。
 *
 * - `'merge'`（默认）：`notMerge: false + replaceMerge: ['series']`——保留
 *   tooltip / legend / dataZoom 等组件状态，并做数据过渡动画，观感更连贯；
 *   代价是 ECharts 需要做新旧 series 差分 + 逐元素插值，每帧开销更高。
 * - `'full'`：`notMerge: true` 全量替换——丢弃旧模型、重播一次入场动画，开销
 *   稳定可预测；代价是内部交互态被重置，且没有数据过渡。
 *
 * 实测结论：当前业务图表选 `'merge'` 观感更流畅；数据点特别多或需要"干脆重绘"
 * 的单张图，可通过 `updateStrategy` prop 单独覆盖为 `'full'`。
 */
export type EchartsUpdateStrategy = 'full' | 'merge';
const DEFAULT_UPDATE_STRATEGY: EchartsUpdateStrategy = 'merge';

/**
 * dpr 变化（浏览器缩放 / 跨屏拖动 / 系统缩放）时是否重建实例。
 *
 * zrender 的 dpr 在 Painter 构造时就固定了，resize() 不会重读，
 * 只有重建实例才能让画布跟上新的设备像素比；置 false 可关闭该行为。
 */
const ENABLE_DPR_REBUILD = true;

/** init 的可选项：只暴露扁平的基础配置，便于做稳定的依赖比较 */
export interface EchartsInitOpts {
    /** 设备像素比，默认取 window.devicePixelRatio */
    devicePixelRatio?: number;
    /** 脏矩形渲染 */
    useDirtyRect?: boolean;
    width?: number;
    height?: number;
}

/** 通过 ref 暴露的命令式句柄 */
export interface EchartsRef {
    /** 获取当前 ECharts 实例（未初始化 / 已销毁时为 null） */
    getChartInstance: () => EChartsInstance | null;
}

export interface EchartsProps {
    /**
     * ECharts 配置对象。
     * 组件按**引用**比较（React.memo），调用方必须用 useMemo / 模块常量缓存，
     * 否则父组件每次重渲染都会触发一次 setOption。
     */
    option: EChartsOption;
    style?: React.CSSProperties;
    className?: string;
    onEvents?: Record<string, (params: unknown) => void>;
    /** 实例创建完成后回调，用于 dispatchAction / getDataURL 等命令式操作 */
    onChartReady?: (instance: EChartsInstance) => void;
    /** 无障碍标签，默认「数据图表」 */
    ariaLabel?: string;
    /** 主题名或主题对象，仅在 init 时生效，变更会重建实例 */
    theme?: string | object;
    /** init 配置，仅在 init 时生效，变更会重建实例 */
    opts?: EchartsInitOpts;
    /** 展示 ECharts 内置 loading 遮罩 */
    loading?: boolean;
    /** loading 文案 / 样式配置，透传给 instance.showLoading */
    loadingOptions?: Record<string, unknown>;
    /**
     * option 更新策略，默认取 DEFAULT_UPDATE_STRATEGY。
     * 单张图可单独覆盖；不传则跟随全局开关。
     */
    updateStrategy?: EchartsUpdateStrategy;
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

/** init opts 全是扁平基础值，可安全拼成稳定的依赖 key */
const buildOptsKey = (opts?: EchartsInitOpts): string => {
    if (!opts) return '';
    return Object.keys(opts)
        .sort()
        .map((key) => `${key}=${String(opts[key as keyof EchartsInitOpts])}`)
        .join('|');
};

const getCurrentDpr = (): number => (
    typeof window === 'undefined' ? 1 : window.devicePixelRatio
);

const EchartsComponent = forwardRef<EchartsRef, EchartsProps>(({
    option,
    style,
    className,
    onEvents,
    onChartReady,
    ariaLabel = '数据图表',
    theme,
    opts,
    loading = false,
    loadingOptions,
    updateStrategy = DEFAULT_UPDATE_STRATEGY,
}, ref) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<EChartsInstance | null>(null);
    const isFirstSetOption = useRef(true);
    const eventHandlersRef = useRef<EventMap | undefined>(onEvents);
    const onChartReadyRef = useRef<EchartsProps['onChartReady'] | undefined>(onChartReady);
    const optsRef = useRef<EchartsInitOpts | undefined>(opts);
    const loadingOptionsRef = useRef<EchartsProps['loadingOptions']>(loadingOptions);
    const isLoadingShownRef = useRef(false);
    // 惰性创建：避免 useRef(new Map()) 在每次渲染都分配一个 Map
    const eventProxyMapRef = useRef<Record<string, (params: unknown) => void> | null>(null);

    // dpr 变化时 CSS 尺寸不变、ResizeObserver 不会触发；而 zrender 的 dpr 在
    // Painter 构造时就固定了，resize() 也不会重读，所以必须重建实例才能生效
    const [dpr, setDpr] = useState(getCurrentDpr);

    // 回调类 / 非比较类 prop 统一在 effect 里同步到 ref，避免在 render 阶段写 ref
    useEffect(() => {
        eventHandlersRef.current = onEvents;
        onChartReadyRef.current = onChartReady;
        optsRef.current = opts;
        loadingOptionsRef.current = loadingOptions;
    });

    useImperativeHandle(ref, () => ({
        getChartInstance: () => chartInstance.current,
    }), []);

    // 只依赖事件名集合，handler 引用变化不会触发重新 on/off
    const eventNamesKey = onEvents ? Object.keys(onEvents).sort().join('|') : '';

    // opts 用内容 key 而非对象引用，避免父组件重渲染导致无意义的重建
    const optsKey = buildOptsKey(opts);

    // 未显式指定高度时兜底，避免父容器没有高度时图表塌陷为 0
    const mergedStyle = useMemo<React.CSSProperties>(
        () => ({ height: DEFAULT_CHART_HEIGHT, ...style }),
        [style],
    );

    // Init：仅在主题 / init 配置 / dpr 变化时重建，cleanup 时销毁
    useEffect(() => {
        const container = chartRef.current;
        if (!container) return;

        // 每次（重新）挂载 / 重建都复位，保证 StrictMode 下 dev 与 prod 行为一致
        isFirstSetOption.current = true;
        isLoadingShownRef.current = false;

        chartInstance.current = init(container, theme, optsRef.current);
        onChartReadyRef.current?.(chartInstance.current);

        // 用 ResizeObserver + rAF 节流观察容器尺寸变化，每帧最多 resize 一次。
        //
        // 注意：不能用 skipFirst 粗暴跳过第一次回调。RO 的通知是异步派发的
        // （布局后、绘制前），并非同步触发；容器初始尺寸为 0（隐藏 Tab / 折叠面板）
        // 时第一次回调恰恰是真实的尺寸变化，跳过后图表会一直保持 0 尺寸。
        // 这里记录 init 时 ECharts 已读取的尺寸，只在尺寸确实没变时才跳过。
        // 统一用 clientWidth/clientHeight（取整）比较，避免 contentRect 的
        // 小数宽度与 init 时的整数测量不等价。
        let lastWidth = container.clientWidth;
        let lastHeight = container.clientHeight;
        let rafId = 0;
        const ro = new ResizeObserver(() => {
            const width = container.clientWidth;
            const height = container.clientHeight;
            if (width === lastWidth && height === lastHeight) return;
            lastWidth = width;
            lastHeight = height;

            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                if (chartInstance.current && !chartInstance.current.isDisposed()) {
                    chartInstance.current.resize();
                }
            });
        });
        ro.observe(container);

        // dpr 变化（浏览器缩放 / 跨屏拖动 / 系统缩放）后重建实例，避免画布停留在旧清晰度
        const handleDprChange = () => setDpr(getCurrentDpr());
        let dprMql: MediaQueryList | null = null;
        if (
            ENABLE_DPR_REBUILD
            && typeof window !== 'undefined'
            && typeof window.matchMedia === 'function'
        ) {
            dprMql = window.matchMedia(`(resolution: ${dpr}dppx)`);
            dprMql.addEventListener?.('change', handleDprChange);
        }

        return () => {
            cancelAnimationFrame(rafId);
            ro.disconnect();
            dprMql?.removeEventListener?.('change', handleDprChange);
            eventProxyMapRef.current = null;
            chartInstance.current?.dispose();
            chartInstance.current = null;
        };
    }, [theme, optsKey, dpr]);

    // 首次立即渲染（lazyUpdate:false），确保入场动画在尺寸稳定后触发；
    // 后续更新按 updateStrategy 决定全量替换还是差分过渡。
    useEffect(() => {
        const instance = chartInstance.current;
        if (!instance || instance.isDisposed()) return;

        if (isFirstSetOption.current) {
            isFirstSetOption.current = false;
            instance.setOption(option, { notMerge: false, lazyUpdate: false });
            return;
        }
        // lazyUpdate 必须为 false：replaceMerge / notMerge 会在 setOption 同步阶段
        // 创建新 series model，但其 data 要到下一帧 flush 才生成。若期间鼠标在
        // 图表上移动，trigger:'axis' 的 tooltip 会调用
        // getSeriesByIndex(...).getDataParams(...)，命中 data 为 undefined 的新
        // series，抛出 "Cannot read properties of undefined (reading 'getRawIndex')"。
        instance.setOption(
            option,
            updateStrategy === 'full'
                ? { notMerge: true, lazyUpdate: false }
                : { notMerge: false, lazyUpdate: false, replaceMerge: ['series'] },
        );
        // theme / optsKey / dpr 变化会重建实例，重建后需要重新下发 option
    }, [option, theme, optsKey, dpr, updateStrategy]);

    // 通过稳定代理函数绑定事件，handler 变化时仅更新 ref，不重复 off/on。
    useEffect(() => {
        const instance = chartInstance.current;
        if (!instance || instance.isDisposed()) return;

        const proxyMap = (eventProxyMapRef.current ??= {});
        const nextEventNames = eventNamesKey ? eventNamesKey.split('|').filter(Boolean) : [];
        const nextEventNameSet = new Set(nextEventNames);

        nextEventNames.forEach((eventName) => {
            if (proxyMap[eventName]) return;
            const proxy = (params: unknown) => {
                eventHandlersRef.current?.[eventName]?.(params);
            };
            proxyMap[eventName] = proxy;
            instance.on(eventName, proxy);
        });

        Object.entries(proxyMap).forEach(([eventName, proxy]) => {
            if (nextEventNameSet.has(eventName)) return;
            instance.off(eventName, proxy);
            delete proxyMap[eventName];
        });
    }, [eventNamesKey, theme, optsKey, dpr]);

    // loading 遮罩：用 ECharts 自带能力，避免调用方再叠一层骨架
    useEffect(() => {
        const instance = chartInstance.current;
        if (!instance || instance.isDisposed()) return;

        if (loading) {
            instance.showLoading(loadingOptionsRef.current);
            isLoadingShownRef.current = true;
            return;
        }
        if (isLoadingShownRef.current) {
            instance.hideLoading();
            isLoadingShownRef.current = false;
        }
        // 实例重建后需要按当前 loading 状态恢复遮罩
    }, [loading, theme, optsKey, dpr]);

    return (
        <div
            ref={chartRef}
            className={cx(styles.echartsContainer, className)}
            style={mergedStyle}
            role="img"
            aria-label={ariaLabel}
        />
    );
});

EchartsComponent.displayName = 'Echarts';

const Echarts = memo(EchartsComponent, (prevProps, nextProps) => {
    if (prevProps.option !== nextProps.option) return false;
    if (prevProps.className !== nextProps.className) return false;
    if (prevProps.ariaLabel !== nextProps.ariaLabel) return false;
    if (prevProps.theme !== nextProps.theme) return false;
    if (prevProps.loading !== nextProps.loading) return false;
    if (prevProps.updateStrategy !== nextProps.updateStrategy) return false;
    if (!isShallowEqualRecord(
        prevProps.opts as Record<string, unknown> | undefined,
        nextProps.opts as Record<string, unknown> | undefined,
    )) return false;
    if (!areStylePropsEqual(prevProps.style, nextProps.style)) return false;
    if (!areEventMapsEqual(prevProps.onEvents, nextProps.onEvents)) return false;
    // onChartReady / loadingOptions 走 ref，不参与比较
    return true;
});

Echarts.displayName = 'Echarts';

export default Echarts;
