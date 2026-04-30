/**
 * ChartSkeleton + ChartRenderer 组件单元测试
 *
 * ─ ChartSkeleton
 *    1.  渲染 div 元素
 *    2.  默认含 chartSkeleton class
 *    3.  aria-hidden="true"
 *    4.  className 附加到容器
 *    5.  style 内联样式生效
 *    6.  className 与内置 class 共存
 *    7.  style 与 className 同时生效
 *
 * ─ ChartRenderer（mock lazy Echarts）
 *    8.  渲染完成后显示 mock-echarts 节点
 *    9.  option 透传给 Echarts
 *    10. onEvents 透传给 Echarts
 *    11. 无 onEvents 时 data-has-events="false"
 *    12. height 数值转为 style.height（px）
 *    13. height 与 style 合并，style 其他属性保留
 *    14. height 未传时 style.height 不被设置
 *    15. className 透传给 Echarts
 *    16. ChartRenderer 是 React.memo 包裹的组件
 */

import React, { act } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChartSkeleton from '../data-display/ChartRenderer/ChartSkeleton';
import ChartRenderer from '../data-display/ChartRenderer/ChartRenderer';

// ─────────────────────────────────────────────────────────────────────────────
// 在模块顶层 mock 懒加载的 Echarts（vitest 提升 vi.mock 到文件顶部）
// ─────────────────────────────────────────────────────────────────────────────
vi.mock('@components/business/Echarts/Echarts', () => {
    interface MockProps {
        option?: object;
        onEvents?: Record<string, (params: unknown) => void>;
        className?: string;
        style?: React.CSSProperties;
    }
    return {
        default: ({ option, onEvents, className, style }: MockProps) => (
            <div
                data-testid="mock-echarts"
                data-option={JSON.stringify(option ?? {})}
                data-has-events={onEvents ? 'true' : 'false'}
                className={className}
                style={style}
            />
        ),
    };
});

// ═══════════════════════════════════════════════════════════════
// ChartSkeleton
// ═══════════════════════════════════════════════════════════════

describe('ChartSkeleton – 基本渲染', () => {
    it('渲染 div 元素', () => {
        const { container } = render(<ChartSkeleton />);
        expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('默认含 chartSkeleton class', () => {
        const { container } = render(<ChartSkeleton />);
        expect((container.firstChild as HTMLElement).className).toMatch(/chartSkeleton/);
    });

    it('aria-hidden="true"', () => {
        const { container } = render(<ChartSkeleton />);
        expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    });
});

describe('ChartSkeleton – className / style 透传', () => {
    it('className 附加到容器', () => {
        const { container } = render(<ChartSkeleton className="my-skeleton" />);
        expect((container.firstChild as HTMLElement).className).toContain('my-skeleton');
    });

    it('style 内联样式生效', () => {
        const { container } = render(<ChartSkeleton style={{ height: 200 }} />);
        expect((container.firstChild as HTMLElement).style.height).toBe('200px');
    });

    it('className 与内置 chartSkeleton class 共存', () => {
        const { container } = render(<ChartSkeleton className="extra" />);
        const cls = (container.firstChild as HTMLElement).className;
        expect(cls).toContain('extra');
        expect(cls).toMatch(/chartSkeleton/);
    });

    it('style 与 className 同时生效', () => {
        const { container } = render(
            <ChartSkeleton className="s-extra" style={{ width: 300 }} />,
        );
        const el = container.firstChild as HTMLElement;
        expect(el.className).toContain('s-extra');
        expect(el.style.width).toBe('300px');
    });
});

// ═══════════════════════════════════════════════════════════════
// ChartRenderer
// ═══════════════════════════════════════════════════════════════

describe('ChartRenderer – 图表渲染', () => {
    it('渲染完成后显示 mock-echarts 节点', async () => {
        const option = { title: { text: '测试图表' } };
        await act(async () => {
            render(<ChartRenderer option={option} />);
        });
        expect(screen.getByTestId('mock-echarts')).toBeInTheDocument();
    });

    it('option 透传给 Echarts', async () => {
        const option = { series: [{ type: 'bar' }] };
        await act(async () => {
            render(<ChartRenderer option={option} />);
        });
        const el = screen.getByTestId('mock-echarts');
        expect(el.getAttribute('data-option')).toContain('bar');
    });

    it('onEvents 透传给 Echarts', async () => {
        const onEvents = { click: vi.fn() };
        await act(async () => {
            render(<ChartRenderer option={{}} onEvents={onEvents} />);
        });
        expect(screen.getByTestId('mock-echarts').getAttribute('data-has-events')).toBe('true');
    });

    it('无 onEvents 时 data-has-events 为 false', async () => {
        await act(async () => {
            render(<ChartRenderer option={{}} />);
        });
        expect(screen.getByTestId('mock-echarts').getAttribute('data-has-events')).toBe('false');
    });
});

describe('ChartRenderer – height / style 处理', () => {
    it('height 数值转为 style.height（px）', async () => {
        await act(async () => {
            render(<ChartRenderer option={{}} height={300} />);
        });
        const el = screen.getByTestId('mock-echarts') as HTMLElement;
        expect(el.style.height).toBe('300px');
    });

    it('height 与 style 合并，style 其他属性保留', async () => {
        await act(async () => {
            render(<ChartRenderer option={{}} height={200} style={{ width: '100%' }} />);
        });
        const el = screen.getByTestId('mock-echarts') as HTMLElement;
        expect(el.style.height).toBe('200px');
        expect(el.style.width).toBe('100%');
    });

    it('height 未传时 style.height 不被设置', async () => {
        await act(async () => {
            render(<ChartRenderer option={{}} style={{ width: '50%' }} />);
        });
        const el = screen.getByTestId('mock-echarts') as HTMLElement;
        expect(el.style.height).toBe('');
        expect(el.style.width).toBe('50%');
    });
});

describe('ChartRenderer – className 透传', () => {
    it('className 透传给 Echarts', async () => {
        await act(async () => {
            render(<ChartRenderer option={{}} className="my-chart" />);
        });
        expect(screen.getByTestId('mock-echarts').className).toContain('my-chart');
    });
});

describe('ChartRenderer – React.memo', () => {
    it('ChartRenderer 是 React.memo 包裹的组件', () => {
        expect((ChartRenderer as unknown as { $$typeof?: symbol }).$$typeof?.toString()).toContain('memo');
    });
});
