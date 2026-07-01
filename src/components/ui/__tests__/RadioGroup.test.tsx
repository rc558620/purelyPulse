/**
 * RadioGroup 组件单元测试
 *
 * 覆盖范围：
 *  ─ 基本渲染
 *    1.  渲染含 role="group" 的容器
 *    2.  各选项的 label 正常渲染
 *    3.  各选项有对应的 radio input
 *    4.  input type="radio"
 *    5.  label htmlFor 指向对应 input id
 *  ─ 选中状态
 *    6.  传入 value 时对应 input 被选中（checked）
 *    7.  未选中的选项 input 不被选中
 *    8.  value=null 时无选项被选中
 *    9.  value=undefined 时无选项被选中
 *  ─ 交互
 *    10. 点击 label 触发 onChange 并传入对应 value
 *    11. 点击已选中选项的 label 仍触发 onChange
 *    12. onChange 每次触发时参数正确
 *  ─ disabled
 *    13. disabled=true（整组）时所有 input 均 disabled
 *    14. disabled=false（默认）时所有 input 均不 disabled
 *    15. 单个选项 disabled=true 时该 input disabled
 *    16. 单个选项 disabled=true 时其他选项不 disabled
 *    17. 整组 disabled 时点击不触发 onChange
 *  ─ error / status 样式
 *    18. error=true 时容器含 radioGroupError class
 *    19. status="error" 时容器含 radioGroupError class
 *    20. error=false 且 status=undefined 时不含 radioGroupError class
 *    21. error=true 优先于 status=undefined
 *  ─ color 自定义
 *    22. 传入 color 时容器 style 设置 --radio-color
 *    23. 不传 color 时容器无 style
 *  ─ name 属性
 *    24. 传入 name 时所有 input 具有该 name
 *    25. 不传 name 时自动生成 name（所有 input name 相同）
 *  ─ className 透传
 *    26. 自定义 className 附加到容器上
 *  ─ ReactNode label
 *    27. label 支持 ReactNode（渲染 JSX）
 *  ─ React.memo
 *    28. RadioGroup 是 React.memo 包裹的组件
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RadioGroup from '../../form/RadioGroup/RadioGroup';
import type { RadioOption } from '../../form/RadioGroup/RadioGroup';

// ─────────────────────────────────────────────────────────────────────────────
// 测试用选项数据
// ─────────────────────────────────────────────────────────────────────────────
const OPTIONS: RadioOption[] = [
    { value: 'male', label: '男' },
    { value: 'female', label: '女' },
    { value: 'other', label: '其他' },
];

const OPTIONS_WITH_DISABLED: RadioOption[] = [
    { value: 'a', label: '选项A' },
    { value: 'b', label: '选项B', disabled: true },
    { value: 'c', label: '选项C' },
];

// ─────────────────────────────────────────────────────────────────────────────
// 辅助函数
// ─────────────────────────────────────────────────────────────────────────────
function renderRadioGroup(overrides: Partial<React.ComponentProps<typeof RadioGroup>> = {}) {
    const defaults = {
        options: OPTIONS,
        onChange: vi.fn(),
    };
    return render(<RadioGroup {...defaults} {...overrides} />);
}

// ─── 1. 基本渲染 ──────────────────────────────────────────────────────────────
describe('RadioGroup – 基本渲染', () => {
    it('渲染含 role="group" 的容器', () => {
        renderRadioGroup();
        expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('各选项的 label 正常渲染', () => {
        renderRadioGroup();
        expect(screen.getByLabelText('男')).toBeInTheDocument();
        expect(screen.getByLabelText('女')).toBeInTheDocument();
        expect(screen.getByLabelText('其他')).toBeInTheDocument();
    });

    it('各选项有对应的 radio input', () => {
        renderRadioGroup();
        expect(screen.getAllByRole('radio')).toHaveLength(3);
    });

    it('radio input type="radio"', () => {
        renderRadioGroup();
        screen.getAllByRole('radio').forEach((input) => {
            expect(input).toHaveAttribute('type', 'radio');
        });
    });

    it('label htmlFor 指向对应 input id', () => {
        const { container } = renderRadioGroup({ name: 'test-gender' });
        const inputs = container.querySelectorAll('input[type="radio"]');
        inputs.forEach((input) => {
            const id = input.getAttribute('id');
            const label = container.querySelector(`label[for="${id}"]`);
            expect(label).toBeInTheDocument();
        });
    });
});

// ─── 2. 选中状态 ──────────────────────────────────────────────────────────────
describe('RadioGroup – 选中状态', () => {
    it('传入 value="male" 时对应 input 被选中', () => {
        renderRadioGroup({ value: 'male' });
        expect(screen.getByLabelText('男')).toBeChecked();
    });

    it('未选中的选项 input 不被选中', () => {
        renderRadioGroup({ value: 'male' });
        expect(screen.getByLabelText('女')).not.toBeChecked();
        expect(screen.getByLabelText('其他')).not.toBeChecked();
    });

    it('value=null 时无选项被选中', () => {
        renderRadioGroup({ value: null });
        screen.getAllByRole('radio').forEach((input) => {
            expect(input).not.toBeChecked();
        });
    });

    it('value=undefined 时无选项被选中', () => {
        renderRadioGroup({ value: undefined });
        screen.getAllByRole('radio').forEach((input) => {
            expect(input).not.toBeChecked();
        });
    });

    it('value 变化时选中项更新', () => {
        const { rerender } = renderRadioGroup({ value: 'male' });
        expect(screen.getByLabelText('男')).toBeChecked();

        rerender(<RadioGroup options={OPTIONS} value="female" onChange={vi.fn()} />);
        expect(screen.getByLabelText('男')).not.toBeChecked();
        expect(screen.getByLabelText('女')).toBeChecked();
    });
});

// ─── 3. 交互 ─────────────────────────────────────────────────────────────────
// 注意：radio input 被 CSS 隐藏（pointer-events: none），需点击 label 触发 onChange
describe('RadioGroup – 交互', () => {
    it('点击 label 触发 onChange 并传入对应 value', () => {
        const onChange = vi.fn();
        const { container } = renderRadioGroup({ onChange, value: 'male' });
        // 点击「女」对应的 label
        const femaleLabel = container.querySelector('label[for*="female"]') as HTMLElement;
        fireEvent.click(femaleLabel);
        expect(onChange).toHaveBeenCalledWith('female');
    });

    it('点击不同选项 onChange 参数正确', () => {
        const onChange = vi.fn();
        const { container } = renderRadioGroup({ onChange, value: 'male' });
        const otherLabel = container.querySelector('label[for*="other"]') as HTMLElement;
        fireEvent.click(otherLabel);
        expect(onChange).toHaveBeenCalledWith('other');
    });

    it('onChange 每次触发一次（无重复调用）', () => {
        const onChange = vi.fn();
        const { container } = renderRadioGroup({ onChange, value: 'male' });
        const femaleLabel = container.querySelector('label[for*="female"]') as HTMLElement;
        fireEvent.click(femaleLabel);
        expect(onChange).toHaveBeenCalledTimes(1);
    });
});

// ─── 4. disabled ─────────────────────────────────────────────────────────────
describe('RadioGroup – disabled', () => {
    it('disabled=true（整组）时所有 input 均 disabled', () => {
        renderRadioGroup({ disabled: true });
        screen.getAllByRole('radio').forEach((input) => {
            expect(input).toBeDisabled();
        });
    });

    it('disabled=false（默认）时所有 input 均不 disabled', () => {
        renderRadioGroup({ disabled: false });
        screen.getAllByRole('radio').forEach((input) => {
            expect(input).not.toBeDisabled();
        });
    });

    it('单个选项 disabled=true 时该 input disabled', () => {
        renderRadioGroup({ options: OPTIONS_WITH_DISABLED });
        expect(screen.getByLabelText('选项B')).toBeDisabled();
    });

    it('单个选项 disabled=true 时其他选项不 disabled', () => {
        renderRadioGroup({ options: OPTIONS_WITH_DISABLED });
        expect(screen.getByLabelText('选项A')).not.toBeDisabled();
        expect(screen.getByLabelText('选项C')).not.toBeDisabled();
    });

    it('整组 disabled 时点击 label 不触发 onChange', () => {
        const onChange = vi.fn();
        const { container } = renderRadioGroup({ disabled: true, onChange });
        // 即使点击 label，disabled 的 input 不会触发 change 事件
        const maleLabel = container.querySelector('label[for*="male"]') as HTMLElement;
        fireEvent.click(maleLabel);
        // disabled input 不响应 change，onChange 不被调用
        expect(onChange).not.toHaveBeenCalled();
    });
});

// ─── 5. error / status 样式 ──────────────────────────────────────────────────
// CSS Modules 会对类名哈希，比较 error=true vs false 时 class 数量差异来验证错误类的添加
describe('RadioGroup – error / status 样式', () => {
    it('error=true 时容器有更多 class（radioGroupError 被添加）', () => {
        const { unmount: u1 } = renderRadioGroup({ error: false });
        const normalCount = screen.getByRole('group').className.split(/\s+/).filter(Boolean).length;
        u1();

        renderRadioGroup({ error: true });
        const errorCount = screen.getByRole('group').className.split(/\s+/).filter(Boolean).length;
        expect(errorCount).toBeGreaterThan(normalCount);
    });

    it('status="error" 时容器有更多 class（radioGroupError 被添加）', () => {
        const { unmount: u1 } = renderRadioGroup({ status: undefined });
        const normalCount = screen.getByRole('group').className.split(/\s+/).filter(Boolean).length;
        u1();

        renderRadioGroup({ status: 'error' });
        const errorCount = screen.getByRole('group').className.split(/\s+/).filter(Boolean).length;
        expect(errorCount).toBeGreaterThan(normalCount);
    });

    it('error=false 且 status=undefined 时不含额外 error class', () => {
        const { unmount: u1 } = renderRadioGroup({ error: true });
        const errorCount = screen.getByRole('group').className.split(/\s+/).filter(Boolean).length;
        u1();

        renderRadioGroup({ error: false, status: undefined });
        const normalCount = screen.getByRole('group').className.split(/\s+/).filter(Boolean).length;
        expect(normalCount).toBeLessThan(errorCount);
    });

    it('error=true 与 status="error" 同时设置时仍添加了 error class', () => {
        const { unmount: u1 } = renderRadioGroup({ error: false, status: undefined });
        const normalCount = screen.getByRole('group').className.split(/\s+/).filter(Boolean).length;
        u1();

        renderRadioGroup({ error: true, status: 'error' });
        const errorCount = screen.getByRole('group').className.split(/\s+/).filter(Boolean).length;
        expect(errorCount).toBeGreaterThan(normalCount);
    });
});

// ─── 6. color 自定义 ─────────────────────────────────────────────────────────
describe('RadioGroup – color 自定义', () => {
    it('传入 color 时容器 style 包含 --radio-color', () => {
        renderRadioGroup({ color: '#ff0000' });
        const group = screen.getByRole('group');
        expect(group).toHaveStyle({ '--radio-color': '#ff0000' });
    });

    it('不传 color 时容器无内联 style', () => {
        renderRadioGroup();
        const group = screen.getByRole('group');
        expect(group.getAttribute('style')).toBeNull();
    });
});

// ─── 7. name 属性 ────────────────────────────────────────────────────────────
describe('RadioGroup – name 属性', () => {
    it('传入 name 时所有 input 具有该 name', () => {
        renderRadioGroup({ name: 'gender' });
        screen.getAllByRole('radio').forEach((input) => {
            expect(input).toHaveAttribute('name', 'gender');
        });
    });

    it('不传 name 时自动生成 name（所有 input name 相同）', () => {
        renderRadioGroup();
        const radios = screen.getAllByRole('radio');
        const names = radios.map((r) => r.getAttribute('name'));
        // 所有 input name 应相同
        expect(new Set(names).size).toBe(1);
        // name 不为空
        expect(names[0]).toBeTruthy();
    });
});

// ─── 8. className 透传 ────────────────────────────────────────────────────────
describe('RadioGroup – className 透传', () => {
    it('自定义 className 附加到容器上', () => {
        renderRadioGroup({ className: 'my-radio-group' });
        expect(screen.getByRole('group').className).toContain('my-radio-group');
    });
});

// ─── 9. ReactNode label ───────────────────────────────────────────────────────
describe('RadioGroup – ReactNode label', () => {
    it('label 支持 ReactNode（渲染 JSX 节点）', () => {
        const optionsWithNode: RadioOption[] = [
            { value: 'rich', label: <strong data-testid="rich-label">富文本</strong> },
        ];
        renderRadioGroup({ options: optionsWithNode });
        expect(screen.getByTestId('rich-label')).toBeInTheDocument();
    });
});

// ─── 10. React.memo ───────────────────────────────────────────────────────────
describe('RadioGroup – React.memo', () => {
    it('RadioGroup 是 React.memo 包裹的组件', () => {
        expect((RadioGroup as unknown as { $$typeof?: symbol }).$$typeof?.toString()).toContain('memo');
    });
});
