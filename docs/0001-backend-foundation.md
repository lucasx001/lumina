# 0001 — 后端基础

> 产品要求以 [SPEC](./SPEC.md) 为准。实施状态见 [progress](./progress.md)，代码差距见
> [Mobile 待办](./0018-mobile-roadmap.md)。

## 目标与约定

后端以 Hono 提供 JSON
API、健康检查、结构化错误、CORS 与日志。PostgreSQL、Clerk、R2 和 Provider 配置由环境变量校验；密钥只在服务端使用。

## 实现位置

- `apps/server/src/app.ts`
- `apps/server/src/config/env.ts`
- `apps/server/src/middleware/error.ts`
- `apps/server/src/lib/logger.ts`

## 当前状态

现有工程、环境校验和路由挂载已具备。业务接口强鉴权与账号上下文按 0013 验收。

## 验收标准

- [ ] 健康检查可用，错误响应含稳定 code/message，不泄露内部凭据。
- [ ] 配置缺失时启动明确失败；生成与资产业务请求具备账号上下文。
