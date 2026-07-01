// TimePickerMobilePanel — 移动端底部 BottomSheet
//
// 通过 createPortal 挂到 body，规避父容器 overflow:hidden 裁剪。
// 常驻 DOM，通过 visible + isClosing props + CSS transform 控制滑入/滑出，保证动画流畅。
// 自身只负责 UI 渲染，状态由 useTimePickerState 注入。
//
// Bug #1/#5 fix: 接收 isClosing / onTransitionEnd，支持退场动画
// 关闭时 isClosing=true → 移除 bottomSheetVisible → CSS transition 滑出
// → onTransitionEnd 通知父组件卸载
import React, { useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import MemoPickerColumn from '@components/form/_shared/PickerColumn';
import { pad2, HOURS, MINUTES } from '@components/form/_shared/pickerUtils';
import useTimePickerState from './useTimePickerState';
import styles from './TimePicker.module.less';

export interface TimePickerMobilePanelProps {
  value:        string | null;
  /** 面板是否可见 */
  visible:      boolean;
  isClosing:    boolean;
  onConfirm:    (val: string) => void;
  onClose:      () => void;
  onTransitionEnd: () => void;
}

const TimePickerMobilePanel: React.FC<TimePickerMobilePanelProps> = ({
  value,
  visible,
  isClosing,
  onConfirm,
  onClose,
  onTransitionEnd,
}) => {
  const { selH, selM, setSelH, setSelM, handleConfirm, handleNow } =
    useTimePickerState({ value, onConfirm, onClose });

  // Bug #1/#5 fix: 只在 isClosing 时响应 bottomSheet 自身的 transform 过渡
  const handleTransitionEnd = useCallback((e: React.TransitionEvent) => {
    // 只响应 bottomSheet 自身的 transform 过渡，忽略子元素冒泡
    if (e.target !== e.currentTarget) return;
    if (e.propertyName !== 'transform') return;
    if (isClosing) {
      onTransitionEnd();
    }
  }, [isClosing, onTransitionEnd]);

  return createPortal(
    <>
      {/* 遮罩：通过类名控制入场/退场动画，关闭时不再瞬间消失 */}
      <div
        className={classNames(
          styles.mask,
          visible && !isClosing && styles.maskVisible,
          isClosing && styles.maskClosing,
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 底部弹层：关闭时移除 bottomSheetVisible 触发 CSS transition 滑出 */}
      <div
        className={classNames(
          styles.bottomSheet,
          visible && !isClosing && styles.bottomSheetVisible,
        )}
        onTransitionEnd={handleTransitionEnd}
        role="dialog"
        aria-modal="true"
        aria-label="选择时间"
      >
        {/* 头部 */}
        <div className={styles.sheetHeader}>
          <div className={styles.sheetHandle} aria-hidden="true" />
          <div className={styles.sheetTitleRow}>
            <button
              type="button"
              className={styles.sheetCancelBtn}
              onClick={onClose}
            >
              取消
            </button>
            <span className={styles.sheetTitle}>选择时间</span>
            <div className={styles.sheetHeaderRight} />
          </div>
        </div>

        {/* 滚轮面板 */}
        <div className={styles.panel}>
          <div className={styles.panelBody}>
            <MemoPickerColumn
              items={HOURS}
              selected={selH}
              onSelect={setSelH}
              label="时"
              formatItem={pad2}
              styles={styles}
            />
            <MemoPickerColumn
              items={MINUTES}
              selected={selM}
              onSelect={setSelM}
              label="分"
              formatItem={pad2}
              styles={styles}
            />
          </div>

          <div className={styles.panelFooter}>
            <button type="button" className={styles.footerNow} onClick={handleNow}>
              此刻
            </button>
            <button type="button" className={styles.footerConfirm} onClick={handleConfirm}>
              确 定
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
};

export default memo(TimePickerMobilePanel);
