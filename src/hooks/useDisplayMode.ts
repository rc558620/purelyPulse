// 视图显示模式 Hook：详细 → 简约 → 极简 三档循环切换
// 被 additional（销售追加）、stocktaking（库存盘点）、employeeManagement（员工管理）共同使用
import { useState, useCallback } from 'react';

/** 显示模式：详细 | 简约 | 极简 */
export type DisplayMode = 'detailed' | 'compact' | 'minimal';

export interface UseDisplayModeReturn {
  /** 当前显示模式 */
  displayMode: DisplayMode;
  /** 循环切换显示模式：详细 → 简约 → 极简 → 详细 */
  cycleDisplayMode: () => void;
}

export function useDisplayMode(initial: DisplayMode = 'detailed'): UseDisplayModeReturn {
  const [displayMode, setDisplayMode] = useState<DisplayMode>(initial);

  const cycleDisplayMode = useCallback((): void => {
    setDisplayMode(prev => {
      if (prev === 'detailed') return 'compact';
      if (prev === 'compact') return 'minimal';
      return 'detailed';
    });
  }, []);

  return { displayMode, cycleDisplayMode };
}
