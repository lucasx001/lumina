# 0008 — 壁纸预览

> 产品要求以 [SPEC](./SPEC.md) 为准。实施状态见 [progress](./progress.md)，代码差距见
> [Mobile 待办](./0018-mobile-roadmap.md)。

## 目标与约定

通过 wallpaperId 独立查询当前账号壁纸详情。完整预览显示图片、所属类型、创建时间、实际尺寸和收藏状态，切换桌面/锁屏叠层。结果预览和作品预览共享展示规则。

图片按比例展示，不拉伸；时钟、状态栏和桌面图标是预览元素。加载/失败/不可访问状态有清楚反馈，返回后恢复类型页面。

原生预览连接 0011 的应用、保存和分享操作。收藏提交中防止重复点击，失败可重试。Web 按平台能力提供预览和下载。

## 实现位置

- `apps/mobile/src/screens/wallpaper-preview.tsx`
- `apps/mobile/src/screens/wallpaper-preview.web.tsx`
- `apps/mobile/src/components/wallpaper-detail.tsx`
- `apps/mobile/src/components/WallpaperPreview.tsx`
- `apps/mobile/src/components/preview/`

## 当前状态

展示组件及原生操作入口已有；独立详情、分页外作品读取、收藏反馈和图片失败重试见 D03、U01、U02。结果图通过账号授权的详情响应提供短期签名地址，凭据过期时可调用
`GET /wallpapers/:id/image` 重新签发。

## 验收标准

- [x] 冷启动或直接打开旧作品 ID 可预览，无需先加载列表。
- [x] 跨账号与不存在作品不可访问。
- [ ] 桌面/锁屏切换、真实尺寸、图片失败重试及安全区真机验证。
