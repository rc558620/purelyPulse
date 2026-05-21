import React, { memo, useEffect, useRef } from 'react';
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
    const stepRef = useRef<((timestamp: number) => void) | null>(null);

    useEffect(() => {
        const maxVelocity = 0.92;
        const startAcceleration = 0.044;
        const stopAcceleration = 0.0021;
        const minVelocity = 0.0009;

        const step = (timestamp: number): void => {
            const previousTimestamp = lastFrameTimeRef.current ?? timestamp - 16;
            const delta = Math.min(timestamp - previousTimestamp, 32);
            lastFrameTimeRef.current = timestamp;

            const targetVelocity = spinningRef.current ? maxVelocity : 0;
            const smoothingBase = spinningRef.current ? startAcceleration : stopAcceleration;
            const smoothing = 1 - Math.exp(-smoothingBase * delta);

            velocityRef.current += (targetVelocity - velocityRef.current) * smoothing;
            if (!spinningRef.current && Math.abs(velocityRef.current) < minVelocity) {
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
        };

        stepRef.current = step;

        if ((spinningRef.current || velocityRef.current > 0) && animationFrameRef.current === null) {
            animationFrameRef.current = window.requestAnimationFrame(step);
        }

        return () => {
            if (animationFrameRef.current !== null) {
                window.cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            stepRef.current = null;
            lastFrameTimeRef.current = null;
        };
    }, []);

    useEffect(() => {
        const relaunchVelocity = 0.52;
        const wasSpinning = wasSpinningRef.current;

        spinningRef.current = spinning;
        if (spinning && !wasSpinning) {
            velocityRef.current = Math.max(velocityRef.current, relaunchVelocity);
        }

        wasSpinningRef.current = spinning;

        if (animationFrameRef.current === null && stepRef.current && (spinning || velocityRef.current > 0)) {
            lastFrameTimeRef.current = null;
            animationFrameRef.current = window.requestAnimationFrame(stepRef.current);
        }
    }, [spinning]);

    useEffect(() => {
        const minBoostVelocity = 0.78;
        const boostVelocityCap = 1.26;
        const boostImpulse = 0.32;

        if (!hasMountedBoostRef.current) {
            hasMountedBoostRef.current = true;
            return;
        }

        if (!spinningRef.current && velocityRef.current <= 0) {
            return;
        }

        velocityRef.current = Math.min(
            boostVelocityCap,
            Math.max(velocityRef.current + boostImpulse, minBoostVelocity),
        );

        if (animationFrameRef.current === null && stepRef.current) {
            lastFrameTimeRef.current = null;
            animationFrameRef.current = window.requestAnimationFrame(stepRef.current);
        }
    }, [boostSignal]);

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
