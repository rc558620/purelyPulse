/**
 * useForm Hook 单元测试
 *
 * 覆盖范围：
 *  - 初始状态
 *  - getFieldValue / setFieldValue（强类型 + 动态键）
 *  - registerField / unregisterField（含数据清理）
 *  - validateField（required / pattern / validator 三类规则）
 *  - validateFields（全量校验、dirty 标记、差量 notify）
 *  - validateSingleField（单字段校验，dirty 标记）
 *  - setFieldValue 对 dirty/non-dirty 字段的实时重校验 vs 直接清除
 *  - clearFieldError（有/无错误情况下的 notify 行为）
 *  - subscribeField（订阅 / 取消订阅）
 *  - reset（清空 store / errors / dirty，逐字段通知）
 *  - submit（无 Form 容器 / 有 Form 容器通过 __setSubmit 注入）
 *  - __setSubmit
 *  - 返回格式（数组第一项为 FormInstance）
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useForm } from '../useForm';
import type { FormContextType, FormInstance, FormValues, ValidatorRule } from '../types';

type TestFormInstance<T extends FormValues = Record<string, unknown>> = FormInstance<T> & Pick<
    FormContextType,
    'registerField' | 'unregisterField' | 'subscribeField'
>;

// ─── 辅助：渲染并拿到 formInstance ────────────────────────────────────────────
function setup<T extends FormValues = Record<string, unknown>>(): TestFormInstance<T> {
    const { result } = renderHook(() => useForm<T>());
    return result.current[0] as TestFormInstance<T>;
}

// ─── 1. 基本结构 ────────────────────────────────────────────────────────────
describe('useForm – 基本结构', () => {
    it('返回长度为 1 的数组', () => {
        const { result } = renderHook(() => useForm());
        expect(Array.isArray(result.current)).toBe(true);
        expect(result.current).toHaveLength(1);
    });

    it('formInstance 包含所有公开方法', () => {
        const form = setup();
        expect(typeof form.getFieldValue).toBe('function');
        expect(typeof form.setFieldValue).toBe('function');
        expect(typeof form.validateFields).toBe('function');
        expect(typeof form.validateSingleField).toBe('function');
        expect(typeof form.submit).toBe('function');
        expect(typeof form.getFieldError).toBe('function');
        expect(typeof form.reset).toBe('function');
        expect(typeof form.registerField).toBe('function');
        expect(typeof form.unregisterField).toBe('function');
    });

    it('初始时所有字段值和错误为 undefined', () => {
        const form = setup();
        expect(form.getFieldValue('anyKey')).toBeUndefined();
        expect(form.getFieldError('anyKey')).toBeUndefined();
    });
});

// ─── 2. getFieldValue / setFieldValue ────────────────────────────────────────
describe('useForm – getFieldValue / setFieldValue', () => {
    it('setFieldValue 后 getFieldValue 能读到最新值', () => {
        const form = setup();
        act(() => { form.setFieldValue('name', 'Alice'); });
        expect(form.getFieldValue('name')).toBe('Alice');
    });

    it('多个字段互不干扰', () => {
        const form = setup();
        act(() => {
            form.setFieldValue('a', 1);
            form.setFieldValue('b', 2);
        });
        expect(form.getFieldValue('a')).toBe(1);
        expect(form.getFieldValue('b')).toBe(2);
    });

    it('setFieldValue 会通知该字段的订阅者', () => {
        const form = setup();
        act(() => { form.registerField('x', []); });
        const listener = vi.fn();
        act(() => { form.subscribeField('x', listener); });
        act(() => { form.setFieldValue('x', 'hello'); });
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('setFieldValue 不会通知其他字段', () => {
        const form = setup();
        act(() => {
            form.registerField('a', []);
            form.registerField('b', []);
        });
        const listenerB = vi.fn();
        act(() => { form.subscribeField('b', listenerB); });
        act(() => { form.setFieldValue('a', 'v'); });
        expect(listenerB).not.toHaveBeenCalled();
    });
});

// ─── 3. registerField / unregisterField ──────────────────────────────────────
describe('useForm – registerField / unregisterField', () => {
    it('注册字段后可正常读取值', () => {
        const form = setup();
        act(() => { form.registerField('email', []); });
        act(() => { form.setFieldValue('email', 'test@test.com'); });
        expect(form.getFieldValue('email')).toBe('test@test.com');
    });

    it('unregisterField 后字段值被保留（支持条件渲染字段 re-mount 后回填）', () => {
        const form = setup();
        act(() => {
            form.registerField('phone', []);
            form.setFieldValue('phone', '13800138000');
        });
        act(() => { form.unregisterField('phone'); });
        // 值保留，以便条件渲染字段 re-mount 时仍能读到已回填的值
        expect(form.getFieldValue('phone')).toBe('13800138000');
    });

    it('unregisterField 后字段错误被清除', async () => {
        const form = setup();
        const rules: ValidatorRule[] = [{ required: true, message: '必填' }];
        act(() => { form.registerField('field', rules); });
        // 触发校验让字段出错
        await act(async () => {
            try { await form.validateFields(); } catch { /* expected */ }
        });
        expect(form.getFieldError('field')).toBe('必填');
        act(() => { form.unregisterField('field'); });
        expect(form.getFieldError('field')).toBeUndefined();
    });

    it('unregisterField 后 validateFields 不再校验该字段', async () => {
        const form = setup();
        const rules: ValidatorRule[] = [{ required: true, message: '必填' }];
        act(() => { form.registerField('field', rules); });
        act(() => { form.unregisterField('field'); });
        // 不应该抛出（字段已被移除）
        await act(async () => {
            const values = await form.validateFields();
            expect(values).toEqual({});
        });
    });

    it('unregisterField 清理订阅', () => {
        const form = setup();
        act(() => { form.registerField('f', []); });
        const listener = vi.fn();
        act(() => { form.subscribeField('f', listener); });
        act(() => { form.unregisterField('f'); });
        // 注销后设置值，订阅器不应再触发
        act(() => { form.setFieldValue('f', 'v'); });
        // subscribeField set 已被 delete，listener 不再被调用
        expect(listener).not.toHaveBeenCalled();
    });
});

