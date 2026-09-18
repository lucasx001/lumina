# 0004 — 私有图片存储

> 产品要求以 [SPEC](./SPEC.md) 为准。实施状态见 [progress](./progress.md)，代码差距见
> [Mobile 待办](./0018-mobile-roadmap.md)。

## 目标与约定

Cloudflare R2 保存源图、壁纸和风格参考图。应用数据库保存稳定 object
key 与账号所有权，业务 API 验证所属账号后提供读取方式。

支持 buffer/file/临时 URL 持久化；限制下载大小、校验类型，失败记录明确错误。上传签名只授权当前账号的特定对象、类型和有限有效期，完成后登记资产归属。

受保护的资源读取接口可做到每次访问检查账号；签名 URL 属于短期 bearer 凭据，有效期内持有者可读取，需按 SPEC 的严格边界选择读取策略。过期后重新鉴权获取有效地址，不把过期地址当永久存储标识。

## 实现位置

- `apps/server/src/lib/r2.ts`
- `apps/server/src/routes/edit.ts`
- `apps/server/src/graph/nodes/wallpaper.nodes.ts`

## 当前状态

R2 上传和签名基础已存在。结果图和源图只保存稳定 object
key；所有读取地址均为短期签名 URL，`R2_PUBLIC_BASE_URL`
仅为旧部署配置保留且不会生成公开地址。生成请求只能提交 `sources/{localUserId}/...`
的源图 key，服务端按账号前缀校验后才会签发 Provider 使用的 URL。`GET /wallpapers/:id/image`
在每次请求时重新鉴权并签发结果图 URL。

## 验收标准

- [x] 历史壁纸在访问凭据过期后仍能经鉴权获取（通过 `/wallpapers/:id/image` 重新签发）。
- [x] 其他账号不能获取源图/结果图的访问权限（路由和源图 key 前缀均校验账号）。
- [ ] 真实上传、读取、下载失败和内容校验通过；日志不暴露签名凭据。
