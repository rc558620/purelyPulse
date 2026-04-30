/**
 * InlineEditForm 组件单元测试
 *
 * 覆盖范围：
 *  ─ 基本渲染
 *    1.  渲染 input 元素
 *    2.  渲染保存按钮（含 aria-label）
 *    3.  渲染取消按钮（含 aria-label）
 *    4.  input defaultValue 与 defaultName 一致
 *    5.  input placeholder 正确
 *    6.  input maxLength=20
 *    7.  button type="button"
 *  ─ 保存行为
 *    8.  输入合法名称后点击保存，触发 onSave(id, trimmedName)
 *    9.  trimmed 后传入 onSave，去除首尾空格
 *    10. 空字符串时不触发 onSave
 *    11. 空字符串时触发 showToast error
 *    12. 仅空格时不触发 onSave
 *  ─ 取消行为
 *    13. 点击取消触发 onCancel
 *  ─ 键盘交互
 *    14. Enter 键触发保存（有内容时调用 onSave）
 *    15. Enter 键空内容时不调用 onSave（调用 showToast）
 *    16. Escape 键触发 onCancel
 *  ─ 自定义文案
 *    17. emptyMsg 为空时 showToast 使用自定义消息
 *    18. placeholder 自定义生效
 *  ─ React.memo
 *    19. InlineEditForm 是 React.memo 包裹的组件
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InlineEditForm from '../inlineEdit/InlineEditForm/InlineEditForm';

// ─────────────────────────────────────────────────────────────────────────────
// mock showToast
// ─────────────────────────────────────────────────────────────────────────────
const mockShowToast = vi.fn();
vi.mock('@components/ui/feedback/Toast', () => ({
    showToast: (opts: unknown) => mockShowToast(opts),
}));

// ─────────────────────────────────────────────────────────────────────────────
// 辅助函数
// ─────────────────────────────────────────────────────────────────────────────
function renderForm(overrides: Partial<React.ComponentProps<typeof InlineEditForm>> = {}) {
    const defaults = {
        id: 'item-1',
        defaultName: '旧名称',
        onSave: vi.fn(),
        onCancel: vi.fn(),
    };
    return render(<InlineEditForm {...defaults} {...overrides} />);
}

// ─── 1. 基本渲染 ──────────────────────────────────────────────────────────────
describe('InlineEditForm – 基本渲染', () => {
    beforeEach(() => mockShowToast.mockClear());

    it('渲染 input 元素', () => {
        renderForm();
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('渲染保存按钮（含 aria-label）', () => {
        renderForm();
        expect(screen.getByRole('button', { name: /保存编辑/ })).toBeInTheDocument();
    });

    it('渲染取消按钮（含 aria-label）', () => {
        renderForm();
        expect(screen.getByRole('button', { name: /取消编辑/ })).toBeInTheDocument();
    });

    it('input defaultValue 与 defaultName 一致', () => {
        renderForm({ defaultName: '商品A' });
        expect(screen.getByRole('textbox')).toHaveValue('商品A');
    });

    it('input placeholder 正确（默认）', () => {
        renderForm();
        expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', '请输入名称');
    });

    it('input maxLength=20', () => {
        renderForm();
        expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', '20');
    });

    it('两个 button 均为 type="button"', () => {
        renderForm();
        screen.getAllByRole('button').forEach((btn) => {
            expect(btn).toHaveAttribute('type', 'button');
        });
    });
});

// ─── 2. 保存行为 ──────────────────────────────────────────────────────────────
describe('InlineEditForm – 保存行为', () => {
    beforeEach(() => mockShowToast.mockClear());

    it('输入合法名称后点击保存，触发 onSave(id, name)', async () => {
        const user = userEvent.setup();
        const onSave = vi.fn();
        renderForm({ id: 'cat-5', onSave, defaultName: '' });

        await user.clear(screen.getByRole('textbox'));
        await user.type(screen.getByRole('textbox'), '新名称');
        await user.click(screen.getByRole('button', { name: /保存编辑/ }));

        expect(onSave).toHaveBeenCalledWith('cat-5', '新名称');
    });

    it('trim 后传给 onSave（去除首尾空格）', async () => {
        const user = userEvent.setup();
        const onSave = vi.fn();
        renderForm({ id: 'x', onSave, defaultName: '' });

        await user.type(screen.getByRole('textbox'), '  名称有空格  ');
        await user.click(screen.getByRole('button', { name: /保存编辑/ }));

        expect(onSave).toHaveBeenCalledWith('x', '名称有空格');
    });

    it('空字符串时不触发 onSave', async () => {
        const user = userEvent.setup();
        const onSave = vi.fn();
        renderForm({ defaultName: '', onSave });

        // 确保 input 为空
        await user.clear(screen.getByRole('textbox'));
        await user.click(screen.getByRole('button', { name: /保存编辑/ }));

        expect(onSave).not.toHaveBeenCalled();
    });

    it('空字符串时触发 showToast error（默认 emptyMsg）', async () => {
        const user = userEvent.setup();
        renderForm({ defaultName: '' });

        await user.clear(screen.getByRole('textbox'));
        await user.click(screen.getByRole('button', { name: /保存编辑/ }));

        expect(mockShowToast).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'error', message: '名称不能为空' }),
        );
    });

    it('仅空格时不触发 onSave', async () => {
        const user = userEvent.setup();
        const onSave = vi.fn();
        renderForm({ defaultName: '', onSave });

        await user.clear(screen.getByRole('textbox'));
        await user.type(screen.getByRole('textbox'), '   ');
        await user.click(screen.getByRole('button', { name: /保存编辑/ }));

        expect(onSave).not.toHaveBeenCalled();
    });
});

// ─── 3. 取消行为 ──────────────────────────────────────────────────────────────
describe('InlineEditForm – 取消行为', () => {
    it('点击取消触发 onCancel', async () => {
        const user = userEvent.setup();
        const onCancel = vi.fn();
        renderForm({ onCancel });
        await user.click(screen.getByRole('button', { name: /取消编辑/ }));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });
});

// ─── 4. 键盘交互 ──────────────────────────────────────────────────────────────
describe('InlineEditForm – 键盘交互', () => {
    beforeEach(() => mockShowToast.mockClear());

    it('Enter 键触发保存（有内容时调用 onSave）', async () => {
        const user = userEvent.setup();
        const onSave = vi.fn();
        renderForm({ id: 'k1', defaultName: '现有名称', onSave });

        screen.getByRole('textbox').focus();
        await user.keyboard('{Enter}');

        expect(onSave).toHaveBeenCalledWith('k1', '现有名称');
    });

    it('Enter 键空内容时不调用 onSave，调用 showToast', async () => {
        const user = userEvent.setup();
        const onSave = vi.fn();
        renderForm({ defaultName: '', onSave });

        const input = screen.getByRole('textbox');
        await user.clear(input);
        input.focus();
        await user.keyboard('{Enter}');

        expect(onSave).not.toHaveBeenCalled();
        expect(mockShowToast).toHaveBeenCalled();
    });

    it('Escape 键触发 onCancel', async () => {
        const user = userEvent.setup();
        const onCancel = vi.fn();
        renderForm({ onCancel });

        screen.getByRole('textbox').focus();
        await user.keyboard('{Escape}');

        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('Escape 键不触发 onSave', async () => {
        const user = userEvent.setup();
        const onSave = vi.fn();
        renderForm({ onSave, defaultName: '有内容' });

        screen.getByRole('textbox').focus();
        await user.keyboard('{Escape}');

        expect(onSave).not.toHaveBeenCalled();
    });
});

// ─── 5. 自定义文案 ─────────────────────────────────────────────────────────────
describe('InlineEditForm – 自定义文案', () => {
    beforeEach(() => mockShowToast.mockClear());

    it('自定义 emptyMsg 时 showToast 使用该消息', async () => {
        const user = userEvent.setup();
        renderForm({ defaultName: '', emptyMsg: '请填写分类名称' });

        await user.clear(screen.getByRole('textbox'));
        await user.click(screen.getByRole('button', { name: /保存编辑/ }));

        expect(mockShowToast).toHaveBeenCalledWith(
            expect.objectContaining({ message: '请填写分类名称' }),
        );
    });

    it('自定义 placeholder 生效', () => {
        renderForm({ placeholder: '输入部门名称' });
        expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', '输入部门名称');
    });

    it('input aria-label 包含 placeholder', () => {
        renderForm({ placeholder: '输入部门名称' });
        expect(screen.getByRole('textbox')).toHaveAttribute('aria-label', '编辑 输入部门名称');
    });
});

// ─── 6. React.memo ────────────────────────────────────────────────────────────
describe('InlineEditForm – React.memo', () => {
    it('InlineEditForm 是 React.memo 包裹的组件', () => {
        // memo 包裹的组件 $$typeof 包含 memo
        const asAny = InlineEditForm as unknown as { $$typeof?: symbol };
        expect(asAny.$$typeof?.toString()).toContain('memo');
    });
});

// ─── 7. fireEvent 直接输入变更 ────────────────────────────────────────────────
describe('InlineEditForm – fireEvent 输入变更', () => {
    beforeEach(() => mockShowToast.mockClear());

    it('onChange 后保存传入新值', () => {
        const onSave = vi.fn();
        renderForm({ id: 'fe-1', defaultName: '', onSave });

        fireEvent.change(screen.getByRole('textbox'), { target: { value: '新值' } });
        fireEvent.click(screen.getByRole('button', { name: /保存编辑/ }));

        expect(onSave).toHaveBeenCalledWith('fe-1', '新值');
    });
});
