// MonthPickerPanel — 年月滚轮选择器面板
//
// 负责渲染两列滚轮（年 / 月）以及底部「本月」「确定」操作区。
// 自身只管 UI 与内部临时选中值；最终确认由 onConfirm 回调通知外部。

import React, { useState, useCallback, useMemo, memo } from 'react';

import MemoPickerColumn from '@components/form/_shared/PickerColumn';
import { buildYears, MONTHS, pad2 } from '@components/form/_shared/pickerUtils';
import styles from './MonthPicker.module.less';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface MonthPickerPanelProps {
  /** 当前选中年份（初始值） */
  year: number;
  /** 当前选中月份（1-12，初始值） */
  month: number;
  /** 向前追溯年数（默认 4） */
  pastYears?: number;
  /** 向后预留年数（默认 1） */
  futureYears?: number;
  /** 用户点击「确定」时触发，传出最终选中的年月 */
  onConfirm: (year: number, month: number) => void;
  /** 关闭面板 */
  onClose: () => void;
}

// ─── 组件 ─────────────────────────────────────────────────────────────────────

const MonthPickerPanel: React.FC<MonthPickerPanelProps> = memo(({
  year,
  month,
  pastYears = 4,
  futureYears = 1,
  onConfirm,
  onClose,
}) => {
  const [selYear,  setSelYear]  = useState(year);
  const [selMonth, setSelMonth] = useState(month);

  // 年份列表由 props 决定，props 稳定时 useMemo 直接返回缓存
  const years = useMemo(
    () => buildYears(pastYears, futureYears),
    [pastYears, futureYears],
  );

  const handleConfirm = useCallback(() => {
    onConfirm(selYear, selMonth);
    onClose();
  }, [selYear, selMonth, onConfirm, onClose]);

  const handleNow = useCallback(() => {
    const now = new Date();
    onConfirm(now.getFullYear(), now.getMonth() + 1);
    onClose();
  }, [onConfirm, onClose]);

  return (
    <div className={styles.panel}>
      <div className={styles.panelBody}>
        <MemoPickerColumn
          items={years}
          selected={selYear}
          onSelect={setSelYear}
          label="年"
          formatItem={n => String(n)}
          styles={styles}
        />
        <MemoPickerColumn
          items={MONTHS}
          selected={selMonth}
          onSelect={setSelMonth}
          label="月"
          formatItem={n => pad2(n)}
          styles={styles}
        />
      </div>

      <div className={styles.panelFooter}>
        <button type="button" className={styles.footerNow} onClick={handleNow}>
          本月
        </button>
        <button type="button" className={styles.footerConfirm} onClick={handleConfirm}>
          确 定
        </button>
      </div>
    </div>
  );
});

MonthPickerPanel.displayName = 'MonthPickerPanel';

export default MonthPickerPanel;