// ─── 4. 校验规则 ──────────────────────────────────────────────────────────────
describe('useForm – 校验规则', () => {
    describe('required 规则', () => {
        it('值为 undefined 时报必填错误', async () => {
            const form = setup();
            const rules: ValidatorRule[] = [{ required: true, message: '请填写' }];
            act(() => { form.registerField('name', rules); });
            await act(async () => {
                await expect(form.validateFields()).rejects.toMatchObject({ name: '请填写' });
            });
        });

        it('值为空字符串时报必填错误', async () => {
            const form = setup();
            act(() => {
                form.registerField('name', [{ required: true, message: '不能为空' }]);
                form.setFieldValue('name', '');
            });
            await act(async () => {
                await expect(form.validateFields()).rejects.toMatchObject({ name: '不能为空' });
            });
        });

        it('值为空数组时报必填错误', async () => {
            const form = setup();
            act(() => {
                form.registerField('region', [{ required: true, message: '请选择地区' }]);
                form.setFieldValue('region', []);
            });
            await act(async () => {
                await expect(form.validateFields()).rejects.toMatchObject({ region: '请选择地区' });
            });
        });

        it('值为 null 时报必填错误', async () => {
            const form = setup();
            act(() => {
                form.registerField('name', [{ required: true, message: '不能为 null' }]);
                form.setFieldValue('name', null);
            });
            await act(async () => {
                await expect(form.validateFields()).rejects.toMatchObject({ name: '不能为 null' });
            });
        });

        it('值存在时通过 required 校验', async () => {
            const form = setup();
            act(() => {
                form.registerField('name', [{ required: true }]);
                form.setFieldValue('name', 'Alice');
            });
            await act(async () => {
                const values = await form.validateFields();
                expect(values).toMatchObject({ name: 'Alice' });
            });
        });

        it('required 校验失败使用默认 message', async () => {
            const form = setup();
            act(() => { form.registerField('f', [{ required: true }]); });
            await act(async () => {
                await expect(form.validateFields()).rejects.toMatchObject({ f: '该字段为必填项' });
            });
        });
    });

    describe('pattern 规则', () => {
        it('不符合正则时报错', async () => {
            const form = setup();
            act(() => {
                form.registerField('phone', [{ pattern: /^1[3-9]\d{9}$/, message: '手机号格式错误' }]);
                form.setFieldValue('phone', '123');
            });
            await act(async () => {
                await expect(form.validateFields()).rejects.toMatchObject({ phone: '手机号格式错误' });
            });
        });

        it('符合正则时通过', async () => {
            const form = setup();
            act(() => {
                form.registerField('phone', [{ pattern: /^1[3-9]\d{9}$/, message: '手机号格式错误' }]);
                form.setFieldValue('phone', '13800138000');
            });
            await act(async () => {
                const values = await form.validateFields();
                expect(values).toMatchObject({ phone: '13800138000' });
            });
        });

        it('非字符串值跳过 pattern 校验', async () => {
            const form = setup();
            act(() => {
                form.registerField('num', [{ pattern: /^\d+$/ }]);
                form.setFieldValue('num', 12345 as unknown as string);
            });
            await act(async () => {
                // 非字符串不触发 pattern，直接通过
                await expect(form.validateFields()).resolves.toMatchObject({ num: 12345 });
            });
        });

        it('pattern 校验失败使用默认 message', async () => {
            const form = setup();
            act(() => {
                form.registerField('f', [{ pattern: /^x$/ }]);
                form.setFieldValue('f', 'y');
            });
            await act(async () => {
                await expect(form.validateFields()).rejects.toMatchObject({ f: '字段格式不正确' });
            });
        });
    });

    describe('validator 规则', () => {
        it('validator 抛出 Error 实例时报错', async () => {
            const form = setup();
            act(() => {
                form.registerField('age', [
                    {
                        validator: async (val: unknown) => {
                            if ((val as number) < 18) throw new Error('年龄不足18岁');
                        },
                    },
                ]);
                form.setFieldValue('age', 16);
            });
            await act(async () => {
                await expect(form.validateFields()).rejects.toMatchObject({ age: '年龄不足18岁' });
            });
        });

        it('validator 抛出字符串时报错', async () => {
            const form = setup();
            act(() => {
                form.registerField('code', [
                    {
                        validator: async () => { throw '验证码错误'; },
                    },
                ]);
                form.setFieldValue('code', 'wrong');
            });
            await act(async () => {
                await expect(form.validateFields()).rejects.toMatchObject({ code: '验证码错误' });
            });
        });

        it('validator 抛出非 Error 非字符串时用 rule.message', async () => {
            const form = setup();
            act(() => {
                form.registerField('f', [
                    {
                        message: '自定义 fallback',
                        validator: async () => { throw { code: 500 }; },
                    },
                ]);
                form.setFieldValue('f', 'v');
            });
            await act(async () => {
                await expect(form.validateFields()).rejects.toMatchObject({ f: '自定义 fallback' });
            });
        });

        it('validator 抛出非 Error 非字符串且无 rule.message 时使用默认文案', async () => {
            const form = setup();
            act(() => {
                form.registerField('f', [
                    {
                        validator: async () => { throw 42; },
                    },
                ]);
                form.setFieldValue('f', 'v');
            });
            await act(async () => {
                await expect(form.validateFields()).rejects.toMatchObject({ f: '字段校验失败' });
            });
        });

        it('validator 通过（resolve）时字段校验通过', async () => {
            const form = setup();
            act(() => {
                form.registerField('email', [
                    { validator: async (val: unknown) => { if (!(val as string).includes('@')) throw new Error('邮箱格式错误'); } },
                ]);
                form.setFieldValue('email', 'a@b.com');
            });
            await act(async () => {
                await expect(form.validateFields()).resolves.toMatchObject({ email: 'a@b.com' });
            });
        });

        it('同步 validator（无 async）抛错也会被捕获', async () => {
            const form = setup();
            act(() => {
                form.registerField('sync', [
                    { validator: () => { throw new Error('同步报错'); } },
                ]);
                form.setFieldValue('sync', 'x');
            });
            await act(async () => {
                await expect(form.validateFields()).rejects.toMatchObject({ sync: '同步报错' });
            });
        });
    });

    describe('规则组合', () => {
        it('required + pattern：先报 required', async () => {
            const form = setup();
            act(() => {
                form.registerField('p', [
                    { required: true, message: '必填' },
                    { pattern: /^\d+$/, message: '只能数字' },
                ]);
            });
            await act(async () => {
                await expect(form.validateFields()).rejects.toMatchObject({ p: '必填' });
            });
        });

        it('required 通过、pattern 失败：报 pattern', async () => {
            const form = setup();
            act(() => {
                form.registerField('p', [
                    { required: true, message: '必填' },
                    { pattern: /^\d+$/, message: '只能数字' },
                ]);
                form.setFieldValue('p', 'abc');
            });
            await act(async () => {
                await expect(form.validateFields()).rejects.toMatchObject({ p: '只能数字' });
            });
        });

        it('全部规则通过', async () => {
            const form = setup();
            act(() => {
                form.registerField('p', [
                    { required: true, message: '必填' },
                    { pattern: /^\d+$/, message: '只能数字' },
                ]);
                form.setFieldValue('p', '123');
            });
            await act(async () => {
                await expect(form.validateFields()).resolves.toMatchObject({ p: '123' });
            });
        });
    });
});

