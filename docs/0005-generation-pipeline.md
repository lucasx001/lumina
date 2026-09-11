# 0005 — 生成与归档管线

> 产品要求以 [SPEC](./SPEC.md) 为准。实施状态见 [progress](./progress.md)，代码差距见
> [Mobile 待办](./0018-mobile-roadmap.md)。

## 目标与约定

管线接收已鉴权的账号、所属类型、风格、提示词、画质和目标尺寸，依次解析风格、组装提示词、调用 Provider、保存资产、提交作品结果。风格仅允许内置或当前账号私有预设。

任务从 pending 到 processing，图片持久化及作品记录完成后成为 succeeded；异常成为 failed 并提供可恢复提示。成功结果必须保留账号、类型和实际尺寸。失败任务不进入成功作品列表。

任务运行独立于创建 Sheet。进程内 runner 可用于开发，但进程重启后的非终态任务必须有恢复或明确失败策略。重试避免重复产物与重复归档。

编辑、扩图、增强、风格提取按 0015 分阶段交付；风格提取保存当前账号私有预设。

## 实现位置

- `apps/server/src/graph/wallpaper.graph.ts`
- `apps/server/src/graph/state.ts`
- `apps/server/src/graph/nodes/wallpaper.nodes.ts`
- `apps/server/src/jobs/runner.ts`

## 当前状态

图编排与 runner 已存在；账号创建归属、稳定资产标识和任务恢复见 A02、A05、C03。

## 验收标准

- [ ] 成功只生成一张作品，所属账号与类型在全过程一致。
- [ ] Provider/R2/数据库失败都能收敛到可查询状态。
- [ ] 任务重试和进程恢复不造成重复归档。
