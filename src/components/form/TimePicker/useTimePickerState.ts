// useTimePickerState — TimePicker 面板内部的时/分选中状态
//
// 职责：
//   - 将 "HH:mm" 字符串解析为 selH / selM
//   - 「确定」：拼回字符串，调用 onConfirm + onClose
//   - 「此刻」：取当前时间，调用 onConfirm + onClose
import { useState, useCallback, useMemo, useEffect } from 'react';
import { pad2 } from '@components/form/_shared/pickerUtils';

// ─── "HH:mm" 解析 ─────────────────────────────────────────────

const parseTime = (val: string | null): { h: number; m: number } => {
  if (!val) return { h: 0, m: 0 };
  const [h, m] = val.split(':').map(Number);
  return { h: isNaN(h) ? 0 : h, m: isNaN(m) ? 0 : m };
};

// ─── Hook ─────────────────────────────────────────────────────

export interface UseTimePickerStateOptions {
  value:     string | null;
  onConfirm: (val: string) => void;
  onClose:   () => void;
}

export interface UseTimePickerStateReturn {
  selH:          number;
  selM:          number;
  setSelH:       (h: number) => void;
  setSelM:       (m: number) => void;
  handleConfirm: () => void;
  handleNow:     () => void;
}

const useTimePickerState = ({
  value,
  onConfirm,
  onClose,
}: UseTimePickerStateOptions): UseTimePickerStateReturn => {
  const { h: initH, m: initM } = useMemo(() => parseTime(value), [value]);
  const [selH, setSelH] = useState(initH);
  const [selM, setSelM] = useState(initM);

  // Bug #3 fix: 外部 value 变化时同步到内部 state（受控模式 + 常驻 DOM 场景必须）
  useEffect(() => { setSelH(initH); }, [initH]);
  useEffect(() => { setSelM(initM); }, [initM]);

  // Bug #4 fix: 先关闭面板，再提交值
  // 先调 onClose 让面板开始退场动画，再调 onConfirm 更新外部状态
  // 这样面板的退场动画不会被 onConfirm 导致的重渲染打断
  const handleConfirm = useCallback(() => {
    onClose();
    onConfirm(`${pad2(selH)}:${pad2(selM)}`);
  }, [selH, selM, onConfirm, onClose]);

  // 「此刻」快捷：直接提交当前时间并关闭（同样先关后提交）
  const handleNow = useCallback(() => {
    const now = new Date();
    onClose();
    onConfirm(`${pad2(now.getHours())}:${pad2(now.getMinutes())}`);
  }, [onConfirm, onClose]);

  return { selH, selM, setSelH, setSelM, handleConfirm, handleNow };
};

export default useTimePickerState;
