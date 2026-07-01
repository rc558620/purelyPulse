/**
 * Search 组件单元测试
 *
 * 覆盖范围：
 *  - 基本渲染（search 图标、input、无值时无 clear 按钮）
 *  - value 展示
 *  - placeholder 默认值与自定义
 *  - onChange 回调（直接调用，不再走 startTransition）
 *  - onClear 回调
 *  - 清空按钮显隐（value 有值时显示，无值时隐藏）
 *  - 清空按钮 type="button"（防止 form 内意外 submit）
 *  - IME 组合输入：compositionStart 期间直接更新
 *  - IME 组合结束（compositionEnd）后不重复触发 onChange
 *  - className 应用
 *  - 无障碍属性（aria-label、type="search"）
 *  - 移动端优化属性（autoComplete、autoCorrect、spellCheck、enterKeyHint）
 *  - displayName
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Search } from '../Search';

// ─── 1. 基本渲染 ─────────────────────────────────────────────────────────────

describe('Search – 基本渲染', () => {
    it('渲染 input 元素', () => {
        render(<Search value="" onChange={vi.fn()} onClear={vi.fn()} />);
        expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });

    it('渲染搜索图标 svg', () => {
        const { container } = render(
            <Search value="" onChange={vi.fn()} onClear={vi.fn()} />,
        );
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('value 为空时不渲染清空按钮', () => {
        render(<Search value="" onChange={vi.fn()} onClear={vi.fn()} />);
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('displayName 为 Search', () => {
        expect((Search as React.FC & { displayName?: string }).displayName).toBe('Search');
    });
});

// ─── 2. value / placeholder ──────────────────────────────────────────────────

describe('Search – value / placeholder', () => {
    it('正确展示 value', () => {
        render(<Search value="hello" onChange={vi.fn()} onClear={vi.fn()} />);
        expect(screen.getByRole('searchbox')).toHaveValue('hello');
    });

    it('默认 placeholder 为 "搜索..."', () => {
        render(<Search value="" onChange={vi.fn()} onClear={vi.fn()} />);
        expect(screen.getByPlaceholderText('搜索...')).toBeInTheDocument();
    });

    it('自定义 placeholder 优先', () => {
        render(
            <Search value="" onChange={vi.fn()} onClear={vi.fn()} placeholder="输入关键词" />,
        );
        expect(screen.getByPlaceholderText('输入关键词')).toBeInTheDocument();
    });
});

// ─── 3. 清空按钮 ─────────────────────────────────────────────────────────────

describe('Search – 清空按钮', () => {
    it('value 有值时显示清空按钮', () => {
        render(<Search value="abc" onChange={vi.fn()} onClear={vi.fn()} />);
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('点击清空按钮触发 onClear', async () => {
        const user = userEvent.setup();
        const onClear = vi.fn();
        render(<Search value="abc" onChange={vi.fn()} onClear={onClear} />);
        await user.click(screen.getByRole('button'));
        expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('点击清空按钮不触发 onChange', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Search value="abc" onChange={onChange} onClear={vi.fn()} />);
        await user.click(screen.getByRole('button'));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('清空按钮 type 为 button（防止 form 内意外提交）', () => {
        render(<Search value="abc" onChange={vi.fn()} onClear={vi.fn()} />);
        const btn = screen.getByRole('button');
        expect(btn).toHaveAttribute('type', 'button');
    });
});

// ─── 4. onChange ─────────────────────────────────────────────────────────────

describe('Search – onChange', () => {
    it('输入时触发 onChange（非 IME 场景）', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Search value="" onChange={onChange} onClear={vi.fn()} />);
        await user.type(screen.getByRole('searchbox'), 'a');
        expect(onChange).toHaveBeenCalled();
        // onChange 被调用时第一个参数包含 'a'
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
        expect(lastCall[0]).toContain('a');
    });

    it('onChange 回调参数为字符串值', () => {
        const onChange = vi.fn();
        render(<Search value="" onChange={onChange} onClear={vi.fn()} />);
        const input = screen.getByRole('searchbox');
        fireEvent.change(input, { target: { value: 'test' } });
        expect(onChange).toHaveBeenCalledWith('test');
    });
});

// ─── 5. IME 组合输入 ─────────────────────────────────────────────────────────

describe('Search – IME 组合输入', () => {
    it('compositionStart 后 change 事件直接触发 onChange', () => {
        const onChange = vi.fn();
        render(<Search value="" onChange={onChange} onClear={vi.fn()} />);
        const input = screen.getByRole('searchbox');

        // 模拟 IME 开始
        fireEvent.compositionStart(input);
        // 在组合中输入
        fireEvent.change(input, { target: { value: '中' } });
        // onChange 应该直接被调用
        expect(onChange).toHaveBeenCalledWith('中');
    });

    it('compositionEnd 后不重复触发 onChange', () => {
        const onChange = vi.fn();
        render(<Search value="" onChange={onChange} onClear={vi.fn()} />);
        const input = screen.getByRole('searchbox');

        fireEvent.compositionStart(input);
        fireEvent.change(input, { target: { value: '中' } });
        // compositionEnd 不应额外触发 onChange
        const callCountBeforeEnd = onChange.mock.calls.length;
        act(() => {
            fireEvent.compositionEnd(input, { currentTarget: { value: '中文' } });
        });
        // compositionEnd 后 onChange 不应被再次调用
        expect(onChange.mock.calls.length).toBe(callCountBeforeEnd);
    });

    it('compositionEnd 后的 change 事件正常触发 onChange', () => {
        const onChange = vi.fn();
        render(<Search value="" onChange={onChange} onClear={vi.fn()} />);
        const input = screen.getByRole('searchbox');

        fireEvent.compositionStart(input);
        fireEvent.change(input, { target: { value: '中' } });
        act(() => {
            fireEvent.compositionEnd(input, { currentTarget: { value: '中文' } });
        });
        // compositionEnd 之后浏览器会触发一个 change 事件
        fireEvent.change(input, { target: { value: '中文测试' } });
        expect(onChange).toHaveBeenCalledWith('中文测试');
    });
});

// ─── 6. className ────────────────────────────────────────────────────────────

describe('Search – className', () => {
    it('自定义 className 被应用到根元素', () => {
        const { container } = render(
            <Search value="" onChange={vi.fn()} onClear={vi.fn()} className="my-search" />,
        );
        expect(container.firstChild).toHaveClass('my-search');
    });
});

// ─── 7. 无障碍与移动端优化属性 ────────────────────────────────────────────────

describe('Search – 无障碍与移动端', () => {
    it('input 默认 aria-label 为 "搜索"', () => {
        render(<Search value="" onChange={vi.fn()} onClear={vi.fn()} />);
        expect(screen.getByRole('searchbox')).toHaveAttribute('aria-label', '搜索');
    });

    it('自定义 ariaLabel 生效', () => {
        render(<Search value="" onChange={vi.fn()} onClear={vi.fn()} ariaLabel="搜索商品" />);
        expect(screen.getByRole('searchbox')).toHaveAttribute('aria-label', '搜索商品');
    });

    it('input type 为 search', () => {
        render(<Search value="" onChange={vi.fn()} onClear={vi.fn()} />);
        expect(screen.getByRole('searchbox')).toHaveAttribute('type', 'search');
    });

    it('input autoComplete 为 off', () => {
        render(<Search value="" onChange={vi.fn()} onClear={vi.fn()} />);
        expect(screen.getByRole('searchbox')).toHaveAttribute('autocomplete', 'off');
    });

    it('input autoCorrect 为 off', () => {
        render(<Search value="" onChange={vi.fn()} onClear={vi.fn()} />);
        expect(screen.getByRole('searchbox')).toHaveAttribute('autocorrect', 'off');
    });

    it('input spellCheck 为 false', () => {
        render(<Search value="" onChange={vi.fn()} onClear={vi.fn()} />);
        expect(screen.getByRole('searchbox')).toHaveAttribute('spellcheck', 'false');
    });

    it('input enterKeyHint 为 search', () => {
        render(<Search value="" onChange={vi.fn()} onClear={vi.fn()} />);
        expect(screen.getByRole('searchbox')).toHaveAttribute('enterkeyhint', 'search');
    });
});
