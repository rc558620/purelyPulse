// 行内名称编辑表单（部门、职位等通用）
import React, { useState, useCallback, memo } from 'react';
import { showToast } from '@components/ui/feedback/Toast';
import { cx } from '@utils/utils';
import styles from './InlineEditForm.module.less';

const NAME_MAX_LENGTH = 20;

// ─── 图标（内联 SVG，不依赖各模块 Icons 文件）──────────────────

const IconCheckmark: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconClose: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── Props ──────────────────────────────────────────────────────

export interface InlineEditFormProps {
  id: string;
  defaultName: string;
  /** 保存成功时的回调 */
  onSave: (id: string, name: string) => void;
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

  const handleSave = useCallback((): void => {
    const trimmed = editName.trim();
    if (!trimmed) {
      showToast({ message: emptyMsg, type: 'error' });
      return;
    }
    onSave(id, trimmed);
  }, [id, editName, emptyMsg, onSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter')  { e.preventDefault(); handleSave(); }
    if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
  }, [handleSave, onCancel]);

  return (
    <div className={styles.editForm}>
      <input
        key={`edit-${id}`}
        type="text"
        defaultValue={defaultName}
        onChange={(e) => setEditName(e.target.value)}
        placeholder={placeholder}
        maxLength={NAME_MAX_LENGTH}
        className={styles.editInput}
        aria-label={`编辑 ${placeholder}`}
        autoFocus
        onKeyDown={handleKeyDown}
      />
      <div className={styles.editActions}>
        <button
          type="button"
          className={cx(styles.iconBtn, styles.saveBtn)}
          onClick={handleSave}
          aria-label="保存编辑 (Enter)"
        >
          <IconCheckmark />
        </button>
        <button
          type="button"
          className={cx(styles.iconBtn, styles.cancelBtn)}
          onClick={onCancel}
          aria-label="取消编辑 (Esc)"
        >
          <IconClose />
        </button>
      </div>
    </div>
  );
};

export default memo(InlineEditForm);
