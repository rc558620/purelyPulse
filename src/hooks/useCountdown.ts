// 验证码倒计时 Hook，统一替代 useRegisterForm / forgotPassword 中重复的倒计时逻辑。
import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseCountdownReturn {
    /** 剩余秒数（0 表示未开始或已结束）。 */
    countdown: number;
    /** 是否处于倒计时中（用于禁用发送按钮）。 */
    isActive: boolean;
    /** 启动倒计时（指定秒数，默认 60s）。 */
    start: (seconds?: number) => void;
}

/**
 * 验证码倒计时 Hook。
 *
 * 统一替代 useRegisterForm / forgotPassword 中重复定义的：
 * - `countdown` state
 * - `countdownRef` ref（防闭包）
 * - `useEffect` 定时器
 *
 * 设计说明：
 * - `countdownRef` 保存最新 countdown，供调用方通过 `isActive` 判断是否跳过发送，
 *   无需将 countdown 列入外部 useCallback deps，避免倒计时每秒触发子组件重建。
 * - `start` 使用 useCallback 包装，deps 为空，整个 Hook 生命周期引用稳定。
 */
export const useCountdown = (): UseCountdownReturn => {
    const [countdown, setCountdown] = useState(0);

    /**
     * 保存最新 countdown 的 ref，供 start 校验是否重复触发。
     * 避免将 countdown state 列入 start 的 deps，
     * 保证 start 引用在倒计时期间保持稳定。
     */
    const countdownRef = useRef(countdown);
    useEffect(() => {
        countdownRef.current = countdown;
    }, [countdown]);

    // 每秒递减定时器
    useEffect(() => {
        if (countdown <= 0) {
            return undefined;
        }

        const timer = window.setTimeout(() => {
            setCountdown(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => {
            window.clearTimeout(timer);
        };
    }, [countdown]);

    /**
     * 启动倒计时。
     * @param seconds - 倒计时秒数，默认 60。
     */
    const start = useCallback((seconds = 60): void => {
        if (countdownRef.current > 0) {
            return;
        }
        setCountdown(seconds);
    }, []);

    return {
        countdown,
        isActive: countdown > 0,
        start,
    };
};
