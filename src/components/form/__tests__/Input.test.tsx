/**
 * Input / Textarea 组件单元测试
 *
 * 覆盖范围（Input）：
 *  - 基本渲染（<input> 包裹在 div 中）
 *  - prefix 渲染 / 无 prefix
 *  - suffix 渲染 / 无 suffix
 *  - status="error" 添加 error class / 无 status 不添加
 *  - type 默认为 'text'
 *  - autoComplete 默认 'off' / password 类型默认 'current-password'
 *  - autoComplete 自定义值优先
 *  - wrapperClassName 被应用到外层 div
 *  - className 被应用到 <input>
 *  - 标准 HTML input 属性透传（placeholder / disabled / maxLength）
 *  - type=number 时绑定 wheel 事件阻止默认行为
 *  - type=text 时不绑定 wheel 事件
 *  - displayName 属性
 *
 * 覆盖范围（Textarea）：
 *  - 基本渲染
 *  - status="error" 添加 error class
 *  - wrapperClassName 被应用到外层 div
 *  - className 被应用到 <textarea>
 *  - 标准 HTML textarea 属性透传
 *  - displayName 属性
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input, Textarea } from '../Input/Input';

// ─── Input ────────────────────────────────────────────────────────────────────
describe('Input – 基本渲染', () => {
    it('渲染 wrapper div 和 input 元素', () => {
        const { container } = render(<Input />);
        expect(container.querySelector('div')).toBeInTheDocument();
        expect(container.querySelector('input')).toBeInTheDocument();
    });

    it('displayName 为 Input', () => {
        expect((Input as React.FC & { displayName?: string }).displayName).toBe('Input');
    });

    it('type 默认为 text', () => {
        render(<Input />);
        expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');
    });
});

describe('Input – prefix / suffix', () => {
    it('渲染 prefix 节点', () => {
        render(<Input prefix={<span data-testid="pre">P</span>} />);
        expect(screen.getByTestId('pre')).toBeInTheDocument();
    });

    it('无 prefix 时不渲染 prefix wrapper', () => {
        const { container } = render(<Input />);
        // 只有 input wrapper div，没有额外的 prefixWrapper
        const divs = container.querySelectorAll('div');
        expect(divs).toHaveLength(1); // 只有 inputWrapper
    });

    it('渲染 suffix 节点', () => {
        render(<Input suffix={<span data-testid="suf">S</span>} />);
        expect(screen.getByTestId('suf')).toBeInTheDocument();
    });

    it('无 suffix 时不渲染 suffix wrapper', () => {
        const { container } = render(<Input />);
        const divs = container.querySelectorAll('div');
        expect(divs).toHaveLength(1);
    });

    it('prefix 和 suffix 同时渲染', () => {
        render(
            <Input
                prefix={<span data-testid="pre">P</span>}
                suffix={<span data-testid="suf">S</span>}
            />,
        );
        expect(screen.getByTestId('pre')).toBeInTheDocument();
        expect(screen.getByTestId('suf')).toBeInTheDocument();
    });
});

describe('Input – status', () => {
    it('status="error" 时 wrapper 含 statusError class', () => {
        const { container } = render(<Input status="error" />);
        const wrapper = container.querySelector('div')!;
        // CSS Module 类名包含 statusError
        expect(wrapper.className).toMatch(/statusError/i);
    });

    it('无 status 时 wrapper 不含 statusError class', () => {
        const { container } = render(<Input />);
        const wrapper = container.querySelector('div')!;
        expect(wrapper.className).not.toMatch(/statusError/i);
    });

    it('status="warning" 时不添加 statusError class（仅 error 触发）', () => {
        const { container } = render(<Input status="warning" />);
        const wrapper = container.querySelector('div')!;
        expect(wrapper.className).not.toMatch(/statusError/i);
    });
});

describe('Input – className / wrapperClassName', () => {
    it('wrapperClassName 被应用到外层 div', () => {
        const { container } = render(<Input wrapperClassName="my-wrapper" />);
        expect(container.querySelector('div')!.className).toContain('my-wrapper');
    });

    it('className 被应用到 input 元素', () => {
        render(<Input className="my-input" />);
        expect(screen.getByRole('textbox').className).toContain('my-input');
    });
});

describe('Input – autoComplete', () => {
    it('type=text 时 autoComplete 默认为 off', () => {
        render(<Input />);
        expect(screen.getByRole('textbox')).toHaveAttribute('autocomplete', 'off');
    });

    it('type=password 时 autoComplete 默认为 current-password', () => {
        const { container } = render(<Input type="password" />);
        expect(container.querySelector('input')).toHaveAttribute('autocomplete', 'current-password');
    });

    it('显式传入 autoComplete 时优先使用传入值', () => {
        render(<Input autoComplete="username" />);
        expect(screen.getByRole('textbox')).toHaveAttribute('autocomplete', 'username');
    });

    it('type=password 显式传入 autoComplete 时优先使用传入值', () => {
        const { container } = render(<Input type="password" autoComplete="new-password" />);
        expect(container.querySelector('input')).toHaveAttribute('autocomplete', 'new-password');
    });
});

describe('Input – HTML 属性透传', () => {
    it('透传 placeholder', () => {
        render(<Input placeholder="请输入" />);
        expect(screen.getByPlaceholderText('请输入')).toBeInTheDocument();
    });

    it('透传 disabled', () => {
        render(<Input disabled />);
        expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('透传 maxLength', () => {
        render(<Input maxLength={20} />);
        expect(screen.getByRole('textbox')).toHaveAttribute('maxlength', '20');
    });

    it('透传 value 和 onChange（受控）', () => {
        const onChange = vi.fn();
        render(<Input value="hello" onChange={onChange} readOnly />);
        expect(screen.getByRole('textbox')).toHaveValue('hello');
    });

    it('透传 type=number', () => {
        const { container } = render(<Input type="number" />);
        expect(container.querySelector('input')).toHaveAttribute('type', 'number');
    });
});

describe('Input – wheel 事件（type=number）', () => {
    it('type=number 时 wheel 事件被 preventDefault', () => {
        const { container } = render(<Input type="number" />);
        const input = container.querySelector('input')!;

        // 模拟 wheel 事件
        const wheelEvent = new WheelEvent('wheel', { bubbles: true, cancelable: true });
        const preventDefaultSpy = vi.spyOn(wheelEvent, 'preventDefault');
        input.dispatchEvent(wheelEvent);

        expect(preventDefaultSpy).toHaveBeenCalledTimes(1);
    });

    it('type=text 时 wheel 事件不被 preventDefault', () => {
        const { container } = render(<Input type="text" />);
        const input = container.querySelector('input')!;

        const wheelEvent = new WheelEvent('wheel', { bubbles: true, cancelable: true });
        const preventDefaultSpy = vi.spyOn(wheelEvent, 'preventDefault');
        input.dispatchEvent(wheelEvent);

        expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('type=number 组件卸载后不再阻止 wheel 事件', () => {
        const { container, unmount } = render(<Input type="number" />);
        const input = container.querySelector('input')!;
        unmount();

        const wheelEvent = new WheelEvent('wheel', { bubbles: true, cancelable: true });
        const preventDefaultSpy = vi.spyOn(wheelEvent, 'preventDefault');
        // 卸载后 listener 应该被移除，不再阻止
        input.dispatchEvent(wheelEvent);
        expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('type 从 number 切换到 text 后不再阻止 wheel 事件', () => {
        const { container, rerender } = render(<Input type="number" />);
        rerender(<Input type="text" />);
        const input = container.querySelector('input')!;

        const wheelEvent = new WheelEvent('wheel', { bubbles: true, cancelable: true });
        const preventDefaultSpy = vi.spyOn(wheelEvent, 'preventDefault');
        input.dispatchEvent(wheelEvent);

        expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
});

// ─── Textarea ────────────────────────────────────────────────────────────────
describe('Textarea – 基本渲染', () => {
    it('渲染 wrapper div 和 textarea 元素', () => {
        const { container } = render(<Textarea />);
        expect(container.querySelector('div')).toBeInTheDocument();
        expect(container.querySelector('textarea')).toBeInTheDocument();
    });

    it('displayName 为 Textarea', () => {
        expect((Textarea as React.FC & { displayName?: string }).displayName).toBe('Textarea');
    });
});

describe('Textarea – status', () => {
    it('status="error" 时 wrapper 含 statusError class', () => {
        const { container } = render(<Textarea status="error" />);
        const wrapper = container.querySelector('div')!;
        expect(wrapper.className).toMatch(/statusError/i);
    });

    it('无 status 时 wrapper 不含 statusError class', () => {
        const { container } = render(<Textarea />);
        const wrapper = container.querySelector('div')!;
        expect(wrapper.className).not.toMatch(/statusError/i);
    });
});

describe('Textarea – className / wrapperClassName', () => {
    it('wrapperClassName 被应用到外层 div', () => {
        const { container } = render(<Textarea wrapperClassName="my-wrapper" />);
        expect(container.querySelector('div')!.className).toContain('my-wrapper');
    });

    it('className 被应用到 textarea 元素', () => {
        const { container } = render(<Textarea className="my-textarea" />);
        expect(container.querySelector('textarea')!.className).toContain('my-textarea');
    });
});

describe('Textarea – HTML 属性透传', () => {
    it('透传 placeholder', () => {
        render(<Textarea placeholder="请输入内容" />);
        expect(screen.getByPlaceholderText('请输入内容')).toBeInTheDocument();
    });

    it('透传 disabled', () => {
        const { container } = render(<Textarea disabled />);
        expect(container.querySelector('textarea')).toBeDisabled();
    });

    it('透传 rows', () => {
        const { container } = render(<Textarea rows={5} />);
        expect(container.querySelector('textarea')).toHaveAttribute('rows', '5');
    });

    it('透传 value（受控）', () => {
        const { container } = render(<Textarea value="hello textarea" onChange={() => undefined} />);
        expect(container.querySelector('textarea')).toHaveValue('hello textarea');
    });
});
