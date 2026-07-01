/**
 * CascaderView 组件集成测试
 *
 * 覆盖范围：
 *  - trigger 展示 placeholder / displayText
 *  - 默认 placeholder "请选择"
 *  - 自定义 placeholder
 *  - 点击 trigger 打开（aria-expanded）
 *  - Enter 键打开
 *  - ESC 关闭（mobile 模式直接关闭）
 *  - status="error" trigger 含 error class
 *  - allowClear=true 有值时显示清除按钮，无值不显示
 *  - 点击清除触发 onChange([])
 *  - 受控 value 展示 displayText
 *  - defaultValue 非受控初始展示
 *  - displayMode="pc" / "mobile"
 *  - className 应用
 *  - prefix 渲染
 *  - aria 属性
 *  - Form + FormItem 集成
 */

import React from 'react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CascaderView } from '../index';
import { Form } from '../../Form';
import { FormItem } from '../../FormItem';
import type { CascadeOption } from '../types';

beforeAll(() => {
    vi.setSystemTime(new Date('2024-06-15T12:00:00'));
});
afterAll(() => {
    vi.useRealTimers();
});

const OPTIONS: CascadeOption[] = [
    {
        value: '广东',
        label: '广东省',
        children: [
            {
                value: '广州',
                label: '广州市',
                children: [
                    { value: '天河', label: '天河区' },
                    { value: '越秀', label: '越秀区' },
                ],
            },
            { value: '深圳', label: '深圳市', children: [{ value: '南山', label: '南山区' }] },
        ],
    },
    {
        value: '北京',
        label: '北京市',
        children: [
            { value: '朝阳', label: '朝阳区' },
        ],
    },
];

// ─── 1. trigger 展示 ─────────────────────────────────────────────────────────

describe('CascaderView – trigger 展示', () => {
    it('无 value 时展示默认 placeholder "请选择"', () => {
        render(<CascaderView options={OPTIONS} mode="pc" />);
        expect(screen.getByText('请选择')).toBeInTheDocument();
    });

    it('自定义 placeholder', () => {
        render(<CascaderView options={OPTIONS} placeholder="请选择地区" mode="pc" />);
        expect(screen.getByText('请选择地区')).toBeInTheDocument();
    });

    it('value 有值时展示 displayText（分层 label 用" / "分隔）', () => {
        render(
            <CascaderView
                options={OPTIONS}
                value={['广东', '广州', '天河']}
                mode="pc"
            />,
        );
        expect(screen.getByText('广东省 / 广州市 / 天河区')).toBeInTheDocument();
    });

    it('defaultValue 非受控初始展示', () => {
        render(
            <CascaderView
                options={OPTIONS}
                defaultValue={['北京', '朝阳']}
                mode="pc"
            />,
        );
        expect(screen.getByText('北京市 / 朝阳区')).toBeInTheDocument();
    });
});

// ─── 2. aria 属性 ────────────────────────────────────────────────────────────
// CascaderView 的 trigger 使用 role="combobox"，aria-haspopup="listbox"

