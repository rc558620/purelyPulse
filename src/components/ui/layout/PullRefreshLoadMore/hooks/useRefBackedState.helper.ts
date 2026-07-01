// 管理带 ref 镜像的 React state，共享“状态仓”骨架
import { useCallback, useRef, useState, type MutableRefObject } from 'react';

export interface UseRefBackedStateResult<T> {
  /** 当前 state 值 */
  value: T;
  /** 当前值对应的 ref 镜像 */
  valueRef: MutableRefObject<T>;
  /** 同步更新 ref 和 state，且避免重复 setState */
  setValueSafely: (nextValue: T) => void;
  /** 获取 ref 中的实时值 */
  getValue: () => T;
}

export const useRefBackedState = <T,>(initialValue: T): UseRefBackedStateResult<T> => {
  const [value, setValue] = useState<T>(initialValue);
  const valueRef = useRef<T>(initialValue);

  const setValueSafely = useCallback((nextValue: T): void => {
    valueRef.current = nextValue;
    setValue((prevValue) => (Object.is(prevValue, nextValue) ? prevValue : nextValue));
  }, []);

  const getValue = useCallback((): T => valueRef.current, []);

  return {
    value,
    valueRef,
    setValueSafely,
    getValue,
  };
};
