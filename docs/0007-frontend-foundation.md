# 0007 — Mobile 应用基础

> 产品要求以 [SPEC](./SPEC.md) 为准。实施状态见 [progress](./progress.md)，代码差距见
> [Mobile 待办](./0018-mobile-roadmap.md)。

## 目标与约定

使用 Expo SDK 56、Expo Router、Clerk、React Query、Zustand 和 Lingui。UI 保持原生 React
Native 行为；社区 Bottom Sheet 置于 GestureHandlerRootView 下。

导航为 Home、Add、Profile。当前 (create) 路由组承载首页和类型/作品页面，(add) 的 tabPress 打开 /create-wallpaper 透明覆盖路由。文件组名是实现细节；Add 对用户是动作入口。

登录恢复完成前展示明确加载状态；业务页面受登录保护。账号变更时同步处理请求、Query 缓存与业务 store。屏幕尺寸仅用于比例和像素适配。

组件模块统一由 index.tsx 导出，消费者使用 @/components/[module]。Mobile 测试集中在 src/**tests**，原生模块 mock 集中维护。编写 Expo/RN 代码前阅读 AGENTS.md 指定的 SDK
56 文档。

## 实现位置

- `apps/mobile/src/app/_layout.tsx`
- `apps/mobile/src/app/(tabs)/_layout.tsx`
- `apps/mobile/src/components/`
- `apps/mobile/src/hooks/`
- `apps/mobile/src/stores/`

## 当前状态

基础布局、路由、Providers 和组件目录已存在；账号状态边界按 A04 完成。

## 验收标准

- [ ] 冷启动、登录恢复、退出和切换账号不闪现其他账号内容。
- [ ] Add、返回、类型详情与预览导航可达，无空白占位页。
- [ ] 真机小屏、键盘和大字体布局可用。
