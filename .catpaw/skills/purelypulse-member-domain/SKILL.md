---
name: purelypulse-member-domain
description: purelyPulse 会员域业务知识，覆盖 memberList、memberDetail、memberPoints、partnerBeans、banManagement、membershipSettings 的数据语义、service 映射和弹窗交互模式。用于开发会员列表、会员详情、积分豆值调整、封禁、子账号、会员套餐配置等需求。触发词包括 purelyPulse 会员、memberList、memberDetail、积分、豆值、封禁、会员设置、子账号、套餐配置。
---

# purelyPulse 会员业务域

## 最小前置

- 先读 `purelyPulse/.agent/instructions.md`
- 再读 `/Users/f0rest/Documents/AgentMode/f0rest_frontend_conventions.md`
- 会员域默认仍是 owner 后台视角，不是用户自助视角

## 会员域核心页面

- `memberList`：会员列表、筛选、统计概览
- `memberDetail`：会员详情、会员状态、资产、销售统计、俱乐部统计、子账号
- `memberPoints`：积分记录与积分调整
- `partnerBeans`：豆值记录与豆值调整
- `banManagement`：封禁列表与封禁状态处理
- `membershipSettings`：会员套餐配置

## 会员域核心原则

- 页面组件不直接处理后端原始字段
- 字段兼容、候选字段映射、默认值兜底都下沉到 `*.service.ts`
- 列表、详情、积分、豆值、套餐配置都已经有明显的 service 层模式，新增逻辑优先沿着现有 service 扩展
- 会员后台是管理视角，允许显示完整手机号与管理属性

## memberList / memberDetail 的 service 特点

- `memberList.service.ts` 体量大，承担会员列表、详情、记录、状态、子账号等映射
- 后端字段可能不稳定，service 使用大量候选字段常量做兼容
- 新增字段时，优先补 candidate 常量和 mapper，而不是把兼容逻辑写到组件里
- 需要防止重复请求和旧响应覆盖时，优先沿用 in-flight request 模式

## 资产调整弹窗模式

典型页面：
- `MemberAssetAdjustModal`
- 积分调整
- 豆值调整
- 状态修改相关弹窗

交互原则：
- 弹窗本地持有输入状态和提交中状态
- `onConfirm()` 失败时保持弹窗打开
- toast 由外层或 service 错误链路提示
- 调整数值只做输入合法性、方向和预览，不做复杂业务推导

## 金额与数值规则

- 这是硬约束：前端不做任何金额计算，只做展示
- 经营金额、充值金额、价格展示值、实收、应收、优惠后金额、退款金额、利润、分账等全部以后端返回为准
- 前端只做格式化、空值兜底、展示文案处理，不做任何业务金额推导
- 会员套餐配置直接消费后端 `priceDisplay`
- `membershipSettings.service.ts` 中价格文本归一、validDays 归一都已在 service 层完成
- 页面组件、弹窗组件、表单提交、hook、列表项都不要自行做分转元、元转分或其他金额计算
- 若需求需要新的金额结果字段，优先补后端字段或在 `service` 层接已有展示字段，不允许在前端临时算一个结果

## membershipSettings 模式

- 套餐配置通过 `membershipSettings.service.ts` 获取和保存
- `TierId`、`TierValue` 是核心类型语义
- `lifetime` 套餐额外关心 `validDays`
- 非 lifetime 套餐不要混入 lifetime 专属字段
- 提交前的 payload 组装由 service 负责，不放页面组件

## 封禁与状态管理

- 会员状态修改、封禁、解封、注销属于高风险操作
- 优先沿用 service 中现有接口路径与状态同步模式
- UI 层只负责发起操作、确认风险、展示结果
- 不要在多个组件里散落写状态枚举兼容逻辑

## 子账号与附属能力

member detail 内已包含：
- 子账号资格判断
- 配额设置
- 角色摘要
- 使用数量与剩余数量

新增相关功能时：
- 优先扩展详情 service 的映射结构
- 页面组件消费语义化后的布尔值、数量和摘要对象
- 不要让叶子组件自己解析后端层级结构

## 新增会员域需求时的推荐流程

1. 先确认落在 `memberList`、`memberDetail`、`memberPoints`、`partnerBeans`、`banManagement`、`membershipSettings` 哪个域
2. 优先检查对应 `*.service.ts` 是否已有类似 mapper
3. 需要展示新字段时，先补 service 映射和类型
4. 再决定是扩展现有弹窗，还是新增页面私有组件
5. 最后补齐统计卡、状态 badge、列表项的 UI 装配

## 常见反例

- 组件里直接读取后端原始 response
- 在 JSX 里写一串字段候选兼容判断
- 在表单或弹窗里自行算业务金额
- 在列表项、统计卡、详情页、hook 里临时拼金额结果
- 提交失败先把弹窗关掉
- 为了加一个字段就绕过现有 service 体系

## 快速判断

遇到 purelyPulse 会员域需求时，优先回答：
- 这是列表、详情、资产、状态、豆值、积分还是套餐配置
- 字段兼容应该进哪个 service mapper
- 交互应不应该保持弹窗打开
- 这个数字是业务结果还是仅展示值
- 这里是否偷偷混入了前端金额计算
- 是否可以复用现有会员私有组件与弹窗模式
