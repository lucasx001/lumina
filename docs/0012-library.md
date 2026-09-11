# 0012 — 首页类型与作品管理

> 产品要求以 [SPEC](./SPEC.md) 为准。实施状态见 [progress](./progress.md)，代码差距见
> [Mobile 待办](./0018-mobile-roadmap.md)。

## 目标与约定

首页是当前账号的类型目录，每个 Card 展示名称、成功作品数与封面；全部类型可访问，空类型提供创作入口。类型是归档集合，风格是生成参数，两者独立。

点击类型进入详情，成功作品按时间倒序分页展示，支持刷新、空态、分页错误重试；点击任意作品进入独立预览。收藏状态归账号，可提供收藏筛选。

类型目录及计数由服务端提供；单图详情根据 ID 查询。列表、计数和收藏在生成成功或操作完成后保持一致。

## 实现位置

- `apps/mobile/src/screens/home.tsx`
- `apps/mobile/src/screens/category-detail.tsx`
- `apps/mobile/src/screens/wallpaper-preview.tsx`
- `apps/mobile/src/hooks/use-wallpapers.ts`

## 当前状态

类型 Card、双列作品和预览路由已有；完整目录、分页、计数及单图详情见 D01–D03。

## 验收标准

- [ ] 超过 50 张和多个类型的数据集不遗漏类型或作品。
- [ ] 空类型、加载、错误、刷新与图片加载失败可恢复。
- [ ] A/B 类型、作品和收藏严格隔离；直接打开任意作品可正确鉴权。
