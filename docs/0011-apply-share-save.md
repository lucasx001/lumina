# 0011 — 应用、保存与分享

> 产品要求以 [SPEC](./SPEC.md) 为准。实施状态见 [progress](./progress.md)，代码差距见
> [Mobile 待办](./0018-mobile-roadmap.md)。

## 目标与约定

预览操作提供 Android 桌面/锁屏/两者、保存相册及系统分享。iOS 提供保存与手动设置说明，分享按平台能力开放。Web 提供可用下载入口。

操作前确认当前账号仍可访问该作品，下载有效图片到账号内临时缓存，再调用原生模块/相册/系统分享。缓存可在账号内复用，退出时清理私有缓存；用户主动导出的相册文件独立保留。

权限按需申请，拒绝时提供恢复指引；下载、保存、应用失败有明确提示。提交中防重复操作；切换账号后旧异步下载不能继续触发原生操作。成功反馈只在实际操作完成后出现。

## 实现位置

- `apps/mobile/src/components/apply/apply-sheet.tsx`
- `apps/mobile/src/hooks/use-apply-wallpaper.ts`
- `apps/mobile/src/hooks/use-save-and-share.ts`
- `apps/mobile/src/lib/local-wallpaper.ts`

## 当前状态

原生操作链路、失败重试、账号会话复核和应用专用临时目录清理已实现；平台实测及文件生命周期见 N01–N02。

## 验收标准

- [ ] Android 三种设置目标、相册可见结果及分享面板真机通过。
- [x] 权限拒绝、失效地址、重复点击和账号切换竞态有自动化覆盖。
- [x] iOS/Web 界面只展示实际可用动作。
