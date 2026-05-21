import React, { memo, useRef, useCallback, useTransition } from 'react';
import styles from './Search.module.less';
import { cx } from '@utils/utils';
import { SearchIcon, CloseIcon } from '@components/form/_shared/icons';

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
                <SearchIcon />
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
                    <CloseIcon />
                </button>
            )}
        </div>
    );
});

Search.displayName = 'Search';
