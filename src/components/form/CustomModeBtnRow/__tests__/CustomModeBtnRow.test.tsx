/**
 * CustomModeBtnRow 组件单元测试
 *
 * 覆盖范围：
 *  - 两个按钮都渲染
 *  - 按钮文案：选择年月日 / 日期范围
 *  - extraBtnText 正确展示
 *  - isCustomDate 激活态 class 与 aria-pressed
 *  - isCustomRange 激活态 class 与 aria-pressed
 *  - 点击「选择年月日」触发 onToggleCustomDate
 *  - 点击「日期范围」触发 onToggleCustomRange
 *  - 两个回调互不干扰
 *  - button type 为 "button"（防止意外 submit）
 *  - aria-label 属性
 *  - displayName
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomModeBtnRow from '../CustomModeBtnRow';

// ─── 辅助：渲染默认 props ────────────────────────────────────────────────────

function renderDefault(overrides?: Partial<Parameters<typeof CustomModeBtnRow>[0]>) {
    return render(
        <CustomModeBtnRow
            isCustomDate={false}
            isCustomRange={false}
            extraBtnText="选择年月日"
            onToggleCustomDate={vi.fn()}
            onToggleCustomRange={vi.fn()}
            {...overrides}
        />,
    );
}

// ─── 1. 基本渲染 ─────────────────────────────────────────────────────────────

describe('CustomModeBtnRow – 基本渲染', () => {
    it('渲染两个按钮', () => {
        renderDefault();
        expect(screen.getAllByRole('button')).toHaveLength(2);
    });

    it('「选择年月日」按钮有正确 aria-label', () => {
        renderDefault();
        expect(screen.getByRole('button', { name: '选择年月日' })).toBeInTheDocument();
    });

    it('「日期范围」按钮有正确 aria-label', () => {
        renderDefault();
        expect(screen.getByRole('button', { name: '选择日期范围' })).toBeInTheDocument();
    });

    it('「日期范围」按钮显示文字"日期范围"', () => {
        renderDefault();
        expect(screen.getByText('日期范围')).toBeInTheDocument();
    });

    it('displayName 为 CustomModeBtnRow', () => {
        expect(CustomModeBtnRow.displayName).toBe('CustomModeBtnRow');
    });
});

// ─── 2. extraBtnText ─────────────────────────────────────────────────────────

describe('CustomModeBtnRow – extraBtnText', () => {
    it('extraBtnText 默认文案正确展示', () => {
        renderDefault({ extraBtnText: '选择年月日' });
        expect(screen.getByText('选择年月日')).toBeInTheDocument();
    });

    it('extraBtnText 为已选日期时展示日期', () => {
        renderDefault({ extraBtnText: '2024/03/15' });
        expect(screen.getByText('2024/03/15')).toBeInTheDocument();
    });
});

// ─── 3. 激活态（isCustomDate / isCustomRange） ───────────────────────────────

describe('CustomModeBtnRow – 激活态', () => {
    it('isCustomDate=true 时「选择年月日」按钮含 active class 且 aria-pressed=true', () => {
        renderDefault({ isCustomDate: true });
        const btn = screen.getByRole('button', { name: '选择年月日' });
        expect(btn.className).toMatch(/active/i);
        expect(btn).toHaveAttribute('aria-pressed', 'true');
    });

    it('isCustomDate=false 时「选择年月日」按钮不含 active class 且 aria-pressed=false', () => {
        renderDefault({ isCustomDate: false });
        const btn = screen.getByRole('button', { name: '选择年月日' });
        expect(btn.className).not.toMatch(/active/i);
        expect(btn).toHaveAttribute('aria-pressed', 'false');
    });

    it('isCustomRange=true 时「日期范围」按钮含 active class 且 aria-pressed=true', () => {
        renderDefault({ isCustomRange: true });
        const btn = screen.getByRole('button', { name: '选择日期范围' });
        expect(btn.className).toMatch(/active/i);
        expect(btn).toHaveAttribute('aria-pressed', 'true');
    });

    it('isCustomRange=false 时「日期范围」按钮不含 active class 且 aria-pressed=false', () => {
        renderDefault({ isCustomRange: false });
        const btn = screen.getByRole('button', { name: '选择日期范围' });
        expect(btn.className).not.toMatch(/active/i);
        expect(btn).toHaveAttribute('aria-pressed', 'false');
    });
});

// ─── 4. 点击回调 ─────────────────────────────────────────────────────────────

describe('CustomModeBtnRow – 点击回调', () => {
    it('点击「选择年月日」触发 onToggleCustomDate', async () => {
        const user = userEvent.setup();
        const onToggleCustomDate = vi.fn();
        renderDefault({ onToggleCustomDate });
        await user.click(screen.getByRole('button', { name: '选择年月日' }));
        expect(onToggleCustomDate).toHaveBeenCalledTimes(1);
    });

    it('点击「日期范围」触发 onToggleCustomRange', async () => {
        const user = userEvent.setup();
        const onToggleCustomRange = vi.fn();
        renderDefault({ onToggleCustomRange });
        await user.click(screen.getByRole('button', { name: '选择日期范围' }));
        expect(onToggleCustomRange).toHaveBeenCalledTimes(1);
    });

    it('点击「选择年月日」不触发 onToggleCustomRange', async () => {
        const user = userEvent.setup();
        const onToggleCustomRange = vi.fn();
        renderDefault({ onToggleCustomRange });
        await user.click(screen.getByRole('button', { name: '选择年月日' }));
        expect(onToggleCustomRange).not.toHaveBeenCalled();
    });

    it('点击「日期范围」不触发 onToggleCustomDate', async () => {
        const user = userEvent.setup();
        const onToggleCustomDate = vi.fn();
        renderDefault({ onToggleCustomDate });
        await user.click(screen.getByRole('button', { name: '选择日期范围' }));
        expect(onToggleCustomDate).not.toHaveBeenCalled();
    });
});

// ─── 5. button type ──────────────────────────────────────────────────────────

describe('CustomModeBtnRow – button type', () => {
    it('两个按钮 type 均为 "button"（防止意外触发表单提交）', () => {
        renderDefault();
        const buttons = screen.getAllByRole('button');
        buttons.forEach(btn => expect(btn).toHaveAttribute('type', 'button'));
    });
});
