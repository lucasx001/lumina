# 0003 — 图片生成 Provider

> 产品要求以 [SPEC](./SPEC.md) 为准。实施状态见 [progress](./progress.md)，代码差距见
> [Mobile 待办](./0018-mobile-roadmap.md)。

## 目标与约定

通过 ImageProvider 提供 textToImage、editImage、outpaint、upscale、extractStyle 能力边界。每次文生图返回一张图片，输出按实际尺寸记录。供应商临时结果必须持久化到 R2 后交付。

Provider 在服务端配置。当前工厂在 OPENAI_IMAGE_PROVIDER_ENABLED 时选择 codex.ts 中的 OpenAI
HTTP 实现，否则按 SILICONFLOW_PROVIDER_ENABLED 选择 SiliconFlow 或 mock。模型名及请求限制由配置和实际 Provider 验证，不写成固定产品承诺。

未支持的操作返回结构化能力错误。Provider 认证、限流、超时与服务失败需要区分；临时失败有限重试，失败不能伪装成成功图片。

## 实现位置

- `apps/server/src/providers/types.ts`
- `apps/server/src/providers/index.ts`
- `apps/server/src/providers/siliconflow.ts`
- `apps/server/src/providers/codex.ts`
- `apps/server/src/providers/mock.ts`

## 当前状态

Provider 适配、工厂和 mock 已存在；真实生成质量、尺寸及编辑能力需独立联调验证。

## 验收标准

- [ ] 真实文生图→临时产物下载→R2→账号内预览闭环通过。
- [ ] 记录实际尺寸，UI 质量说明与图片一致。
- [ ] 各编辑模式分别验证；mock 和接口分支不能代替完整能力验收。
