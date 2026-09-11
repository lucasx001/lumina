# 0006 — 生成、类型与作品 API

> 产品要求以 [SPEC](./SPEC.md) 为准。实施状态见 [progress](./progress.md)，代码差距见
> [Mobile 待办](./0018-mobile-roadmap.md)。

## 目标与约定

接口契约以 SPEC 的接口表为准。业务端点强鉴权，服务端决定 userId；客户端只提交风格、提示词、categoryId、画质和尺寸等业务参数。

POST /generate 校验所属类型和风格，创建任务后返回 202 { jobId }。GET
/jobs/:id 返回状态、成功作品 ID、类型 ID、实际尺寸及错误。GET /jobs 支持恢复当前账号未完成任务。

GET /categories 提供完整类型目录、成功作品数与封面；POST /categories 创建账号内类型。GET
/wallpapers 支持所属类型和收藏过滤、分页；GET
/wallpapers/:id 支持独立详情。收藏写操作同样检查资源所属账号。

无效输入返回 4xx；未认证 401；不存在与跨账号资源统一 404；限流基于账号，429 携带 Retry-After。分页需要稳定排序并可遍历全部结果。

## 实现位置

- `apps/server/src/routes/generate.ts`
- `apps/server/src/routes/wallpapers.ts`
- `apps/server/src/routes/presets.ts`
- `apps/server/src/app.ts`

## 当前状态

异步生成、轮询、预设、作品列表与收藏已有接口；目标账号授权、类型目录和独立详情见 A01–A05、D01–D03。

## 验收标准

- [ ] A/B 对所有读写接口的越权测试通过。
- [ ] 类型聚合与作品分页不受首批 50 条限制。
- [ ] 创建、任务恢复、失败、重试与成功结果的客户端契约一致。
