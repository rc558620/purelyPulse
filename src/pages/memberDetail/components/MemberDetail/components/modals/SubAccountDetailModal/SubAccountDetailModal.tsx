import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  IconClose,
  IconInfoCircle,
} from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
import type { SubAccountCapability } from '@pages/memberList/memberList.types';
import MemberDetailSubAccountSection from '../../sections/MemberDetailSubAccountSection/MemberDetailSubAccountSection';
import styles from './SubAccountDetailModal.module.less';

interface SubAccountDetailModalProps {
  capability: SubAccountCapability | undefined;
  onClose: () => void;
  onEditQuota?: () => void;
}

const SubAccountDetailModal: React.FC<SubAccountDetailModalProps> = ({
  capability,
  onClose,
  onEditQuota,
}) => {
  useEffect(() => {
    const handler = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="子账号详情"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.headerMain}>
            <div className={styles.headerIcon} aria-hidden="true">
              <IconInfoCircle width={16} height={16} strokeWidth={2.2} />
            </div>
            <div className={styles.headerText}>
              <h2 className={styles.title}>子账号详情</h2>
              <p className={styles.desc}>查看商家在 purelyProfit 端配置的角色分配与槽位占用情况</p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="关闭子账号详情"
          >
            <IconClose width={16} height={16} strokeWidth={2.4} />
          </button>
        </div>

        <div className={styles.body}>
          <MemberDetailSubAccountSection capability={capability} onEditQuota={onEditQuota} />
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default SubAccountDetailModal;
