import React, { memo, useRef, useCallback, useTransition } from 'react';
import styles from './Search.module.less';
import { cx } from '@utils/utils';

interface SearchProps {
    value: string;
    onChange: (value: string) => void;
    onClear: () => void;
    placeholder?: string;
    className?: string;
}

export const Search: React.FC<SearchProps> = memo(({
    value,
    onChange,
    onClear,
    placeholder = '搜索...',
    className,
}) => {
    const isComposingRef = useRef(false);
    const [isPending, startTransition] = useTransition();

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (isComposingRef.current) {
            // 中文输入法组合中：直接更新，不走 transition，避免打断 IME
            onChange(val);
        } else {
            // 英文/组合结束后：走 transition，列表过滤低优先级渲染
            startTransition(() => onChange(val));
        }
    }, [onChange]);

    const handleCompositionStart = useCallback(() => {
        isComposingRef.current = true;
    }, []);

    const handleCompositionEnd = useCallback((e: React.CompositionEvent<HTMLInputElement>) => {
        isComposingRef.current = false;
        // 组合结束，用最终值走一次 transition
        startTransition(() => onChange(e.currentTarget.value));
    }, [onChange]);

    return (
        <div className={cx(styles.searchBar, isPending && styles.searchBarPending, className)}>
            <div className={styles.searchIcon}>
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                </svg>
            </div>

            <input
                className={styles.searchInput}
                placeholder={placeholder}
                value={value}
                onChange={handleChange}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
            />

            {value && (
                <button className={styles.clearBtn} onClick={onClear}>
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            )}
        </div>
    );
});

Search.displayName = 'Search';
