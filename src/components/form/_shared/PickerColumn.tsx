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
  /** 面板是否可见；visible 从 false→true 时重置滚动行为为 instant，避免重新打开时出现平滑滚动定位 */
  visible?: boolean;
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
  visible,
  styles,
}: PickerColumnProps<T>) {
  const listRef = useRef<HTMLUListElement>(null);

  // ── 一次性标记：首次挂载 / 面板重新打开用 'instant'，后续用 'smooth' ──
  const isFirstMount = useRef(true);

  // BUG-6 fix: visible 从 false→true 时重置 isFirstMount，确保再次打开面板用 instant 定位
  const prevVisibleRef = useRef(visible);
  useEffect(() => {
    if (visible && !prevVisibleRef.current) {
      isFirstMount.current = true;
    }
    prevVisibleRef.current = visible;
  }, [visible]);

  // ── items 内容签名，避免引用变化但内容不变时触发无意义的滚动 ──
  const prevItemsKeyRef = useRef('');
  const itemsKey = items.join(',');

  // BUG-7 fix: 用 ref 追踪最新 items，防止防抖闭包中 items 过期
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const scrollTo = useCallback((idx: number, behavior: ScrollBehavior = 'smooth') => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: idx * PICKER_ITEM_H, behavior });
  }, []);

  // ── 统一处理滚动定位 ──
  // 首次挂载：instant（无动画），selected / items 内容变化时：smooth
  useEffect(() => {
    const idx      = items.indexOf(selected);
    const fallback = items.length - 1;
    const targetIdx = idx >= 0 ? idx : fallback;

    const behavior: ScrollBehavior = isFirstMount.current ? 'instant' : 'smooth';
    scrollTo(targetIdx, behavior as ScrollBehavior);

    isFirstMount.current = false;
    prevItemsKeyRef.current = itemsKey;
    // 仅在 selected 或 items 内容真正变化时触发
  }, [selected, itemsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // 滚动停止后（防抖 120ms）对齐并回调
  // BUG-7 fix: 使用 itemsRef 读取最新 items，避免 setTimeout 闭包中 items 过期
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleScroll = useCallback(() => {
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      const el = listRef.current;
      if (!el) return;
      const currentItems = itemsRef.current;
      const idx     = Math.round(el.scrollTop / PICKER_ITEM_H);
      const clamped = Math.max(0, Math.min(idx, currentItems.length - 1));
      onSelect(currentItems[clamped] as T);
      scrollTo(clamped, 'smooth');
    }, 120);
  }, [onSelect, scrollTo]);

  // 卸载时清除防抖计时器
  useEffect(() => () => {
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
  }, []);

  // ── 点击选项：清除防抖计时器 + 仅调用 onSelect，由 useEffect 统一滚动 ──
  const handleClickItem = useCallback((n: T) => {
    // 清除防抖计时器，防止 120ms 后重复回调 onSelect
    if (scrollTimer.current) {
      clearTimeout(scrollTimer.current);
      scrollTimer.current = null;
    }
    onSelect(n);
  }, [onSelect]);

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
              onClick={() => handleClickItem(n)}
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
