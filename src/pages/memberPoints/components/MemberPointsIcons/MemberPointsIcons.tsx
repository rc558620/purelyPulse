// memberPoints 页面与弹窗共用 SVG 图标集合。
import React from 'react';

export type MemberPointsRecordIconType = 'earn' | 'spend' | 'expire';

type SvgProps = React.SVGProps<SVGSVGElement>;

/** 页面加载中：圆形时钟图标 */
export const IconMemberPointsLoading: React.FC<SvgProps> = (props) => (
  <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

/** 页面异常与空态：问号提示图标 */
export const IconMemberPointsQuestion: React.FC<SvgProps> = (props) => (
  <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

/** 页面主操作：新增积分图标 */
export const IconMemberPointsAdd: React.FC<SvgProps> = (props) => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true" {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

/** 搜索框：放大镜图标 */
export const IconMemberPointsSearch: React.FC<SvgProps> = (props) => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" {...props}>
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

/** 关闭操作：叉号图标 */
export const IconMemberPointsClose: React.FC<SvgProps> = (props) => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true" {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/** 记录项：按变动类型返回图标 */
export const IconMemberPointsRecordType: React.FC<SvgProps & { type: MemberPointsRecordIconType }> = ({ type, ...props }) => {
  if (type === 'earn') {
    return <IconMemberPointsAdd {...props} />;
  }

  if (type === 'expire') {
    return (
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true" {...props}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    );
  }

  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true" {...props}>
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
};

/** 积分弹窗：圆形积分图标 */
export const IconMemberPointsBadge: React.FC<SvgProps> = (props) => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12h8M12 8v8" />
  </svg>
);

/** 积分弹窗：确认勾选图标 */
export const IconMemberPointsConfirm: React.FC<SvgProps> = (props) => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden="true" {...props}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/** 积分弹窗：余额变化箭头图标 */
export const IconMemberPointsPreviewArrow: React.FC<SvgProps> = (props) => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" {...props}>
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
