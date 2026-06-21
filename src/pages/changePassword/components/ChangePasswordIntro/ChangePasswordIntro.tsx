// 修改密码页说明区：展示主图标与安全提示文案。
import React from 'react';
import PageIconIntro from '../../shared/PageIconIntro/PageIconIntro';
import { IconLockMain } from '../ChangePasswordIcons/ChangePasswordIcons';

const ChangePasswordIntro = (): React.JSX.Element => (
    <PageIconIntro
        icon={<IconLockMain />}
        hint="建议使用字母、数字、符号组合以提升账户安全性"
    />
);

export default ChangePasswordIntro;
