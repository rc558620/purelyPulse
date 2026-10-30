// ─── 表格行 ──────────────────────────────────────────────────────────
//
// memo 化：props 仅含 row / selected / disabled / columns / onToggle，
// 其中 selected、disabled 为标量，勾选单行时不会波及其余行。

import React from 'react';
import { cx } from '@utils/utils';
import Checkbox from '@components/form/Checkbox';
import type { DataTableColumn } from '../DataTable';
import styles from '../DataTable.module.less';

export interface DataTableRowProps<T> {
  row: T;
  /** 是否选中（标量，不传整个 Map） */
  selected: boolean;
  /** 是否禁用（无手机号 / 已达选择上限） */
  disabled: boolean;
  columns: DataTableColumn<T>[];
  onToggle?: (row: T) => void;
}

function DataTableRowInner<T>({
  row,
  selected,
  disabled,
  columns,
  onToggle,
}: DataTableRowProps<T>): React.JSX.Element {
  const handleChange = (): void => {
    onToggle?.(row);
  };

  return (
    <tr
      className={cx(
        styles.row,
        selected && styles.rowSelected,
        disabled && !selected && styles.rowDisabled,
      )}
      aria-selected={selected || undefined}
    >
      <td className={cx(styles.td, styles.checkCell)}>
        {onToggle ? (
          <Checkbox
            checked={selected}
            disabled={disabled}
            onChange={handleChange}
            aria-label={selected ? '取消选择该行' : '选择该行'}
          />
        ) : null}
      </td>
      {columns.map((column) => (
        <td
          key={column.key}
          className={cx(styles.td, column.align === 'right' && styles.alignRight, column.align === 'center' && styles.alignCenter, column.className)}
        >
          {column.render(row)}
        </td>
      ))}
    </tr>
  );
}

/** memo 后仍保留泛型调用签名 */
export const DataTableRow = React.memo(DataTableRowInner) as typeof DataTableRowInner;

export default DataTableRow;