// ─── 5. validateFields ────────────────────────────────────────────────────────
describe('useForm – validateFields', () => {
    it('无注册字段时直接返回空对象', async () => {
        const form = setup();
        await act(async () => {
            const values = await form.validateFields();
            expect(values).toEqual({});
        });
    });

    it('所有字段通过时返回完整 store', async () => {
        const form = setup();
        act(() => {
            form.registerField('a', [{ required: true }]);
            form.registerField('b', []);
            form.setFieldValue('a', 'x');
            form.setFieldValue('b', 'y');
        });
        await act(async () => {
            const values = await form.validateFields();
            expect(values).toEqual({ a: 'x', b: 'y' });
        });
    });

    it('部分字段失败时抛出 errors 对象（只含失败字段）', async () => {
        const form = setup();
        act(() => {
            form.registerField('good', [{ required: true }]);
            form.registerField('bad', [{ required: true, message: '必填' }]);
            form.setFieldValue('good', 'ok');
        });
        await act(async () => {
            await expect(form.validateFields()).rejects.toEqual({ bad: '必填' });
        });
    });

    it('校验后错误状态被写入 errorsRef，getFieldError 可读取', async () => {
        const form = setup();
        act(() => { form.registerField('f', [{ required: true, message: 'err' }]); });
        await act(async () => {
            try { await form.validateFields(); } catch { /* expected */ }
        });
        expect(form.getFieldError('f')).toBe('err');
    });

    it('validateFields 将所有字段标记为 dirty', async () => {
        const form = setup();
        act(() => {
            form.registerField('f', [{ required: true, message: 'err' }]);
        });
        await act(async () => {
            try { await form.validateFields(); } catch { /* expected */ }
        });
        // dirty 之后 setFieldValue 会重新校验（能清除错误）
        act(() => { form.setFieldValue('f', 'valid'); });
        // 等待 async 校验 resolve
        await act(async () => { await Promise.resolve(); });
        expect(form.getFieldError('f')).toBeUndefined();
    });

    it('多个字段同时失败，所有失败字段都在 rejects 中', async () => {
        const form = setup();
        act(() => {
            form.registerField('a', [{ required: true, message: 'a-err' }]);
            form.registerField('b', [{ required: true, message: 'b-err' }]);
        });
        await act(async () => {
            await expect(form.validateFields()).rejects.toEqual({ a: 'a-err', b: 'b-err' });
        });
    });

    it('通过之后再次 validateFields 重置错误', async () => {
        const form = setup();
        act(() => { form.registerField('f', [{ required: true, message: 'err' }]); });
        // 第一次：失败
        await act(async () => {
            try { await form.validateFields(); } catch { /* expected */ }
        });
        expect(form.getFieldError('f')).toBe('err');
        // 修正后第二次：通过
        act(() => { form.setFieldValue('f', 'ok'); });
        await act(async () => { await form.validateFields(); });
        expect(form.getFieldError('f')).toBeUndefined();
    });
});

