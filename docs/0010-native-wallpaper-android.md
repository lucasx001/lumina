# 0010 — Android 系统壁纸

> 产品要求以 [SPEC](./SPEC.md) 为准。实施状态见 [progress](./progress.md)，代码差距见
> [Mobile 待办](./0018-mobile-roadmap.md)。

## 目标与约定

本地 Expo
Module 以 Kotlin 封装 WallpaperManager，setWallpaper 接收本地 URI 与 home/lock/both 目标。config
plugin 声明 SET_WALLPAPER 权限，JS 桥接按调用需要加载原生模块。

远程图片先下载，再解码本地 file/content
URI；大图需控制内存与尺寸。系统拒绝、文件损坏及不支持的目标返回明确错误。

使用包含该模块的 Android development build 验证，Expo
Go 不作为原生能力验收环境。屏幕尺寸与系统权限仅服务原生操作。

## 实现位置

- `apps/mobile/modules/expo-wallpaper/`
- `apps/mobile/src/hooks/use-apply-wallpaper.ts`

## 当前状态

原生模块及桥接测试文件存在；本轮未做构建或真机验收。

## 验收标准

- [ ] 开发构建包含原生模块及权限。
- [ ] 真机分别验证 home、lock、both 的实际壁纸效果。
- [ ] 大图、文件失效和系统拒绝反馈明确，应用不崩溃。
