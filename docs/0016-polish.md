# 0016 — 体验与可靠性

> 产品要求以 [SPEC](./SPEC.md) 为准。实施状态见 [progress](./progress.md)，代码差距见
> [Mobile 待办](./0018-mobile-roadmap.md)。

## 目标与约定

主流程保持风格、提示词和类型三个清晰步骤，画质与补充参数作为高级选项。以实际结果尺寸表达清晰度，等待和失败状态提供可执行动作。

账号限流与重试边界一致，客户端处理 Retry-After、防重复提交和任务恢复；服务端失败最终收敛。首页、类型详情、预览分别具备加载、空、离线、错误和重试反馈。

图片列表使用虚拟化、缩略图和适量缓存；预览关注文字可读性、安全区和大字号；收藏反馈及相册权限恢复路径明确。中英文与读屏文本覆盖所有关键操作。

## 实现位置

- `apps/mobile/src/components/feedback.tsx`
- `apps/mobile/src/screens/`
- `apps/mobile/src/hooks/use-generate.ts`
- `apps/mobile/src/stores/generation-store.ts`
- `apps/server/src/lib/generation-rate-limiter.ts`

## 当前状态

两档画质、限流、反馈组件、收藏反馈、账号恢复和真实尺寸展示已实现；当前落实项见 U01–U02、Q01、C03、N02。

## 验收标准

- [ ] 大数据、小屏、慢网和长提示词下主流程可用。
- [x] 实际图片尺寸与质量文案一致，无无限等待或重复生成。
- [x] 账号切换、收藏失败、下载中断和权限恢复都有确定行为。