// ─── 6. validateSingleField ──────────────────────────────────────────────────
describe('useForm – validateSingleField', () => {
    it('字段通过时返回 true', async () => {
        const form = setup();
        act(() => {
            form.registerField('f', [{ required: true }]);
            form.setFieldValue('f', 'ok');
        });
        await act(async () => {
            const result = await form.validateSingleField('f');
            expect(result).toBe(true);
        });
    });

    it('字段失败时返回 false 并写入错误', async () => {
        const form = setup();
        act(() => { form.registerField('f', [{ required: true, message: '必填' }]); });
        await act(async () => {
            const result = await form.validateSingleField('f');
            expect(result).toBe(false);
        });
        expect(form.getFieldError('f')).toBe('必填');
    });

    it('validateSingleField 将字段标记为 dirty', async () => {
        const form = setup();
        act(() => { form.registerField('f', [{ required: true, message: 'err' }]); });
        await act(async () => { await form.validateSingleField('f'); });
        // dirty 后 setFieldValue 实时重校验
        act(() => { form.setFieldValue('f', 'good'); });
        await act(async () => { await Promise.resolve(); });
        expect(form.getFieldError('f')).toBeUndefined();
    });

    it('未注册的字段也能调用（无规则，视为通过）', async () => {
        const form = setup();
        await act(async () => {
            const result = await form.validateSingleField('unknown');
            expect(result).toBe(true);
        });
    });

    it('同一字段重复单字段校验，错误信息不重复通知（相同 error 不再触发 notify）', async () => {
        const form = setup();
        act(() => { form.registerField('f', [{ required: true, message: 'err' }]); });
        const listener = vi.fn();
        act(() => { form.subscribeField('f', listener); });
        // 第一次：触发通知（error undefined -> 'err'）
        await act(async () => { await form.validateSingleField('f'); });
        const firstCount = listener.mock.calls.length;
        // 第二次：同样是 err，不再通知
        await act(async () => { await form.validateSingleField('f'); });
        expect(listener.mock.calls.length).toBe(firstCount); // 没有新调用
    });
});

