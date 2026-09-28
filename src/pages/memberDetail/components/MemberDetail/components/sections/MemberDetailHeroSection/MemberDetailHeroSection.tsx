// 会员详情横幅区块：展示身份信息、等级状态与快捷操作。
import React, { useEffect, useState } from 'react';
import { cx, safeStr } from '@utils/utils';
import {
  fetchMembershipPricingPreview,
  type MemberPricingPreview,
} from '@pages/memberList/memberList.service';
import {
  IconBanCircle,
  IconClubStats,
  IconInfoCircle,
  IconSalesBarChart,
  IconShieldCheck,
  IconStarBadge,
  IconSubAccount,
  IconUserMinus,
} from '@pages/memberDetail/components/MemberDetailIcons/MemberDetailIcons';
import { LEVEL_LABEL, STATUS_LABEL } from '@pages/memberList/memberList.constants';
import type { MemberDetail, MemberLevel } from '@pages/memberList/memberList.types';
import { formatMemberDate, formatMemberRelativeTime } from '../../../../../memberDetail.utils';
import pageStyles from '../../../../../memberDetail.module.less';
import styles from './MemberDetailHeroSection.module.less';

interface MemberDetailHeroSectionProps {
  member: MemberDetail;
  memberLevel: MemberLevel;
  membershipExpiryText: string | null;
  isBannedMember: boolean;
  isSubmittingAction: boolean;
  isSubmittingMembership: boolean;
  isSubmittingBan: boolean;
  isSubmittingSubAccount: boolean;
  /** 是否正在提交注销操作。 */
  isSubmittingCancel: boolean;
  onOpenMembershipModal: () => void;
  onOpenStatusModal: () => void;
  onOpenSubAccountModal: () => void;
  onOpenSubAccountDetailModal: () => void;
  /** 打开会员运营情况弹窗。 */
  onOpenClubStatsModal: () => void;
  /** 打开营业详情弹窗。 */
  onOpenSalesStatsModal: () => void;
  /** 打开注销账号确认弹窗。 */
  onOpenCancelAccountModal: () => void;
}

const STATUS_CLASS_MAP: Record<string, string> = {
  active: pageStyles.statusActive,
  inactive: pageStyles.statusInactive,
  banned: pageStyles.statusBanned,
  cancelled: pageStyles.statusCancelled,
};

