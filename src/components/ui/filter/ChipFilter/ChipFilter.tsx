// 通用横向可滚动 Chip 筛选组：支持"全部" + 动态分类单选切换 + 鼠标/触摸拖拽滚动。
// 适用于：库存盘点分类筛、商品额外分类筛、报表分类筛等场景。
import React, { memo, useRef, useCallback, useState, useEffect } from 'react';
import { cx } from '@utils/utils';
import styles from './ChipFilter.module.less';

export interface ChipFilterOption {
  /** chip 显示文本 */
  label: string;
  /** chip 唯一值 */
  value: string;
}

export interface ChipFilterProps {
  /** chip 选项列表（不含"全部"，组件内部自动添加） */
  options: ChipFilterOption[] | string[];
  /** 当前选中值（空字符串 = 全部） */
  value: string;
  /** 选中某 chip 回调（再次点击同一项则清空 → 传回空字符串） */
  onChange: (value: string) => void;
  /** "全部" chip 的文本，默认"全部" */
  allLabel?: string;
  /** 额外 class，用于外部调整容器间距 */
  className?: string;
}

/** 将 string[] 或 ChipFilterOption[] 统一归一化为 ChipFilterOption[] */
function normalizeOptions(options: ChipFilterOption[] | string[]): ChipFilterOption[] {
  if (!Array.isArray(options) || options.length === 0) return [];
  return (options as Array<string | ChipFilterOption>).map(opt =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt,
  );
}

const ChipFilter: React.FC<ChipFilterProps> = memo(({
  options,
  value,
  onChange,
  allLabel = '全部',
  className,
}) => {
  const normalized = normalizeOptions(options);

  // ─── 拖拽滚动 ──────────────────────────────────────────────────────────
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  /** 拖拽距离超过此阈值时，视为拖拽而非点击 */
  const dragThresholdRef = useRef(0);

  // ─── 拖拽重置 ────────────────────────────────────────────────────────
  const stopDragging = useCallback((): void => {
    isDraggingRef.current = false;
    setIsDragging(false);
  }, []);

  // ─── 鼠标拖拽 ────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent): void => {
    if (!scrollRef.current) return;
    isDraggingRef.current = false;
    dragThresholdRef.current = 0;
    setIsDragging(false);
    startXRef.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftRef.current = scrollRef.current.scrollLeft;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent): void => {
    if (!scrollRef.current) return;
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = x - startXRef.current;
    // 移动超过 5px 才激活拖拽模式
    if (!isDraggingRef.current && Math.abs(walk) > 5) {
      isDraggingRef.current = true;
      setIsDragging(true);
    }
    if (!isDraggingRef.current) return;
    e.preventDefault();
    dragThresholdRef.current = Math.abs(walk);
    scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
  }, []);

  // ─── 触摸拖拽 ────────────────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent): void => {
    if (!scrollRef.current) return;
    isDraggingRef.current = false;
    dragThresholdRef.current = 0;
    setIsDragging(false);
    startXRef.current = e.touches[0].pageX - scrollRef.current.offsetLeft;
    scrollLeftRef.current = scrollRef.current.scrollLeft;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent): void => {
    if (!scrollRef.current) return;
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    const walk = x - startXRef.current;
    if (!isDraggingRef.current && Math.abs(walk) > 5) {
      isDraggingRef.current = true;
      setIsDragging(true);
    }
    if (!isDraggingRef.current) return;
    dragThresholdRef.current = Math.abs(walk);
    scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
  }, []);

  const handleTouchEnd = useCallback((): void => {
    isDraggingRef.current = false;
    setIsDragging(false);
  }, []);

  // ─── 全局 mouseup 监听：防止鼠标移出容器后松开导致拖拽态残留 ─────
  useEffect(() => {
    const onMouseUp = (): void => { stopDragging(); };
    document.addEventListener('mouseup', onMouseUp);
    return () => { document.removeEventListener('mouseup', onMouseUp); };
  }, [stopDragging]);

  // ─── 点击逻辑 ────────────────────────────────────────────────────────
  // BUG-4 修复：使用 valueRef 避免闭包过期值，确保快速点击时 toggle 判断正确
  const valueRef = useRef(value);
  valueRef.current = value;

  const handleSelect = useCallback((optValue: string) => {
    // 拖拽超过阈值时不触发点击
    if (dragThresholdRef.current > 5) return;
    onChange(valueRef.current === optValue ? '' : optValue);
  }, [onChange]);

  // BUG-6 修复："全部"已选中时再次点击不触发回调，与动态 chip toggle 行为一致
  const handleAllClick = useCallback(() => {
    if (dragThresholdRef.current > 5) return;
    if (!valueRef.current) return;
    onChange('');
  }, [onChange]);

  return (
    <div
      ref={scrollRef}
      className={cx(styles.filterScroll, isDragging && styles.filterScrollDragging, className)}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* "全部"固定 chip */}
      <button
        type="button"
        className={cx(styles.chip, !value && styles.chipActive)}
        onClick={handleAllClick}
      >
        {allLabel}
      </button>

      {/* 动态 chip */}
      {normalized.map(opt => (
        <button
          key={opt.value}
          type="button"
          className={cx(styles.chip, value === opt.value && styles.chipActive)}
          onClick={() => handleSelect(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
});

ChipFilter.displayName = 'ChipFilter';

export default ChipFilter;