// ─── 7. setFieldValue 对 dirty/非 dirty 字段的行为 ──────────────────────────
describe('useForm – setFieldValue dirty 策略', () => {
    it('非 dirty 字段 setFieldValue 直接清除错误（不重校验）', async () => {
        const form = setup();
        act(() => {
            form.registerField('f', [{ required: true, message: 'err' }]);
        });
        // 手动触发全量校验以设置错误（但不把字段设为dirty）
        // 注意：validateFields 会设为 dirty，故直接测试无 dirty 时的清除
        // 方案：手动"模拟"有错误但字段未 dirty（不走 validateFields）
        // 因为 setFieldValue 在非 dirty 时调用 clearFieldError，我们验证 clearFieldError 行为
        // 先通过 validateFields 写入错误（也 dirty），然后 reset 清理 dirty，再 setFieldValue
        await act(async () => {
            try { await form.validateFields(); } catch { /* expected */ }
        });
        // 清掉 dirty（用 reset 再重新注册）
        act(() => {
            form.reset();
            form.registerField('f', [{ required: true, message: 'err' }]);
        });
        // 此时不是 dirty；setFieldValue 应清除错误
        act(() => { form.setFieldValue('f', ''); });
        await act(async () => { await Promise.resolve(); });
        // 非 dirty 时直接清错（clearFieldError），不会写入新错误
        expect(form.getFieldError('f')).toBeUndefined();
    });

    it('dirty 字段 setFieldValue 后值正确且重校验清除错误', async () => {
        const form = setup();
        act(() => {
            form.registerField('f', [{ required: true, message: 'err' }]);
        });
        await act(async () => {
            try { await form.validateFields(); } catch { /* expected */ }
        });
        // 现在 f 是 dirty 且有错误
        act(() => { form.setFieldValue('f', 'valid'); });
        await act(async () => { await Promise.resolve(); });
        expect(form.getFieldError('f')).toBeUndefined();
        expect(form.getFieldValue('f')).toBe('valid');
    });

    it('dirty 字段 setFieldValue 为空值时重新报错', async () => {
        const form = setup();
        act(() => {
            form.registerField('f', [{ required: true, message: '不能为空' }]);
            form.setFieldValue('f', 'valid');
        });
        await act(async () => { await form.validateFields(); });
        // dirty + 通过。现在清空
        act(() => { form.setFieldValue('f', ''); });
        await act(async () => { await Promise.resolve(); });
        expect(form.getFieldError('f')).toBe('不能为空');
    });
});

