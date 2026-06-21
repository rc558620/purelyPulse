// 退出登录区域：按钮 + 确认弹窗，状态完全自包含
import React, { useState, useCallback } from 'react';
import Button from '@components/ui/action/Button';
import { Modal } from '@components/overlay/Modal';
import { showToast } from '@components/ui/feedback/Toast';
import styles from '../../profile.module.less';

interface LogoutSectionProps {
    /** 确认退出后的跳转回调 */
    onLogout: () => void;
}

/** 退出登录区域：包含触发按钮与确认弹窗，状态自包含 */
const LogoutSection: React.FC<LogoutSectionProps> = ({ onLogout }) => {
    const [visible, setVisible] = useState(false);

    const handleConfirm = useCallback(() => {
        setVisible(false);
        showToast({ message: '已退出登录', type: 'success' });
        onLogout();
    }, [onLogout]);

    const handleOpen = useCallback(() => {
        setVisible(true);
    }, []);

    const handleClose = useCallback(() => {
        setVisible(false);
    }, []);

    return (
        <>
            {/* 退出登录触发按钮 */}
            <div className={styles.logoutSection}>
                <Button onClick={handleOpen}>退出登录</Button>
            </div>

            {/* 退出登录确认弹窗 */}
            <Modal
                visible={visible}
                title="确认退出登录？"
                confirmText="确认退出"
                onConfirm={handleConfirm}
                onCancel={handleClose}
            >
                <p>退出后需要重新登录才能访问您的数据</p>
            </Modal>
        </>
    );
};

export default LogoutSection;
