// ─── 通用数据表格 ─────────────────────────────────────────────────────
//
// 面向「单页替换语义 + 多选」场景（如群发短信选人）的轻量表格：
//   - 表头第一格固定为全选 checkbox，支持 indeterminate（本页部分选中）
//   - 行组件 memo，行 props 只传 selected / disabled 标量，避免整表重渲染
//   - 窄屏横向滚动 + 表头吸顶
//   - 不做虚拟滚动（200 行量级收益不抵复杂度）

import React from 'react';
import { cx } from '@utils/utils';
import Checkbox from '@components/form/Checkbox';
import DataTableRow from './DataTableRow';
import DataTableHeaderCell from './DataTableHeaderCell';
import styles from './DataTable.module.less';

/** 列定义 */
export interface DataTableColumn<T> {
  /** 列唯一标识 */
  key: string;
  /** 表头内容 */
  title: React.ReactNode;
  /** 列宽（CSS 长度，如 '18rem'） */
  width?: string;
  /** 单元格水平对齐，默认 left */
  align?: 'left' | 'center' | 'right';
  /**
   * 该列表头与数据行的额外类名。
   * ⚠️ 需要**响应式列宽**时必须用它（而不是 width）：width 会被编译成
   * 内联 style，内联样式优先级最高且吃不到媒体查询。
   */
  className?: string;
  /** 单元格渲染 */
  render: (row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  /** 列定义（需由调用方 useMemo 稳定引用） */
  columns: DataTableColumn<T>[];
  /** 当前页数据（翻页为替换语义，调用方自行保证） */
  rows: T[];
  /** 行唯一键 */
  rowKey: (row: T) => string;
  /** 已选 id 集合（可跨页，用于回显选中态） */
  selectedIds?: ReadonlySet<string>;
  /** 禁用行 id 集合（如无手机号的客户） */
  disabledIds?: ReadonlySet<string>;
  /** 最大可选数量；达到后未选行置灰、全选禁用 */
  maxSelectable?: number;
  /** 单行切换（需 useCallback 稳定引用） */
  onToggleRow?: (row: T) => void;
  /** 本页全选 / 取消全选（需 useCallback 稳定引用） */
  onToggleAll?: () => void;
  /**
   * 表头全选态：由调用方派生时传入，覆盖组件内部推导。
   * 两者同时传入时以传入值为准（未传则按本页 rows 自行推导）。
   */
  allSelected?: boolean;
  /** 表头半选态 */
  someSelected?: boolean;
  /** 空数据文案 */
  emptyText?: string;
  /** 外层额外类名 */
  className?: string;
  /** 无障碍：表格用途描述 */
  ariaLabel?: string;
}

const EMPTY_IDS: ReadonlySet<string> = new Set<string>();

/**
 * 通用数据表格。
 *
 * 泛型组件不使用 memo 包裹外层（memo 会丢失泛型签名），
 * 渲染开销由 DataTableRow 的 memo 承担：行 props 全为标量或稳定引用，
 * 勾选单行时只有该行重渲染。
 */
function DataTable<T>({
  columns,
  rows,
  rowKey,
  selectedIds,
  disabledIds,
  maxSelectable,
  onToggleRow,
  onToggleAll,
  allSelected: allSelectedProp,
  someSelected: someSelectedProp,
  emptyText = '暂无数据',
  className,
  ariaLabel,
}: DataTableProps<T>): React.JSX.Element {
  const selected = selectedIds ?? EMPTY_IDS;
  const disabled = disabledIds ?? EMPTY_IDS;

  // 达到上限后未选行不可再选
  const maxReached =
    typeof maxSelectable === 'number' && maxSelectable > 0 && selected.size >= maxSelectable;

  // 本页可参与选择的行（排除禁用行）
  let selectableCount = 0;
  let selectedCount = 0;
  for (const row of rows) {
    const id = rowKey(row);
    if (disabled.has(id)) continue;
    selectableCount += 1;
    if (selected.has(id)) selectedCount += 1;
  }

  const derivedAllSelected = selectableCount > 0 && selectedCount === selectableCount;
  const allSelected = allSelectedProp ?? derivedAllSelected;
  const someSelected = someSelectedProp ?? (selectedCount > 0 && !derivedAllSelected);
  const selectAllDisabled = selectableCount === 0 || maxReached;

  const handleToggleAll = (): void => {
    onToggleAll?.();
  };

  const isRowDisabled = (row: T): boolean => {
    const id = rowKey(row);
    if (disabled.has(id)) return true;
    return maxReached && !selected.has(id);
  };

  return (
    <div className={cx(styles.scrollWrapper, className)}>
      <table className={styles.table} aria-label={ariaLabel}>
        <thead className={styles.thead}>
          <tr>
            <th scope="col" className={cx(styles.th, styles.checkCell)}>
              {onToggleAll ? (
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  disabled={selectAllDisabled}
                  onChange={handleToggleAll}
                  aria-label="全选本页"
                />
              ) : null}
            </th>
            {columns.map((column) => (
              <DataTableHeaderCell key={column.key} column={column} />
            ))}
          </tr>
        </thead>
        <tbody className={styles.tbody}>
          {rows.map((row) => {
            const id = rowKey(row);
            return (
              <DataTableRow<T>
                key={id}
                row={row}
                selected={selected.has(id)}
                disabled={isRowDisabled(row)}
                columns={columns}
                onToggle={onToggleRow}
              />
            );
          })}
        </tbody>
      </table>

      {rows.length === 0 ? <p className={styles.empty}>{emptyText}</p> : null}
    </div>
  );
}

export default DataTable;