// ─── 8. subscribeField ────────────────────────────────────────────────────────
describe('useForm – subscribeField', () => {
    it('订阅后收到通知', () => {
        const form = setup();
        act(() => { form.registerField('f', []); });
        const listener = vi.fn();
        act(() => { form.subscribeField('f', listener); });
        act(() => { form.setFieldValue('f', 'x'); });
        expect(listener).toHaveBeenCalled();
    });

    it('取消订阅后不再收到通知', () => {
        const form = setup();
        act(() => { form.registerField('f', []); });
        const listener = vi.fn();
        let unsubscribe: (() => void) | undefined;
        act(() => { unsubscribe = form.subscribeField('f', listener); });
        act(() => { unsubscribe?.(); });
        act(() => { form.setFieldValue('f', 'x'); });
        expect(listener).not.toHaveBeenCalled();
    });

    it('同一字段多个订阅者都收到通知', () => {
        const form = setup();
        act(() => { form.registerField('f', []); });
        const l1 = vi.fn();
        const l2 = vi.fn();
        act(() => {
            form.subscribeField('f', l1);
            form.subscribeField('f', l2);
        });
        act(() => { form.setFieldValue('f', 'x'); });
        expect(l1).toHaveBeenCalled();
        expect(l2).toHaveBeenCalled();
    });

    it('取消一个订阅不影响其他订阅者', () => {
        const form = setup();
        act(() => { form.registerField('f', []); });
        const l1 = vi.fn();
        const l2 = vi.fn();
        let unsubscribe: (() => void) | undefined;
        act(() => {
            unsubscribe = form.subscribeField('f', l1);
            form.subscribeField('f', l2);
        });
        act(() => { unsubscribe?.(); });
        act(() => { form.setFieldValue('f', 'x'); });
        expect(l1).not.toHaveBeenCalled();
        expect(l2).toHaveBeenCalled();
    });

    it('订阅不存在的字段不会抛错', () => {
        const form = setup();
        const listener = vi.fn();
        expect(() => {
            act(() => { form.subscribeField('nonexistent', listener); });
        }).not.toThrow();
    });
});

