# 0013 — 服务端账号身份与授权

> 产品要求以 [SPEC](./SPEC.md) 为准。实施状态见 [progress](./progress.md)，代码差距见
> [Mobile 待办](./0018-mobile-roadmap.md)。

## 目标与约定

Clerk 管理会话，服务端验证 token 并幂等映射本地 User。所有壁纸业务请求要求有效身份，userId 仅由服务端确定，GET
/me 返回当前账号资料。

生成、任务、类型、作品、收藏、上传、图片读取与私有风格解析均检查所属账号。内置风格可供登录账号共享，自定义风格仅所属账号可用。源图生成参数使用账号分区 object
key，禁止提交任意远程 URL。未认证为 401；未知与跨账号资源统一 404。

账号是唯一业务归属依据。授权不仅在路由层执行，仓储查询、关系写入和后台任务更新也携带账号约束；首次生成不依赖预先调用个人页。

## 实现位置

- `apps/server/src/middleware/auth.ts`
- `apps/server/src/lib/clerk.ts`
- `apps/server/src/routes/me.ts`
- `apps/server/src/routes/generate.ts`
- `apps/server/src/routes/wallpapers.ts`
- `apps/server/src/routes/edit.ts`

## 当前状态

Clerk 校验与 User upsert 已存在；完整业务授权尚需 A01–A05。

## 验收标准

- [ ] 无 token、无效 token、过期会话均拒绝业务请求。
- [x] A/B 覆盖列表、单图、任务、收藏、类型、上传、源图 key 和私有预设的读写越权测试。
- [ ] 并发首次访问同一 Clerk 账号不生成重复 User。
