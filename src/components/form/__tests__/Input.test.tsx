/**
 * Input / Textarea 组件单元测试
 *
 * 覆盖范围（Input）：
 *  - 基本渲染（<input> 包裹在 div 中）
 *  - prefix 渲染 / 无 prefix
 *  - suffix 渲染 / 无 suffix
 *  - status="error" 添加 error class / 无 status 不添加
 *  - status="warning" 添加 warning class / warning 与 error 互斥
 *  - type 默认为 'text'
 *  - autoComplete 默认 'off'（所有类型统一）
 *  - autoComplete 自定义值优先
 *  - wrapperClassName 被应用到外层 div
 *  - className 被应用到 <input>
 *  - 标准 HTML input 属性透传（placeholder / disabled / maxLength）
 *  - type=number 时渲染为 type=text + inputMode=decimal
 *  - type=number 时自定义 inputMode 优先
 *  - displayName 属性
 *  - ref 转发到 <input>
 *
 * 覆盖范围（Textarea）：
 *  - 基本渲染
 *  - status="error" 添加 error class
 *  - status="warning" 添加 warning class
 *  - wrapperClassName 被应用到外层 div
 *  - className 被应用到 <textarea>
 *  - 标准 HTML textarea 属性透传
 *  - displayName 属性
 *  - ref 转发到 <textarea>
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
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

    it('无 status 时 wrapper 不含 statusError 或 statusWarning class', () => {
        const { container } = render(<Input />);
        const wrapper = container.querySelector('div')!;
        expect(wrapper.className).not.toMatch(/statusError/i);
        expect(wrapper.className).not.toMatch(/statusWarning/i);
    });

    it('status="warning" 时 wrapper 含 statusWarning class', () => {
        const { container } = render(<Input status="warning" />);
        const wrapper = container.querySelector('div')!;
        expect(wrapper.className).toMatch(/statusWarning/i);
    });

    it('status="warning" 时 wrapper 不含 statusError class', () => {
        const { container } = render(<Input status="warning" />);
        const wrapper = container.querySelector('div')!;
        expect(wrapper.className).not.toMatch(/statusError/i);
    });

    it('status="error" 时 wrapper 不含 statusWarning class', () => {
        const { container } = render(<Input status="error" />);
        const wrapper = container.querySelector('div')!;
        expect(wrapper.className).not.toMatch(/statusWarning/i);
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

    it('type=password 时 autoComplete 默认为 off（避免新密码字段被自动填充旧密码）', () => {
        const { container } = render(<Input type="password" />);
        expect(container.querySelector('input')).toHaveAttribute('autocomplete', 'off');
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

    it('type=number 渲染为 type=text + inputMode=decimal', () => {
        const { container } = render(<Input type="number" />);
        expect(container.querySelector('input')).toHaveAttribute('type', 'text');
        expect(container.querySelector('input')).toHaveAttribute('inputmode', 'decimal');
    });
});

describe('Input – type=number 转换规则', () => {
    it('type=number 时渲染为 type=text', () => {
        const { container } = render(<Input type="number" />);
        expect(container.querySelector('input')).toHaveAttribute('type', 'text');
    });

    it('type=number 时默认 inputMode 为 decimal', () => {
        const { container } = render(<Input type="number" />);
        expect(container.querySelector('input')).toHaveAttribute('inputmode', 'decimal');
    });

    it('type=number + inputMode=numeric 时使用自定义 inputMode', () => {
        const { container } = render(<Input type="number" inputMode="numeric" />);
        expect(container.querySelector('input')).toHaveAttribute('inputmode', 'numeric');
    });

    it('type=text 时无 inputMode', () => {
        const { container } = render(<Input type="text" />);
        expect(container.querySelector('input')).not.toHaveAttribute('inputmode');
    });

    it('type=text + 自定义 inputMode 时保留', () => {
        const { container } = render(<Input type="text" inputMode="email" />);
        expect(container.querySelector('input')).toHaveAttribute('inputmode', 'email');
    });
});

describe('Input – ref 转发', () => {
    it('ref 可获取 input DOM 节点', () => {
        const ref = React.createRef<HTMLInputElement>();
        render(<Input ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('ref 可调用 focus / blur', () => {
        const ref = React.createRef<HTMLInputElement>();
        render(<Input ref={ref} />);
        expect(ref.current).not.toBeNull();
        ref.current!.focus();
        expect(ref.current).toHaveFocus();
        ref.current!.blur();
        expect(ref.current).not.toHaveFocus();
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

    it('无 status 时 wrapper 不含 statusError 或 statusWarning class', () => {
        const { container } = render(<Textarea />);
        const wrapper = container.querySelector('div')!;
        expect(wrapper.className).not.toMatch(/statusError/i);
        expect(wrapper.className).not.toMatch(/statusWarning/i);
    });

    it('status="warning" 时 wrapper 含 statusWarning class', () => {
        const { container } = render(<Textarea status="warning" />);
        const wrapper = container.querySelector('div')!;
        expect(wrapper.className).toMatch(/statusWarning/i);
    });

    it('status="warning" 时 wrapper 不含 statusError class', () => {
        const { container } = render(<Textarea status="warning" />);
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

describe('Textarea – ref 转发', () => {
    it('ref 可获取 textarea DOM 节点', () => {
        const ref = React.createRef<HTMLTextAreaElement>();
        render(<Textarea ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    });

    it('ref 可调用 focus / blur', () => {
        const ref = React.createRef<HTMLTextAreaElement>();
        render(<Textarea ref={ref} />);
        expect(ref.current).not.toBeNull();
        ref.current!.focus();
        expect(ref.current).toHaveFocus();
        ref.current!.blur();
        expect(ref.current).not.toHaveFocus();
    });
});
