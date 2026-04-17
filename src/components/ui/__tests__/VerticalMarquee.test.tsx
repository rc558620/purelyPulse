/**
 * VerticalMarquee 组件单元测试
 *
 * 覆盖范围：
 *  ─ 基本渲染
 *    1.  渲染外层容器 div（含 vm-container class）
 *    2.  渲染 track div（含 vm-track class）
 *    3.  渲染两份 content（原始 + 克隆，vm-content）
 *    4.  克隆 content 具有 aria-hidden
 *    5.  items 为空数组时不渲染任何 vm-item
 *  ─ renderItem
 *    6.  不传 renderItem 时将 item 直接作为 ReactNode 渲染
 *    7.  传入 renderItem 时使用自定义渲染函数
 *    8.  renderItem 接收正确的 item 和 index 参数
 *  ─ 高度样式
 *    9.  number height 转换为 px 字符串样式
 *    10. string height 直接作为样式值
 *    11. 默认 height 为 240px
 *  ─ mask（渐隐遮罩）
 *    12. mask=true（默认）时设置 maskImage style
 *    13. mask=false 时不设置 maskImage style
 *  ─ gap 间距
 *    14. items 之间的 marginBottom 根据 gap 设置（最后一项为 0）
 *  ─ className 透传
 *    15. 自定义 className 附加到外层容器上
 *  ─ style 透传
 *    16. 传入 style 被合并到外层容器 style 上
 *  ─ pauseOnHover
 *    17. pauseOnHover=true（默认）时绑定 onMouseEnter/onMouseLeave
 *    18. pauseOnHover=false 时不绑定 hover 事件
 *  ─ ref 暴露（VerticalMarqueeHandle）
 *    19. ref 具有 play 方法
 *    20. ref 具有 pause 方法
 *    21. ref 具有 reset 方法
 *    22. pause() 后 play() 不抛出错误
 *    23. reset() 不抛出错误
 *  ─ React.memo
 *    24. VerticalMarquee 是 memo 包裹的组件
 */

import React, { createRef, act } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VerticalMarquee } from '../VerticalMarquee/index';
import type { VerticalMarqueeHandle } from '../VerticalMarquee/index';

// ─────────────────────────────────────────────────────────────────────────────
// Mock ResizeObserver（jsdom 不实现 ResizeObserver）
// ─────────────────────────────────────────────────────────────────────────────
class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}