// ─── 9. reset ────────────────────────────────────────────────────────────────
describe('useForm – reset', () => {
    it('reset 清空所有字段值', async () => {
        const form = setup();
        act(() => {
            form.registerField('a', []);
            form.registerField('b', []);
            form.setFieldValue('a', '1');
            form.setFieldValue('b', '2');
        });
        act(() => { form.reset(); });
        expect(form.getFieldValue('a')).toBeUndefined();
        expect(form.getFieldValue('b')).toBeUndefined();
    });

    it('reset 清空所有错误', async () => {
        const form = setup();
        act(() => { form.registerField('f', [{ required: true, message: 'err' }]); });
        await act(async () => {
            try { await form.validateFields(); } catch { /* expected */ }
        });
        expect(form.getFieldError('f')).toBe('err');
        act(() => { form.reset(); });
        expect(form.getFieldError('f')).toBeUndefined();
    });

    it('reset 通知所有有值或有错的字段', async () => {
        const form = setup();
        act(() => {
            form.registerField('a', []);
            form.registerField('b', [{ required: true, message: 'err' }]);
            form.setFieldValue('a', 'x');
        });
        await act(async () => {
            try { await form.validateFields(); } catch { /* expected */ }
        });

        const lA = vi.fn();
        const lB = vi.fn();
        act(() => {
            form.subscribeField('a', lA);
            form.subscribeField('b', lB);
        });
        act(() => { form.reset(); });
        expect(lA).toHaveBeenCalled();
        expect(lB).toHaveBeenCalled();
    });

    it('reset 后 dirty 状态被清除（setFieldValue 不再重校验）', async () => {
        const form = setup();
        act(() => { form.registerField('f', [{ required: true, message: 'err' }]); });
        await act(async () => {
            try { await form.validateFields(); } catch { /* expected */ }
        });
        act(() => { form.reset(); });
        // 重新注册，设空值（非 dirty 时清错，不重校验）
        act(() => {
            form.registerField('f', [{ required: true, message: 'err' }]);
            form.setFieldValue('f', '');
        });
        await act(async () => { await Promise.resolve(); });
        // 非 dirty：clearFieldError 而不是重校验，所以不会有新错误
        expect(form.getFieldError('f')).toBeUndefined();
    });
});

// ─── 10. submit ──────────────────────────────────────────────────────────────
describe('useForm – submit', () => {
    it('无 Form 容器时 submit 执行全量校验但忽略异常', async () => {
        const form = setup();
        act(() => { form.registerField('f', [{ required: true }]); });
        // 不应该抛出
        await act(async () => {
            await expect(form.submit()).resolves.toBeUndefined();
        });
    });

    it('无 Form 容器、有 event 时调用 e.preventDefault', async () => {
        const form = setup();
        const mockEvent = { preventDefault: vi.fn() };
        await act(async () => {
            await form.submit(mockEvent as unknown as import('react').FormEvent);
        });
        expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
    });

    it('注入 __setSubmit 后 submit 调用注入函数', async () => {
        const { result } = renderHook(() => useForm());
        const form = result.current[0] as ReturnType<typeof useForm>[0] & {
            __setSubmit: (fn: () => Promise<void>) => void;
        };
        const injectedSubmit = vi.fn().mockResolvedValue(undefined);
        act(() => { form.__setSubmit(injectedSubmit); });
        await act(async () => { await form.submit(); });
        expect(injectedSubmit).toHaveBeenCalledTimes(1);
    });

    it('注入 __setSubmit 后 submit 透传 event 参数', async () => {
        const { result } = renderHook(() => useForm());
        const form = result.current[0] as ReturnType<typeof useForm>[0] & {
            __setSubmit: (fn: (e?: unknown) => Promise<void>) => void;
        };
        const injectedSubmit = vi.fn().mockResolvedValue(undefined);
        act(() => { form.__setSubmit(injectedSubmit); });
        const mockEvent = { preventDefault: vi.fn() };
        await act(async () => {
            await form.submit(mockEvent as unknown as import('react').FormEvent);
        });
        expect(injectedSubmit).toHaveBeenCalledWith(mockEvent);
    });
});

// ─── 11. getFieldError ───────────────────────────────────────────────────────
describe('useForm – getFieldError', () => {
    it('无错误时返回 undefined', () => {
        const form = setup();
        act(() => { form.registerField('f', []); });
        expect(form.getFieldError('f')).toBeUndefined();
    });

    it('校验失败后返回错误文案', async () => {
        const form = setup();
        act(() => { form.registerField('f', [{ required: true, message: '必填' }]); });
        await act(async () => {
            try { await form.validateFields(); } catch { /* expected */ }
        });
        expect(form.getFieldError('f')).toBe('必填');
    });

    it('校验通过后返回 undefined', async () => {
        const form = setup();
        act(() => {
            form.registerField('f', [{ required: true, message: '必填' }]);
            form.setFieldValue('f', 'ok');
        });
        await act(async () => { await form.validateFields(); });
        expect(form.getFieldError('f')).toBeUndefined();
    });
});
