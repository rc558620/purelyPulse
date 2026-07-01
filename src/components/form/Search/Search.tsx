import React, { memo, useRef, useCallback, useDeferredValue } from 'react';
import styles from './Search.module.less';
import { cx } from '@utils/utils';
import { SearchIcon, CloseIcon } from '@components/form/_shared/icons';

interface SearchProps {
    value: string;
    onChange: (value: string) => void;
    onClear: () => void;
    placeholder?: string;
    className?: string;
    /** 无障碍标签，默认 "搜索" */
    ariaLabel?: string;
}

export const Search: React.FC<SearchProps> = memo(({
    value,
    onChange,
    onClear,
    placeholder = '搜索...',
    className,
    ariaLabel = '搜索',
}) => {
    const isComposingRef = useRef(false);
    // Bug9: 用 useDeferredValue 替代 useTransition，避免 startTransition 导致的
    // opacity 闪烁和低优先级渲染中断输入响应。父组件可用
    // const deferredSearch = useDeferredValue(searchText) 来延迟列表过滤，
    // Search 自身不再承担 transition 职责，输入框始终高优先级响应。
    const deferredValue = useDeferredValue(value);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (isComposingRef.current) {
            // 中文输入法组合中：直接更新，不走 transition，避免打断 IME
            onChange(val);
        } else {
            // Bug1 修复：非组合期间直接调用 onChange，不再用 startTransition 包裹。
            // transition 职责交给父组件（通过 useDeferredValue 延迟过滤），
            // 避免 compositionEnd 后 change 事件和 handleCompositionEnd 重复触发。
            onChange(val);
        }
    }, [onChange]);

    const handleCompositionStart = useCallback(() => {
        isComposingRef.current = true;
    }, []);

    const handleCompositionEnd = useCallback(() => {
        isComposingRef.current = false;
        // Bug1 修复：组合结束后不再在这里主动调用 onChange。
        // 浏览器在 compositionEnd 之后会自动触发一个 change 事件，
        // handleChange 会处理该事件（此时 isComposingRef 已为 false，走直接调用路径）。
        // 之前这里额外调用一次 onChange 导致重复触发。
    }, []);

    // 用 deferredValue 来判断是否展示 pending 样式（轻量指示，无 opacity 闪烁）
    const isPending = deferredValue !== value;

    return (
        <div className={cx(styles.searchBar, isPending && styles.searchBarPending, className)}>
            <div className={styles.searchIcon}>
                <SearchIcon />
            </div>

            {/* Bug4: type="search" + enterKeyHint + autoComplete/autoCorrect/spellCheck */}
            {/* Bug5: aria-label 无障碍标签 */}
            <input
                type="search"
                className={styles.searchInput}
                placeholder={placeholder}
                value={value}
                onChange={handleChange}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                enterKeyHint="search"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                aria-label={ariaLabel}
            />

            {/* Bug7: type="button" 防止在 form 内意外触发 submit */}
            {value && (
                <button type="button" className={styles.clearBtn} onClick={onClear}>
                    <CloseIcon />
                </button>
            )}
        </div>
    );
});

Search.displayName = 'Search';
