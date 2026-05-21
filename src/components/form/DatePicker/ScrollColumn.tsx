// ScrollColumn — 单列滚动选择器
// 供 TimePickerPanel 使用（时 / 分各一列）
import React, {
  useCallback,
  useEffect,
  useRef,
  memo,
} from 'react';
import { ITEM_H, VISIBLE } from './utils';
import styles from './DatePicker.module.less';

export interface ScrollColumnProps {
  /** 所有可选项文本 */
  items: string[];
  /** 当前选中索引 */
  selectedIndex: number;
  /** 选中变更回调 */
  onChange: (index: number) => void;
  /** 列标题（时 / 分） */
  label: string;
  /** 被禁用的索引集合，这些项灰显且不可选择 */
  disabledIndices?: Set<number>;
}

const ScrollColumn: React.FC<ScrollColumnProps> = memo(({ items, selectedIndex, onChange, label, disabledIndices }) => {
  const listRef    = useRef<HTMLUListElement>(null);
  const isDragging = useRef(false);
  const startY     = useRef(0);
  const startIdx   = useRef(0);
  // 防止 scroll 事件与拖拽产生竞争
  const scrollRafId = useRef<number>(0);

  // ── 滚动到指定项（选中项居中） ──
  const scrollToIndex = useCallback((idx: number, smooth = true) => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: idx * ITEM_H, behavior: smooth ? 'smooth' : 'instant' });
  }, []);

  // 面板挂载 / 选中变更时，无动画跳转（避免用户看到闪烁）
  useEffect(() => {
    scrollToIndex(selectedIndex, false);
  }, [selectedIndex, scrollToIndex]);

  // ── 找到最近的非禁用项 ──
  const findNearestEnabled = useCallback((idx: number): number => {
    if (!disabledIndices || disabledIndices.size === 0) return idx;
    if (!disabledIndices.has(idx)) return idx;
    // 向两侧搜索最近的可用项
    for (let offset = 1; offset < items.length; offset++) {
      const next = idx + offset;
      const prev = idx - offset;
      if (next < items.length && !disabledIndices.has(next)) return next;
      if (prev >= 0             && !disabledIndices.has(prev)) return prev;
    }
    return idx;
  }, [disabledIndices, items.length]);

  // ── 滚动对齐（使用 rAF 节流，避免高频 setState） ──
  const handleScroll = useCallback(() => {
    if (scrollRafId.current) cancelAnimationFrame(scrollRafId.current);
    scrollRafId.current = requestAnimationFrame(() => {
      const el = listRef.current;
      if (!el) return;
      const idx     = Math.round(el.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(items.length - 1, idx));
      const enabled = findNearestEnabled(clamped);
      if (enabled !== selectedIndex) {
        onChange(enabled);
        // 如果被弹回到另一项，修正滚动位置
        if (enabled !== clamped) scrollToIndex(enabled, true);
      }
    });
  }, [items.length, onChange, selectedIndex, findNearestEnabled, scrollToIndex]);

  // 清理 rAF
  useEffect(() => () => { cancelAnimationFrame(scrollRafId.current); }, []);

  // ── PC 鼠标拖拽 ──
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    startY.current     = e.clientY;
    startIdx.current   = selectedIndex;
    e.preventDefault();
  }, [selectedIndex]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    const delta   = startY.current - e.clientY;
    const newIdx  = Math.round(startIdx.current + delta / ITEM_H);
    const clamped = Math.max(0, Math.min(items.length - 1, newIdx));
    const enabled = findNearestEnabled(clamped);
    if (enabled !== selectedIndex) {
      onChange(enabled);
      scrollToIndex(enabled, false);
    }
  }, [items.length, onChange, scrollToIndex, selectedIndex, findNearestEnabled]);

  const onMouseUp = useCallback(() => { isDragging.current = false; }, []);

  useEffect(() => {
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup',   onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup',   onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  return (
    <div className={styles.scrollCol}>
      <div className={styles.scrollColLabel}>{label}</div>
      <div className={styles.scrollColWrap}>
        {/* 高亮选中框 */}
        <div className={styles.scrollColHighlight} aria-hidden="true" />
        {/* 上下渐隐遮罩 */}
        <div className={styles.scrollColFadeTop}    aria-hidden="true" />
        <div className={styles.scrollColFadeBottom} aria-hidden="true" />
        <ul
          ref={listRef}
          className={styles.scrollColList}
          onScroll={handleScroll}
          onMouseDown={onMouseDown}
          style={{ '--item-h': `${ITEM_H}px`, '--visible': VISIBLE } as React.CSSProperties}
          role="listbox"
          aria-label={label}
        >
          {/* 上方填充：让第一项可居中 */}
          {Array.from({ length: Math.floor(VISIBLE / 2) }, (_, i) => (
            <li key={`top-${i}`} className={styles.scrollColPad} aria-hidden="true" />
          ))}

          {items.map((item, idx) => {
            const isDisabled = disabledIndices?.has(idx) ?? false;
            const isSelected = idx === selectedIndex;
            let cls = styles.scrollColItem;
            if (isSelected)  cls += ` ${styles.scrollColItemSelected}`;
            if (isDisabled)  cls += ` ${styles.scrollColItemDisabled}`;
            return (
              <li
                key={item}
                role="option"
                aria-selected={isSelected}
                aria-disabled={isDisabled}
                className={cls}
                onClick={isDisabled ? undefined : () => { onChange(idx); scrollToIndex(idx); }}
              >
                {item}
              </li>
            );
          })}

          {/* 下方填充：让最后一项可居中 */}
          {Array.from({ length: Math.floor(VISIBLE / 2) }, (_, i) => (
            <li key={`bot-${i}`} className={styles.scrollColPad} aria-hidden="true" />
          ))}
        </ul>
      </div>
    </div>
  );
});

ScrollColumn.displayName = 'ScrollColumn';

export default ScrollColumn;
