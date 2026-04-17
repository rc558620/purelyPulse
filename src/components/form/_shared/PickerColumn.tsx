// PickerColumn — 滚轮选择列（通用）
// 供 MonthPicker / DayPicker 共用，渲染一列可滚动的数字选项。
//
// 设计特征：
//   - 选中项居中高亮（配合 .columnHighlight 伪元素）
//   - scroll-snap 保证惰性滚动自动对齐
//   - scroll 防抖（120ms）→ onSelect 回调
//   - items 变化时自动 clamp 并重新滚动对齐（DayPicker 日期列适用）
//   - 点击任意项即时跳转
import {
  useCallback,
  useEffect,
  useRef,
  memo,
} from 'react';
import classNames from 'classnames';
import { pad2 } from './pickerUtils';

export const PICKER_ITEM_H = 44; // px，与 Less 变量 @item-h 保持一致

export interface PickerColumnProps<T extends number> {
  items:      T[];
  selected:   T;
  onSelect:   (val: T) => void;
  label:      string;
  formatItem?: (n: T) => string;
  /** CSS Modules 样式映射，由父组件注入（column / columnLabel / columnListWrap /
   *  columnHighlight / columnList / columnPad / columnItem / columnItemSelected） */
  styles: Record<string, string>;
}

function PickerColumn<T extends number>({
  items,
  selected,
  onSelect,
  label,
  formatItem,
  styles,
}: PickerColumnProps<T>) {
  const listRef = useRef<HTMLUListElement>(null);

  const scrollTo = useCallback((idx: number, behavior: ScrollBehavior = 'smooth') => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: idx * PICKER_ITEM_H, behavior });
  }, []);

  // 首次挂载：瞬间跳到当前选中项（无动画，避免初始闪烁）
  useEffect(() => {
    const idx = items.indexOf(selected);
    if (idx >= 0) scrollTo(idx, 'instant' as ScrollBehavior);
    // 仅在 mount 时执行一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // selected 或 items 变化时平滑滚动
  // items 变化（如 DayPicker 月份切换导致天数减少）时取最后一项作 fallback
  useEffect(() => {
    const idx      = items.indexOf(selected);
    const fallback = items.length - 1;
    scrollTo(idx >= 0 ? idx : fallback, 'smooth');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, items]);

  // 滚动停止后（防抖 120ms）对齐并回调
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleScroll = useCallback(() => {
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      const el = listRef.current;
      if (!el) return;
      const idx     = Math.round(el.scrollTop / PICKER_ITEM_H);
      const clamped = Math.max(0, Math.min(idx, items.length - 1));
      onSelect(items[clamped] as T);
      scrollTo(clamped, 'smooth');
    }, 120);
  }, [items, onSelect, scrollTo]);

  // 卸载时清除防抖计时器
  useEffect(() => () => {
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
  }, []);

  return (
    <div className={styles.column}>
      <div className={styles.columnLabel}>{label}</div>
      <div className={styles.columnListWrap}>
        <div className={styles.columnHighlight} aria-hidden="true" />
        <ul
          ref={listRef}
          className={styles.columnList}
          onScroll={handleScroll}
          role="listbox"
          aria-label={label}
        >
          <li className={styles.columnPad} aria-hidden="true" />
          {items.map(n => (
            <li
              key={n}
              role="option"
              aria-selected={n === selected}
              className={classNames(
                styles.columnItem,
                n === selected && styles.columnItemSelected,
              )}
              onClick={() => {
                const idx = items.indexOf(n);
                onSelect(n as T);
                scrollTo(idx, 'smooth');
              }}
            >
              {formatItem ? formatItem(n) : pad2(n)}
            </li>
          ))}
          <li className={styles.columnPad} aria-hidden="true" />
        </ul>
      </div>
    </div>
  );
}

// 泛型组件手动 memo
const MemoPickerColumn = memo(PickerColumn) as typeof PickerColumn;

export default MemoPickerColumn;
