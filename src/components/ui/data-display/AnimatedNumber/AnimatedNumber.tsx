import React, { useEffect, useReducer } from 'react';
import { cx } from '@utils/utils';
import styles from './AnimatedNumber.module.less';

interface AnimatedNumberProps {
  value: React.ReactNode;
  triggerKey: string;
  className?: string;
}

interface AnimatedItem {
  key: string;
  value: React.ReactNode;
}

interface State {
  items: AnimatedItem[];
  lastTriggerKey: string;
  lastValue: React.ReactNode;
}

type Action =
  | { type: 'TRIGGER_CHANGE'; triggerKey: string; value: React.ReactNode }
  | { type: 'VALUE_CHANGE'; triggerKey: string; value: React.ReactNode }
  | { type: 'CLEANUP' };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'TRIGGER_CHANGE':
      // triggerKey 变化：追加新 item，触发滑出/滑入动画
      return {
        items: [...state.items, { key: action.triggerKey, value: action.value }].slice(-2),
        lastTriggerKey: action.triggerKey,
        lastValue: action.value,
      };
    case 'VALUE_CHANGE': {
      // 同一 triggerKey 下 value 变化：直接更新最后一项，无动画
      const newItems = [...state.items];
      if (newItems.length > 0) {
        newItems[newItems.length - 1] = { key: state.lastTriggerKey, value: action.value };
      }
      return {
        items: newItems,
        lastTriggerKey: action.triggerKey,
        lastValue: action.value,
      };
    }
    case 'CLEANUP':
      // 动画结束后移除旧 item
      return {
        ...state,
        items: state.items.length === 2 ? [state.items[1]] : state.items,
      };
    default:
      return state;
  }
};

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, triggerKey, className }): React.ReactElement => {
  const [state, dispatch] = useReducer(reducer, {
    items: [{ key: triggerKey, value }],
    lastTriggerKey: triggerKey,
    lastValue: value,
  });

  // 响应 triggerKey 或 value 变化（在 effect 中派发，避免 render 阶段 setState 的双重渲染）
  useEffect(() => {
    if (triggerKey !== state.lastTriggerKey) {
      dispatch({ type: 'TRIGGER_CHANGE', triggerKey, value });
    } else if (value !== state.lastValue) {
      dispatch({ type: 'VALUE_CHANGE', triggerKey, value });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerKey, value]);

  // 动画结束后清理旧 item
  useEffect(() => {
    if (state.items.length === 2) {
      const timer = setTimeout(() => {
        dispatch({ type: 'CLEANUP' });
      }, 500); // 500ms matches the CSS animation duration
      return () => clearTimeout(timer);
    }
  }, [state.items.length]);

  return (
    <span className={cx(styles.container, className)}>
      {state.items.map((item, i) => {
        const isOld = state.items.length === 2 && i === 0;
        const isNew = state.items.length === 2 && i === 1;
        return (
          <span
            key={item.key}
            className={cx(
              styles.numberItem,
              isOld && styles.slideOut,
              isNew && styles.slideIn
            )}
            aria-hidden={isOld ? 'true' : 'false'}
          >
            {item.value}
          </span>
        );
      })}
    </span>
  );
};

export default AnimatedNumber;
