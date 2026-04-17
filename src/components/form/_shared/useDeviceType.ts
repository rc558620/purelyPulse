// useDeviceType — 判断当前设备类型
// 供 MonthPicker / DayPicker / TimePicker 等弹出型选择器共用
//
// 优先级：
//   displayMode = 'pc'     → 永远 false
//   displayMode = 'mobile' → 永远 true
//   displayMode = undefined → 使用 useIsMobile（防抖响应式，150ms debounce）
import { useMemo } from 'react';
import { useIsMobile } from '@hooks/useIsMobile';

/**
 * 返回当前是否为移动端视口。
 *
 * - 传入 displayMode 时，返回值固定（不监听 resize）
 * - 不传 displayMode 时，通过 useIsMobile 防抖监听窗口宽度（< 768px 为移动端）
 */
const useDeviceType = (displayMode?: 'mobile' | 'pc'): boolean => {
  // useIsMobile 始终调用（hook 规则：不能有条件调用）
  const isMobileFromSensor = useIsMobile();

  // 根据 displayMode 覆盖感应器值
  const isMobile = useMemo(() => {
    if (displayMode === 'pc')     return false;
    if (displayMode === 'mobile') return true;
    return isMobileFromSensor;
  }, [displayMode, isMobileFromSensor]);

  return isMobile;
};

export default useDeviceType;