const MemberDetailHeroSection: React.FC<MemberDetailHeroSectionProps> = React.memo(({
  member,
  memberLevel,
  membershipExpiryText,
  isBannedMember,
  isSubmittingAction,
  isSubmittingMembership,
  isSubmittingBan,
  isSubmittingSubAccount,
  isSubmittingCancel,
  onOpenMembershipModal,
  onOpenStatusModal,
  onOpenSubAccountModal,
  onOpenSubAccountDetailModal,
  onOpenClubStatsModal,
  onOpenSalesStatsModal,
  onOpenCancelAccountModal,
}) => {
  // 续费价预览：拿当前档位问一次后端，得到「下次续费价」与公式各分项。
  // 前端不做任何金额运算，只把后端返回的字符串渲染出来。
  const [renewalPricing, setRenewalPricing] = useState<MemberPricingPreview | null>(null);

  // 续费价 = 配置价 + 子账号加价，后两者都在成交价快照里。补录 / 撤销子账号加价、
  // 重置锁定价、重新设置会员等级都会改写快照，而 member.id 与档位都没变——
  // 只依赖 id + level 会让胶囊一直停在操作前的旧价，与页面上的快照卡片自相矛盾
  const lockedPriceSignature = (member.lockedPrices ?? [])
    .map((item) => [
      item.planId,
      item.priceDisplay,
      item.subAccountAmountDisplay ?? '',
      item.subAccountCount ?? '',
    ].join(':'))
    .join(',');

  useEffect(() => {
    // 免费会员没有定价可言，后端只会回一份全零占位，不必多发一次请求；
    // 档位变成免费时顺手清掉上一次的结果，避免胶囊残留旧价
    if (!member.id || memberLevel === 'free') {
      setRenewalPricing(null);
      return undefined;
    }

    let cancelled = false;

    fetchMembershipPricingPreview(member.id, { level: memberLevel })
      .then((result) => {
        if (!cancelled) {
          setRenewalPricing(result);
        }
      })
      .catch(() => {
        // 预览失败不打断详情页渲染，胶囊不展示即可
      });

    return () => {
      cancelled = true;
    };
  }, [member.id, memberLevel, lockedPriceSignature]);

  // 续费价 = 配置价 + 子账号加价；成交价不参与定价，只在有值时顺带说明
  const renewalFormulaText = renewalPricing
    ? `配置价 ¥${renewalPricing.configPriceDisplay}`
      + ` + 子账号加价 ¥${renewalPricing.subAccountAmountDisplay}`
      + ` = ¥${renewalPricing.renewalPriceDisplay}`
      + `${renewalPricing.dealPriceDisplay === null
        ? ''
        : `（本次成交 ¥${renewalPricing.dealPriceDisplay}，仅记账）`}`
    : '';

  const subAccountCapability = member.subAccountCapability;
  const subAccountQuota = subAccountCapability?.subAccountQuota ?? 0;
  const heroAvatarColorClassName = pageStyles[`heroAvatarColor_${member.avatarColorIdx % 6}`];
  // 已注销的账号不允许任何操作
  const isCancelledMember = member.status === 'cancelled';

  return (
    <div className={styles.root}>
      <div className={pageStyles.heroBanner}>
        <div className={cx(pageStyles.heroAvatar, heroAvatarColorClassName, member.avatarUrl && pageStyles.heroAvatarWithImage)} aria-hidden="true">
          {member.avatarUrl ? (
            <img className={pageStyles.heroAvatarImg} src={member.avatarUrl} alt="" />
          ) : (
            safeStr(member.avatarChar, '会')
          )}
          {/* 在线：头像右下角绿点（行业通用语义，后端按 10 分钟窗口判定） */}
          {member.isOnline ? (
            <span
              className={pageStyles.heroOnlineDot}
              aria-label="在线"
              title="在线：最近 10 分钟内有操作"
            />
          ) : null}
        </div>

        <div className={pageStyles.heroInfo}>
          <div className={pageStyles.heroNameRow}>
            <h1 className={pageStyles.heroName}>{safeStr(member.name, '未命名会员')}</h1>
            <span className={cx(pageStyles.heroLevelBadge, pageStyles[`hlevel_${memberLevel}`])}>
              {LEVEL_LABEL[memberLevel]}
            </span>
            {member.isPartner ? (
              <span className={pageStyles.heroPartnerBadge}>
                {safeStr(member.partnerLevel, '合伙人')}
              </span>
            ) : null}
            {/* 账号状态与档位 / 合伙人同为身份徽章，放一行；详情行的加入时间等保持纯文本 */}
            <span className={cx(pageStyles.heroStatus, STATUS_CLASS_MAP[member.status])}>
              {STATUS_LABEL[member.status]}
            </span>
            {/* 会员到期：紧跟账号状态，同属「当前会员身份」这一组 */}
            {membershipExpiryText ? (
              <span className={cx(pageStyles.heroMembershipExpiry, membershipExpiryText === '永久有效' && pageStyles.heroMembershipExpiryLifetime)}>
                {membershipExpiryText}
              </span>
            ) : null}
            {/* 续费价胶囊：贴在标题行尾部，不再单独占 heroBanner 一列挤压正文 */}
            {renewalPricing && renewalPricing.targetPlanId ? (
              <div className={styles.renewalPriceBadge} title={renewalFormulaText}>
                <span className={styles.renewalPriceLabel}>续费价</span>
                <span className={styles.renewalPriceValue}>
                  ¥{renewalPricing.renewalPriceDisplay}
                </span>
              </div>
            ) : null}
          </div>
          <div className={pageStyles.heroBottomRow}>
            <span className={pageStyles.heroPhone}>{safeStr(member.phone, '--')}</span>
            <span className={pageStyles.heroJoined}>加入于 {formatMemberDate(member.registeredAt)}</span>
            <span className={pageStyles.heroActive}>活跃 {formatMemberRelativeTime(member.lastActiveAt)}</span>
          </div>
          <div className={pageStyles.heroActionRow}>
            <button
              type="button"
              className={pageStyles.setMembershipBtn}
              onClick={onOpenMembershipModal}
              aria-label="设置会员等级"
              disabled={isSubmittingAction}
            >
              <IconStarBadge width={13} height={13} strokeWidth={2.5} />
              {isSubmittingMembership ? '设置中...' : '设置会员等级'}
            </button>
            <button
              type="button"
              className={pageStyles.setSubAccountBtn}
              onClick={onOpenSubAccountModal}
              aria-label="配置子账号"
              disabled={isSubmittingAction}
            >
              <IconSubAccount width={13} height={13} strokeWidth={2.2} />
              {isSubmittingSubAccount ? '配置中...' : (
                subAccountQuota > 0
                  ? `子账号 · ${subAccountQuota} 个`
                  : '配置子账号'
              )}
            </button>
            {subAccountQuota > 0 ? (
              <button
                type="button"
                className={pageStyles.viewSubAccountDetailBtn}
                onClick={onOpenSubAccountDetailModal}
                aria-label="查看子账号详情"
                disabled={isSubmittingAction}
              >
                <IconInfoCircle width={13} height={13} strokeWidth={2.2} />
                查看子账号详情
              </button>
            ) : null}
            {/* 会员运营情况入口：查看该商家在 purelyClub C 端的储值与等级分布 */}
            <button
              type="button"
              className={pageStyles.viewClubStatsBtn}
              onClick={onOpenClubStatsModal}
              aria-label="查看会员运营情况"
              disabled={isSubmittingAction}
            >
              <IconClubStats width={13} height={13} strokeWidth={2.2} />
              会员运营情况
            </button>
            {/* 营业详情入口：查看该商家今日/本周/本月/今年/去年的销售额与利润数据 */}
            <button
              type="button"
              className={pageStyles.viewSalesStatsBtn}
              onClick={onOpenSalesStatsModal}
              aria-label="查看营业详情"
              disabled={isSubmittingAction}
            >
              <IconSalesBarChart width={13} height={13} strokeWidth={2.2} />
              营业详情
            </button>
            {/* 封禁 / 解封按钮（已注销的账号不展示） */}
            {!isCancelledMember ? (
              <button
                type="button"
                className={cx(pageStyles.memberStatusBtn, isBannedMember ? pageStyles.memberStatusBtnSafe : pageStyles.memberStatusBtnDanger)}
                onClick={onOpenStatusModal}
                aria-label={isBannedMember ? '解除会员封禁' : '封禁会员'}
                disabled={isSubmittingAction}
              >
                {isBannedMember ? (
                  <IconShieldCheck width={13} height={13} strokeWidth={2.3} />
                ) : (
                  <IconBanCircle width={13} height={13} strokeWidth={2.3} />
                )}
                {isSubmittingBan ? (isBannedMember ? '解封中...' : '封禁中...') : (isBannedMember ? '解除封禁' : '封禁账号')}
              </button>
            ) : null}
            {/* 注销账号按钮（已注销的账号不展示） */}
            {!isCancelledMember ? (
              <button
                type="button"
                className={pageStyles.cancelAccountBtn}
                onClick={onOpenCancelAccountModal}
                aria-label="注销账号"
                disabled={isSubmittingAction}
              >
                <IconUserMinus width={13} height={13} strokeWidth={2.2} />
                {isSubmittingCancel ? '注销中...' : '注销账号'}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
});

MemberDetailHeroSection.displayName = 'MemberDetailHeroSection';

export default MemberDetailHeroSection;