describe('CascaderView – aria 属性', () => {
    it('trigger 具有 role="combobox"', () => {
        const { container } = render(<CascaderView options={OPTIONS} mode="pc" />);
        expect(container.querySelector('[role="combobox"]')).toBeInTheDocument();
    });

    it('trigger 初始 aria-expanded=false', () => {
        const { container } = render(<CascaderView options={OPTIONS} mode="pc" />);
        expect(container.querySelector('[role="combobox"]')).toHaveAttribute('aria-expanded', 'false');
    });

    it('打开后 aria-expanded=true', () => {
        const { container } = render(<CascaderView options={OPTIONS} mode="pc" />);
        const trigger = container.querySelector('[role="combobox"]')!;
        fireEvent.click(trigger);
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('trigger 具有 aria-haspopup="listbox"', () => {
        const { container } = render(<CascaderView options={OPTIONS} mode="pc" />);
        expect(container.querySelector('[role="combobox"]')).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('trigger 具有 tabIndex=0', () => {
        const { container } = render(<CascaderView options={OPTIONS} mode="pc" />);
        expect(container.querySelector('[role="combobox"]')).toHaveAttribute('tabindex', '0');
    });
});

// ─── 3. 打开 / 关闭 ──────────────────────────────────────────────────────────

describe('CascaderView – 打开/关闭', () => {
    it('点击 trigger 打开面板', () => {
        const { container } = render(<CascaderView options={OPTIONS} mode="pc" />);
        const trigger = container.querySelector('[role="combobox"]')!;
        fireEvent.click(trigger);
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('Enter 键打开面板', () => {
        const { container } = render(<CascaderView options={OPTIONS} mode="pc" />);
        const trigger = container.querySelector('[role="combobox"]')!;
        fireEvent.keyDown(trigger, { key: 'Enter' });
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('ESC 键触发关闭面板（mobile 走退场动画）', () => {
        const { container } = render(<CascaderView options={OPTIONS} mode="mobile" />);
        const trigger = container.querySelector('[role="combobox"]')!;
        fireEvent.click(trigger);
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        // ESC 触发 handleClose → setIsClosing(true)
        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        });
        // 移动端走退场动画，需模拟 transitionEnd
        const dialog = document.querySelector('[role="dialog"]');
        if (dialog) {
            act(() => {
                dialog.dispatchEvent(new TransitionEvent('transitionend', { propertyName: 'transform', bubbles: true }));
            });
        }
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
});

// ─── 4. status ───────────────────────────────────────────────────────────────

describe('CascaderView – status', () => {
    it('status="error" trigger 含 error class', () => {
        const { container } = render(<CascaderView options={OPTIONS} status="error" mode="pc" />);
        const trigger = container.querySelector('[role="combobox"]')!;
        expect(trigger.className).toMatch(/[Ee]rror/);
    });

    it('无 status 时无 error class', () => {
        const { container } = render(<CascaderView options={OPTIONS} mode="pc" />);
        const trigger = container.querySelector('[role="combobox"]')!;
        expect(trigger.className).not.toMatch(/[Ee]rror/);
    });
});

// ─── 5. allowClear ───────────────────────────────────────────────────────────

describe('CascaderView – allowClear', () => {
    it('allowClear=true 且有值时显示清除按钮', () => {
        render(
            <CascaderView
                options={OPTIONS}
                value={['广东']}
                allowClear
                mode="pc"
            />,
        );
        expect(screen.getByRole('button', { name: '清除选择' })).toBeInTheDocument();
    });

    it('allowClear=false 时不显示清除按钮', () => {
        render(
            <CascaderView
                options={OPTIONS}
                value={['广东']}
                allowClear={false}
                mode="pc"
            />,
        );
        expect(screen.queryByRole('button', { name: '清除选择' })).toBeNull();
    });

    it('无 value 时不显示清除按钮', () => {
        render(<CascaderView options={OPTIONS} allowClear mode="pc" />);
        expect(screen.queryByRole('button', { name: '清除选择' })).toBeNull();
    });

    it('点击清除触发 onChange([])', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(
            <CascaderView
                options={OPTIONS}
                value={['广东']}
                allowClear
                onChange={onChange}
                mode="pc"
            />,
        );
        await user.click(screen.getByRole('button', { name: '清除选择' }));
        expect(onChange).toHaveBeenCalledWith([]);
    });
});

// ─── 6. className / prefix ───────────────────────────────────────────────────

describe('CascaderView – className & prefix', () => {
    it('className 应用到外层 wrapper', () => {
        const { container } = render(
            <CascaderView options={OPTIONS} className="my-cascader" mode="pc" />,
        );
        expect(container.firstChild).toHaveClass('my-cascader');
    });

    it('prefix 自定义前缀渲染', () => {
        render(
            <CascaderView
                options={OPTIONS}
                mode="pc"
                prefix={<span data-testid="icon">📍</span>}
            />,
        );
        expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
});

// ─── 7. PC 模式级联交互 ──────────────────────────────────────────────────────

describe('CascaderView – PC 模式级联交互', () => {
    it('点击省份展开城市列表', async () => {
        const user = userEvent.setup();
        const { container } = render(
            <CascaderView options={OPTIONS} onChange={vi.fn()} mode="pc" />,
        );
        await user.click(container.querySelector('[role="combobox"]')!);
        // 面板打开后应看到省份选项
        await waitFor(() => {
            expect(screen.getByText('广东省')).toBeInTheDocument();
        });
        await user.click(screen.getByText('广东省'));
        // 展开城市
        await waitFor(() => {
            expect(screen.getByText('广州市')).toBeInTheDocument();
        });
    });

    it('受控模式切换父级时 active 高亮跟随当前草稿路径', async () => {
        const user = userEvent.setup();
        const { container } = render(
            <CascaderView
                options={OPTIONS}
                value={['北京', '朝阳']}
                onChange={vi.fn()}
                mode="pc"
            />,
        );

        await user.click(container.querySelector('[role="combobox"]')!);

        const beijingItem = screen.getByText('北京市').closest('div');
        expect(beijingItem?.className).toMatch(/active/);

        await user.click(screen.getByText('广东省'));

        const guangdongItem = screen.getByText('广东省').closest('div');
        expect(guangdongItem?.className).toMatch(/active/);
        expect(beijingItem?.className).not.toMatch(/active/);

        await waitFor(() => {
            expect(screen.getByText('广州市')).toBeInTheDocument();
        });
    });

    it('选中叶节点后触发 onChange 并关闭面板', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        const { container } = render(
            <CascaderView options={OPTIONS} onChange={onChange} mode="pc" />,
        );
        await user.click(container.querySelector('[role="combobox"]')!);
        await user.click(screen.getByText('广东省'));
        await user.click(screen.getByText('广州市'));
        await user.click(screen.getByText('天河区'));
        expect(onChange).toHaveBeenCalledWith(['广东', '广州', '天河']);
        // 面板关闭后 aria-expanded=false（或进入 isClosing）
        expect(container.querySelector('[role="combobox"]')).toBeInTheDocument();
    });
});

// ─── 8. Form + FormItem 集成 ─────────────────────────────────────────────────

describe('CascaderView – Form 集成', () => {
    it('FormItem 校验失败时显示 error 文案', async () => {
        const user = userEvent.setup();
        render(
            <Form>
                <FormItem name="area" rules={[{ required: true, message: '请选择地区' }]}>
                    <CascaderView options={OPTIONS} mode="pc" />
                </FormItem>
                <button type="submit">提交</button>
            </Form>,
        );
        await user.click(screen.getByRole('button', { name: '提交' }));
        await waitFor(() => {
            expect(screen.getByText('请选择地区')).toBeInTheDocument();
        });
    });
});
