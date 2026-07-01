import React, { memo, useEffect, useRef, useCallback } from 'react';
import { cx } from '@utils/utils';
import styles from './InertiaSpinner.module.less';

export type InertiaSpinnerSize = 'sm' | 'md' | 'lg';
export type InertiaSpinnerVariant = 'rainbow' | 'brand' | 'neutral';

export interface InertiaSpinnerProps {
    spinning: boolean;
    className?: string;
    size?: InertiaSpinnerSize;
    variant?: InertiaSpinnerVariant;
    icon?: React.ReactNode;
    boostSignal?: number;
    spinningLabel?: string;
    idleLabel?: string;
}

/** 动画引擎物理参数 */
const PHYSICS = {
    maxVelocity: 0.92,
    startAcceleration: 0.044,
    stopAcceleration: 0.0021,
    minVelocity: 0.0009,
    relaunchVelocity: 0.52,
    boostMinVelocity: 0.78,
    boostVelocityCap: 1.26,
    boostImpulse: 0.32,
} as const;

export const InertiaSpinner: React.FC<InertiaSpinnerProps> = memo(({
    spinning,
    className,
    size = 'md',
    variant = 'rainbow',
    icon,
    boostSignal,
    spinningLabel = '加载中',
    idleLabel = '已就绪',
}) => {
    const indicatorRef = useRef<HTMLSpanElement | null>(null);
    const spinningRef = useRef<boolean>(spinning);
    const hasCustomIcon = Boolean(icon);
    const wasSpinningRef = useRef<boolean>(spinning);
    const hasMountedBoostRef = useRef<boolean>(false);
    const rotationRef = useRef<number>(0);
    const velocityRef = useRef<number>(0);
    const lastFrameTimeRef = useRef<number | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    /** 动画步进函数 —— 定义在组件作用域，不依赖 Effect 闭包，避免 StrictMode 下 stepRef 为 null */
    const step = useCallback((timestamp: number): void => {
        const previousTimestamp = lastFrameTimeRef.current ?? timestamp - 16;
        const delta = Math.min(timestamp - previousTimestamp, 32);
        lastFrameTimeRef.current = timestamp;

        const targetVelocity = spinningRef.current ? PHYSICS.maxVelocity : 0;
        const smoothingBase = spinningRef.current ? PHYSICS.startAcceleration : PHYSICS.stopAcceleration;
        const smoothing = 1 - Math.exp(-smoothingBase * delta);

        velocityRef.current += (targetVelocity - velocityRef.current) * smoothing;
        if (!spinningRef.current && Math.abs(velocityRef.current) < PHYSICS.minVelocity) {
            velocityRef.current = 0;
        }

        rotationRef.current = (rotationRef.current + velocityRef.current * delta) % 360;
        if (indicatorRef.current) {
            indicatorRef.current.style.transform = `rotate(${rotationRef.current}deg)`;
        }

        if (spinningRef.current || velocityRef.current > 0) {
            animationFrameRef.current = window.requestAnimationFrame(step);
        } else {
            animationFrameRef.current = null;
            lastFrameTimeRef.current = null;
        }
    }, []);

    /** 确保动画帧运行（如果尚未运行则启动） */
    const ensureRunning = useCallback((): void => {
        if (animationFrameRef.current === null && (spinningRef.current || velocityRef.current > 0)) {
            lastFrameTimeRef.current = null;
            animationFrameRef.current = window.requestAnimationFrame(step);
        }
    }, [step]);

    // ─── 清理：组件卸载时取消动画帧 ─────────────────────────────────────────────
    useEffect(() => {
        return () => {
            if (animationFrameRef.current !== null) {
                window.cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            lastFrameTimeRef.current = null;
        };
    }, []);

    // ─── spinning 状态切换：驱动动画启动 / 停止 / 重启 ─────────────────────────
    useEffect(() => {
        const wasSpinning = wasSpinningRef.current;

        spinningRef.current = spinning;
        if (spinning && !wasSpinning) {
            velocityRef.current = Math.max(velocityRef.current, PHYSICS.relaunchVelocity);
        }

        wasSpinningRef.current = spinning;

        ensureRunning();
    }, [spinning, ensureRunning]);

    // ─── boostSignal：外部脉冲信号加速旋转 ───────────────────────────────────────
    useEffect(() => {
        if (!hasMountedBoostRef.current) {
            hasMountedBoostRef.current = true;
            return;
        }

        // 直接读取 spinning prop 而非 spinningRef.current，
        // 避免与 spinning Effect 执行顺序不确定导致读到过时值。
        if (!spinning && velocityRef.current <= 0) {
            return;
        }

        velocityRef.current = Math.min(
            PHYSICS.boostVelocityCap,
            Math.max(velocityRef.current + PHYSICS.boostImpulse, PHYSICS.boostMinVelocity),
        );

        ensureRunning();
    }, [boostSignal, spinning, ensureRunning]);

    return (
        <span
            ref={indicatorRef}
            className={cx(
                styles.spinner,
                styles[`size_${size}`],
                styles[`variant_${variant}`],
                hasCustomIcon && styles.spinnerCustom,
                spinning && styles.spinnerActive,
                className,
            )}
            aria-label={spinning ? spinningLabel : idleLabel}
            aria-live={spinning ? 'polite' : 'off'}
            role="status"
        >
            {hasCustomIcon ? (
                <span className={styles.customIcon} aria-hidden="true">{icon}</span>
            ) : null}
        </span>
    );
});

InertiaSpinner.displayName = 'InertiaSpinner';

export default InertiaSpinner;
