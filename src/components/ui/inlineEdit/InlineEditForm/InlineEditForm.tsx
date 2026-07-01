// 行内名称编辑表单（部门、职位等通用）
import React, { useState, useCallback, useRef, memo } from 'react';
import { showToast } from '@components/ui/feedback/Toast';
import { cx } from '@utils/utils';
import { IconCheckmark, IconClose } from '@components/ui/_shared/icons';
import styles from './InlineEditForm.module.less';

const NAME_MAX_LENGTH = 20;

// ─── Props ──────────────────────────────────────────────────────

export interface InlineEditFormProps {
  id: string;
  defaultName: string;
  /** 保存成功时的回调（支持异步，用于行内编辑提交后等待结果） */
  onSave: (id: string, name: string) => void | Promise<void>;
  onCancel: () => void;
  /** 名称为空时的错误提示，默认"名称不能为空" */
  emptyMsg?: string;
  /** input placeholder */
  placeholder?: string;
}

// ─── 组件 ──────────────────────────────────────────────────────

const InlineEditForm: React.FC<InlineEditFormProps> = ({
  id,
  defaultName,
  onSave,
  onCancel,
  emptyMsg = '名称不能为空',
  placeholder = '请输入名称',
}) => {
  const [editName, setEditName] = useState(defaultName);
  const [saving, setSaving] = useState(false);
  // 用 ref 标记是否正在保存，防止 handleSave 闭包中 saving 状态滞后
  const savingRef = useRef(false);

  const handleSave = useCallback(async (): Promise<void> => {
    // 防重复提交：ref 检查比 state 更及时
    if (savingRef.current) return;

    const trimmed = editName.trim();
    if (!trimmed) {
      showToast({ message: emptyMsg, type: 'error' });
      return;
    }

    savingRef.current = true;
    setSaving(true);
    try {
      await onSave(id, trimmed);
    } catch {
      showToast({ message: '保存失败，请重试', type: 'error' });
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [id, editName, emptyMsg, onSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter')  { e.preventDefault(); void handleSave(); }
    if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
  }, [handleSave, onCancel]);

  return (
    <div className={styles.editForm}>
      <input
        type="text"
        value={editName}
        onChange={(e) => setEditName(e.target.value)}
        placeholder={placeholder}
        maxLength={NAME_MAX_LENGTH}
        className={styles.editInput}
        aria-label={`编辑 ${placeholder}`}
        autoFocus
        onKeyDown={handleKeyDown}
        disabled={saving}
      />
      <div className={styles.editActions}>
        <button
          type="button"
          className={cx(styles.iconBtn, styles.saveBtn)}
          onClick={() => { void handleSave(); }}
          disabled={saving}
          aria-label="保存编辑 (Enter)"
        >
          <IconCheckmark />
        </button>
        <button
          type="button"
          className={cx(styles.iconBtn, styles.cancelBtn)}
          onClick={onCancel}
          disabled={saving}
          aria-label="取消编辑 (Esc)"
        >
          <IconClose />
        </button>
      </div>
    </div>
  );
};

export default memo(InlineEditForm);
