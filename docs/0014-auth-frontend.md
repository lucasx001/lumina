# 0014 — Mobile 登录与账号生命周期

> 产品要求以 [SPEC](./SPEC.md) 为准。实施状态见 [progress](./progress.md)，代码差距见
> [Mobile 待办](./0018-mobile-roadmap.md)。

## 目标与约定

用户通过 Clerk 支持的登录方式进入应用，界面提供登录、注册、密码重置与 Google
SSO 能力。认证页面按 OpenDesign 的 390 ×
844 手机稿呈现，SecureStore 保存会话凭据；API 请求获取当前 token，业务页面等待会话恢复后进入。

Profile 显示当前账号、退出登录、语言、关于、隐私和应用分享。所有壁纸归账号，登录状态与后端授权必须一致。

账号变更时停止旧查询/轮询，清除私有 Query 缓存、生成/编辑/预览状态和临时文件，旧请求回调不得写入新会话。401 引导重新登录，取消登录不留下半激活状态。

## 实现位置

- `apps/mobile/src/app/_layout.tsx`
- `apps/mobile/src/screens/sign-in.tsx`
- `apps/mobile/src/screens/sign-up.tsx`
- `apps/mobile/src/screens/password-reset.tsx`
- `apps/mobile/src/screens/profile.tsx`
- `apps/mobile/src/hooks/use-auth.ts`
- `apps/mobile/src/components/auth/api-token-bridge.tsx`

## 当前状态

登录页面、注册页面、密码找回页面、路由保护与 token 桥接已有。三页共享暖白 Cafe 视觉：左上角 Lumina 品牌、kicker
/ 展示标题 / 说明文字、带边框输入框、陶土色主按钮和底部账号切换入口；找回密码初始态保留设计稿中的装饰图形，后续验证码和新密码步骤沿用同一布局。注册页包含称呼字段并传入 Clerk
`firstName`，Google 能力保留在认证基础设施中但不占用 OpenDesign 邮箱主流程的视觉位置。完整账号切换状态边界见 A03–A04、N02。真实 OAuth 与会话恢复需实测。

## OpenDesign 页面验收

- 登录页可输入邮箱和密码，显示忘记密码入口，并跳转注册页和密码找回页。
- 注册页收集称呼、邮箱、密码和确认密码；提交后发送邮箱验证码，验证后完成 Clerk 会话。
- 密码找回页依次支持邮箱、验证码和新密码；任一步失败都通过现有 Toast 错误反馈。
- 认证状态保留在 Clerk 流程中，OpenDesign 的视觉改动不改变 SecureStore、路由保护和账号隔离边界。

## 验收标准

- [ ] 登录/取消/失败/注册/密码重置/重启恢复可用。
- [ ] A→退出→B 不显示 A 的壁纸、预设或任务；进行中请求不能污染 B。
- [ ] 账号过期时停止业务操作并提供登录入口。
