// 记录行：四类记录混排，行内容按类型分派，但视觉骨架统一
// 「图标 + 会员身份 / 记录内容 / 变更说明 + 右侧数值」。
import React from 'react';
import { cx, safeNum, safeStr } from '@utils/utils';
// 渠道文案与会员详情记录行共用同一份映射：同一个「微信支付」在两处必须长得一样
import { MEMBER_RECHARGE_CHANNEL_LABEL } from '@pages/memberDetail/memberDetail.constants';
import { MEMBER_RECORD_TYPE_LABEL } from '../../../../memberRecords.constants';
import { formatRecordDateTime } from '../../../../memberRecords.utils';
import {
  IconRecordAdminGrant,
  IconRecordRecharge,
  IconRecordRenewalAdjust,
  IconRecordSubAccount,
} from '../../../../memberRecordsIcons';
import styles from '../../../../memberRecords.module.less';
import type { MemberRecordItem, MemberRecordType } from '../../../../memberRecords.types';

interface MemberRecordsRowProps {
  record: MemberRecordItem;
  isLast: boolean;
}

interface RecordRowDisplay {
  /** 记录内容主文案。 */
  title: string;
  /** 渠道 / 操作人：说明「谁用什么方式写下的这条记录」。 */
  actor: string;
  /** actor 是否为支付渠道（决定配色：渠道绿、操作人灰）。 */
  actorIsChannel: boolean;
  /** 右侧主数值。 */
  value: string;
  /** 右侧副行（积分 / 变更前的值）。 */
  sub: string | null;
  /** 副行是否积分（积分用品牌绿，避免和「此前价」这类中性信息混色）。 */
  subIsPoints: boolean;
}

/** 记录类型 → 行配色 class。 */
const RECORD_TONE_CLASS_NAME: Record<MemberRecordType, string> = {
  recharge: styles.toneRecharge,
  adminGrant: styles.toneAdminGrant,
  renewalAdjust: styles.toneRenewalAdjust,
  subAccount: styles.toneSubAccount,
};

const renderRecordIcon = (type: MemberRecordType): React.JSX.Element => {
  switch (type) {
    case 'recharge':
      return <IconRecordRecharge />;
    case 'adminGrant':
      return <IconRecordAdminGrant />;
    case 'renewalAdjust':
      return <IconRecordRenewalAdjust />;
    default:
      return <IconRecordSubAccount />;
  }
};

/**
 * 把一行记录翻译成展示文案。
 *
 * 盈亏类字段（金额 / 积分 / 变更前值）后端都给了展示值，这里只负责拼单位，
 * 避免前端出现第二套金额格式化逻辑。
 */
const resolveRowDisplay = (record: MemberRecordItem): RecordRowDisplay => {
  switch (record.type) {
    case 'recharge':
    case 'adminGrant': {
      const isGift = record.channel === 'gift';
      // 管理端设置等级（计入收入 / 赠送）不产生积分奖励，「+0 积分」是噪音
      const isAdminGrantChannel = record.channel === 'admin' || isGift;

      return {
        title: safeStr(record.planName, record.type === 'adminGrant' ? '会员等级设置' : '会员充值'),
        actor: record.channel ? MEMBER_RECHARGE_CHANNEL_LABEL[record.channel] : '',
        actorIsChannel: true,
        value: isGift ? '赠送' : `¥${safeStr(record.amountDisplay, '0')}`,
        sub: isAdminGrantChannel ? null : `+${safeNum(record.pointsAwarded)} 积分`,
        subIsPoints: true,
      };
    }

    case 'renewalAdjust': {
      const planName = safeStr(record.planName, '');
      return {
        title: planName ? `${planName} · 续费价调整` : '续费价调整',
        actor: safeStr(record.operatorName, '系统'),
        actorIsChannel: false,
        value: record.newValueDisplay ? `¥${record.newValueDisplay}` : '恢复配置价',
        sub: record.oldValueDisplay ? `此前 ¥${record.oldValueDisplay}` : '此前未议定',
        subIsPoints: false,
      };
    }

    default:
      return {
        title: '子账号额度调整',
        actor: safeStr(record.operatorName, '系统'),
        actorIsChannel: false,
        value: safeStr(record.newValueDisplay, '—'),
        sub: record.oldValueDisplay ? `原 ${record.oldValueDisplay}` : null,
        subIsPoints: false,
      };
  }
};

const MemberRecordsRow: React.FC<MemberRecordsRowProps> = ({ record, isLast }) => {
  const display = resolveRowDisplay(record);
  const toneClassName = RECORD_TONE_CLASS_NAME[record.type];

  return (
    <div className={cx(styles.recordRow, toneClassName, isLast && styles.recordRowLast)}>
      <div className={styles.recordIcon} aria-hidden="true">
        {renderRecordIcon(record.type)}
      </div>

      <div className={styles.recordInfo}>
        <div className={styles.recordMemberRow}>
          <span className={styles.recordMemberName}>{safeStr(record.memberName, '未知会员')}</span>
          {record.memberPhone ? (
            <span className={styles.recordMemberPhone}>{record.memberPhone}</span>
          ) : null}
          <span className={styles.recordTypeBadge}>{MEMBER_RECORD_TYPE_LABEL[record.type]}</span>
        </div>

        <div className={styles.recordTitle}>{display.title}</div>

        <div className={styles.recordMeta}>
          {display.actor ? (
            <span className={display.actorIsChannel ? styles.recordChannel : styles.recordOperator}>
              {display.actor}
            </span>
          ) : null}
          <span className={styles.recordDot} aria-hidden="true" />
          <span className={styles.recordDate}>{formatRecordDateTime(record.createdAt)}</span>
        </div>

        {record.reason ? (
          <div className={styles.recordReason} title={record.reason}>原因：{record.reason}</div>
        ) : null}
      </div>

      <div className={styles.recordRight}>
        <span className={styles.recordValue}>{display.value}</span>
        {display.sub ? (
          <span className={cx(styles.recordSub, display.subIsPoints && styles.recordSubPoints)}>
            {display.sub}
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default React.memo(MemberRecordsRow);