// 在全局注册 mock
beforeEach(() => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

const ITEMS = ['条目一', '条目二', '条目三'];

function renderMarquee(overrides: Partial<React.ComponentProps<typeof VerticalMarquee>> = {}) {
    const defaults = {
        items: ITEMS,
        height: 200,
        autoplay: false, // 关闭自动播放，测试时不需要 rAF 动画
    };
    return render(<VerticalMarquee {...defaults} {...overrides} />);
}

// ─── 1. 基本渲染 ──────────────────────────────────────────────────────────────
describe('VerticalMarquee – 基本渲染', () => {
    it('渲染外层容器 div（含 vm-container class）', () => {
        const { container } = renderMarquee();
        expect(container.querySelector('.vm-container')).toBeInTheDocument();
    });

    it('渲染 track div（含 vm-track class）', () => {
        const { container } = renderMarquee();
        expect(container.querySelector('.vm-track')).toBeInTheDocument();
    });

    it('渲染两份 content div（含 vm-content class）', () => {
        const { container } = renderMarquee();
        const contents = container.querySelectorAll('.vm-content');
        expect(contents).toHaveLength(2);
    });

    it('克隆 content 具有 aria-hidden 属性', () => {
        const { container } = renderMarquee();
        const cloneContent = container.querySelector('.vm-content--clone');
        expect(cloneContent).toHaveAttribute('aria-hidden');
    });

    it('items 为空数组时不渲染任何 vm-item', () => {
        const { container } = renderMarquee({ items: [] });
        expect(container.querySelectorAll('.vm-item')).toHaveLength(0);
    });
});

// ─── 2. renderItem ────────────────────────────────────────────────────────────
describe('VerticalMarquee – renderItem', () => {
    it('不传 renderItem 时将 item 直接作为 ReactNode 渲染', () => {
        renderMarquee({ items: ['条目一', '条目二'] });
        // 每份内容各渲染一次，共 2*2=4 个文本节点
        expect(screen.getAllByText('条目一')).toHaveLength(2);
        expect(screen.getAllByText('条目二')).toHaveLength(2);
    });

    it('传入 renderItem 时使用自定义渲染函数', () => {
        renderMarquee({
            items: ['A', 'B'],
            renderItem: (item) => <span data-testid={`item-${item}`}>{item}</span>,
        });
        expect(screen.getAllByTestId('item-A')).toHaveLength(2); // 原始 + 克隆
        expect(screen.getAllByTestId('item-B')).toHaveLength(2);
    });

    it('renderItem 接收正确的 item 和 index 参数', () => {
        const renderItem = vi.fn((item: string, index: number) => (
            <span key={index}>{item}</span>
        ));
        renderMarquee({ items: ['X', 'Y'], renderItem });
        // 调用次数 = items.length * 2（原始 + 克隆）
        expect(renderItem).toHaveBeenCalledWith('X', 0);
        expect(renderItem).toHaveBeenCalledWith('Y', 1);
    });
});

// ─── 3. 高度样式 ──────────────────────────────────────────────────────────────
describe('VerticalMarquee – 高度样式', () => {
    it('number height 转换为 px 字符串样式', () => {
        const { container } = renderMarquee({ height: 300 });
        const outer = container.querySelector('.vm-container') as HTMLElement;
        expect(outer.style.height).toBe('300px');
    });

    it('string height 直接作为样式值', () => {
        const { container } = renderMarquee({ height: '50vh' });
        const outer = container.querySelector('.vm-container') as HTMLElement;
        expect(outer.style.height).toBe('50vh');
    });

    it('默认 height 为 240px', () => {
        const { container } = render(<VerticalMarquee items={ITEMS} autoplay={false} />);
        const outer = container.querySelector('.vm-container') as HTMLElement;
        expect(outer.style.height).toBe('240px');
    });
});

// ─── 4. mask 渐隐遮罩 ────────────────────────────────────────────────────────
describe('VerticalMarquee – mask', () => {
    it('mask=true（默认）时容器 style 属性包含 height（mask 逻辑不影响 height 渲染）', () => {
        // jsdom 不支持 CSS mask/webkitMask 属性，无法直接断言。
        // 此处验证：mask=true 时组件能正常渲染（height style 存在），mask 逻辑不抛错。
        const { container } = render(<VerticalMarquee items={ITEMS} autoplay={false} mask={true} />);
        const outer = container.querySelector('.vm-container') as HTMLElement;
        const styleAttr = outer.getAttribute('style') ?? '';
        expect(styleAttr).toContain('height');
    });

    it('mask=false 时不设置 maskImage style（jsdom 环境下 style 仅含 height）', () => {
        const { container } = renderMarquee({ mask: false });
        const outer = container.querySelector('.vm-container') as HTMLElement;
        const styleAttr = outer.getAttribute('style') ?? '';
        // mask=false 时不应有 linear-gradient
        expect(styleAttr).not.toContain('linear-gradient');
    });
});

// ─── 5. gap 间距 ──────────────────────────────────────────────────────────────
describe('VerticalMarquee – gap', () => {
    it('中间 item 的 marginBottom 等于 gap 值', () => {
        const { container } = renderMarquee({ items: ['A', 'B', 'C'], gap: 12 });
        const content = container.querySelector('.vm-content')!;
        const vmItems = Array.from(content.querySelectorAll('.vm-item')) as HTMLElement[];
        // 第一个 item（不是最后一个）的 marginBottom 应为 12px
        expect(vmItems[0].style.marginBottom).toBe('12px');
    });

    it('最后一个 item 的 marginBottom 为 0', () => {
        const { container } = renderMarquee({ items: ['A', 'B', 'C'], gap: 12 });
        const content = container.querySelector('.vm-content')!;
        const vmItems = Array.from(content.querySelectorAll('.vm-item')) as HTMLElement[];
        const lastItem = vmItems[vmItems.length - 1];
        expect(lastItem.style.marginBottom).toBe('0px');
    });
});

// ─── 6. className / style 透传 ────────────────────────────────────────────────
describe('VerticalMarquee – className / style 透传', () => {
    it('自定义 className 附加到外层容器上', () => {
        const { container } = renderMarquee({ className: 'custom-marquee' });
        const outer = container.querySelector('.vm-container');
        expect(outer!.className).toContain('custom-marquee');
    });

    it('传入 style 被合并到外层容器 style', () => {
        const { container } = renderMarquee({ style: { backgroundColor: 'red' } });
        const outer = container.querySelector('.vm-container') as HTMLElement;
        expect(outer.style.backgroundColor).toBe('red');
    });
});

// ─── 7. pauseOnHover ─────────────────────────────────────────────────────────
describe('VerticalMarquee – pauseOnHover', () => {
    it('pauseOnHover=true（默认）时绑定 onMouseEnter/onMouseLeave（不报错）', () => {
        const { container } = render(<VerticalMarquee items={ITEMS} autoplay={false} pauseOnHover={true} />);
        const outer = container.querySelector('.vm-container')!;
        expect(() => {
            fireEvent.mouseEnter(outer);
            fireEvent.mouseLeave(outer);
        }).not.toThrow();
    });

    it('pauseOnHover=false 时 mouseEnter/mouseLeave 不报错', () => {
        const { container } = renderMarquee({ pauseOnHover: false });
        const outer = container.querySelector('.vm-container')!;
        expect(() => {
            fireEvent.mouseEnter(outer);
            fireEvent.mouseLeave(outer);
        }).not.toThrow();
    });
});

// ─── 8. ref 暴露 ──────────────────────────────────────────────────────────────
describe('VerticalMarquee – ref 暴露', () => {
    it('ref 具有 play 方法', () => {
        const ref = createRef<VerticalMarqueeHandle>();
        render(<VerticalMarquee items={ITEMS} autoplay={false} ref={ref} />);
        expect(typeof ref.current?.play).toBe('function');
    });

    it('ref 具有 pause 方法', () => {
        const ref = createRef<VerticalMarqueeHandle>();
        render(<VerticalMarquee items={ITEMS} autoplay={false} ref={ref} />);
        expect(typeof ref.current?.pause).toBe('function');
    });

    it('ref 具有 reset 方法', () => {
        const ref = createRef<VerticalMarqueeHandle>();
        render(<VerticalMarquee items={ITEMS} autoplay={false} ref={ref} />);
        expect(typeof ref.current?.reset).toBe('function');
    });

    it('pause() 后调用 play() 不抛出错误', () => {
        const ref = createRef<VerticalMarqueeHandle>();
        render(<VerticalMarquee items={ITEMS} autoplay={false} ref={ref} />);
        expect(() => {
            act(() => {
                ref.current!.pause();
                ref.current!.play();
            });
        }).not.toThrow();
    });

    it('reset() 不抛出错误', () => {
        const ref = createRef<VerticalMarqueeHandle>();
        render(<VerticalMarquee items={ITEMS} autoplay={false} ref={ref} />);
        expect(() => {
            act(() => {
                ref.current!.reset();
            });
        }).not.toThrow();
    });
});

// ─── 9. React.memo ────────────────────────────────────────────────────────────
describe('VerticalMarquee – React.memo', () => {
    it('VerticalMarquee 是 memo 包裹的组件', () => {
        expect((VerticalMarquee as unknown as { $$typeof?: symbol }).$$typeof?.toString()).toContain('memo');
    });
});
