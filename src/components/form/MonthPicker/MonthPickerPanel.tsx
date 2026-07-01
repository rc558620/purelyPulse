// MonthPickerPanel — 年月滚轮选择器面板
//
// 负责渲染两列滚轮（年 / 月）以及底部「本月」「确定」操作区。
// 自身只管 UI 与内部临时选中值；最终确认由 onConfirm 回调通知外部。

import React, { useState, useCallback, useMemo, useEffect, useRef, memo } from 'react';

import MemoPickerColumn from '@components/form/_shared/PickerColumn';
import { buildYears, MONTHS, pad2 } from '@components/form/_shared/pickerUtils';
import styles from './MonthPicker.module.less';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface MonthPickerPanelProps {
  /** 当前选中年份（初始值） */
  year: number;
  /** 当前选中月份（1-12，初始值） */
  month: number;
  /** 面板是否可见（传给 PickerColumn，用于重置滚动行为） */
  visible?: boolean;
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
  visible,
  pastYears = 4,
  futureYears = 1,
  onConfirm,
  onClose,
}) => {
  const [selYear,  setSelYear]  = useState(year);
  const [selMonth, setSelMonth] = useState(month);

  // BUG-1 fix: props 变化时同步内部状态，避免面板滚轮停留在旧值
  useEffect(() => {
    setSelYear(year);
  }, [year]);

  useEffect(() => {
    setSelMonth(month);
  }, [month]);

  // BUG-8 fix: 面板打开时（visible false→true）强制同步内部状态为 props 值
  // 解决 onClear 后 year/month 新值与旧值相同时 useEffect 不触发的问题
  const prevVisibleRef = useRef(false);
  useEffect(() => {
    if (visible && !prevVisibleRef.current) {
      setSelYear(year);
      setSelMonth(month);
    }
    prevVisibleRef.current = !!visible;
  }, [visible, year, month]);

  // BUG-6 fix: 加入当前年份依赖，跨年时年份列表自动刷新
  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () => buildYears(pastYears, futureYears),
    [pastYears, futureYears, currentYear],
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
          visible={visible}
          styles={styles}
        />
        <MemoPickerColumn
          items={MONTHS}
          selected={selMonth}
          onSelect={setSelMonth}
          label="月"
          formatItem={n => pad2(n)}
          visible={visible}
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
