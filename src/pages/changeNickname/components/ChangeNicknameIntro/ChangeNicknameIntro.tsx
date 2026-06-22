// 修改昵称页说明区：展示主图标与提示文案。
import React from 'react';
import PageIconIntro from '@pages/changePassword/shared/PageIconIntro/PageIconIntro';
import { IconUserMain } from '../ChangeNicknameIcons/ChangeNicknameIcons';

/** 修改昵称页面说明区：展示用户图标与操作提示文案。 */
const ChangeNicknameIntro = (): React.JSX.Element => (
    <PageIconIntro
        icon={<IconUserMain />}
        hint="昵称将在个人中心及相关页面中展示"
    />
);

export default ChangeNicknameIntro;
