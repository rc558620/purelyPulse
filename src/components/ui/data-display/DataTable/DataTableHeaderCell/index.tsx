// ─── 表格表头单元格 ──────────────────────────────────────────────────
import React from 'react';
import { cx } from '@utils/utils';
import type { DataTableColumn } from '../DataTable';
import styles from '../DataTable.module.less';

export interface DataTableHeaderCellProps<T> {
  column: DataTableColumn<T>;
}

function DataTableHeaderCell<T>({ column }: DataTableHeaderCellProps<T>): React.JSX.Element {
  return (
    <th
      scope="col"
      className={cx(
        styles.th,
        column.align === 'right' && styles.alignRight,
        column.align === 'center' && styles.alignCenter,
        column.className,
      )}
      style={column.width ? { width: column.width } : undefined}
    >
      {column.title}
    </th>
  );
}

export default DataTableHeaderCell;
