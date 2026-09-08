# Lumina 实施进度

> 来源规格：[SPEC.md](./SPEC.md) 编号越小优先级越高；`0000` 是所有功能开发前必须完成的工程化门槛。

## 状态图例

`☐ 未开始` | `◐ 进行中或外部验收待完成` | `☑ 完成` | `⊘ 本期不做`

## 模块清单

| 步骤                                       | 模块                                    | 端     | 依赖             | 里程碑 | 状态 |
| ------------------------------------------ | --------------------------------------- | ------ | ---------------- | ------ | ---- |
| [0000](./0000-vite-plus-engineering.md)    | vite-plus-engineering                   | Eng    | -                | Pre-M0 | ☑    |
| [0001](./0001-backend-foundation.md)       | backend-foundation                      | BE     | -                | M0     | ☑    |
| [0002](./0002-database.md)                 | database                                | BE     | 0001             | M0     | ☑    |
| [0003](./0003-image-provider.md)           | image-provider, SiliconFlow FLUX.2 Flex | BE     | 0001             | M0/M1  | ◐    |
| [0004](./0004-oss-storage.md)              | Cloudflare R2 storage                   | BE     | 0001             | M1     | ◐    |
| [0005](./0005-generation-pipeline.md)      | generation-pipeline                     | BE     | 0002, 0003, 0004 | M1     | ◐    |
| [0006](./0006-generation-api.md)           | generation-api                          | BE     | 0005, 0002       | M1     | ◐    |
| [0007](./0007-frontend-foundation.md)      | frontend-foundation                     | FE     | -                | M1     | ◐    |
| [0008](./0008-wallpaper-preview.md)        | wallpaper-preview                       | FE     | 0007             | M1     | ◐    |
| [0009](./0009-create-flow.md)              | create-flow                             | FE     | 0007, 0008, 0006 | M1     | ◐    |
| [0010](./0010-native-wallpaper-android.md) | native-wallpaper-android                | Native | 0007             | M2     | ◐    |
| [0011](./0011-apply-share-save.md)         | apply-share-save                        | FE     | 0010, 0009       | M2     | ◐    |
| [0012](./0012-library.md)                  | library                                 | FE     | 0007, 0006       | M2     | ◐    |
| [0013](./0013-auth-backend.md)             | auth-backend                            | BE     | 0001, 0002       | M3     | ◐    |
| [0014](./0014-auth-frontend.md)            | auth-frontend                           | FE     | 0007, 0013       | M3     | ◐    |
| [0015](./0015-image-edit.md)               | image-edit                              | BE+FE  | 0005, 0009       | M4     | ☐    |
| [0016](./0016-polish.md)                   | polish                                  | BE+FE  | all              | M5     | ☐    |
| [0017](./0017-docker-self-hosting.md)      | docker-self-hosting                     | Eng    | 0000, landing    | M6     | ◐    |

## 当前关键路径

- 0000、0001、0002 已完成并通过本地工程化校验。
- 0003 已从不适合作为生产图片后端的 Codex SDK 迁移到 SiliconFlow 的
  `black-forest-labs/FLUX.2-pro`。离线 provider、环境校验、mock、错误映射和真实 API
  spike 脚本已完成。
- 0003 的真实验收仍需要 `SILICONFLOW_API_KEY`：先验证 `576x1024`
  文生图与临时 URL 下载，再验证目标设备尺寸。该调用会产生供应商费用，因此不会在自动测试中运行。
- 0004 的 R2 离线能力已完成，真实 bucket 凭据验收仍待完成。
- 0005 的 LangGraph 流水线已完成离线 mock 验证，覆盖提示词扩写开关、模式分流、R2 持久化以及失败回填；真实 Provider/R2 验收仍依赖 0003 和 0004 的外部凭据。
- 0006 的生成任务 API 已完成本地实现与 mock 验证：`POST /generate` 先创建 pending
  job 并异步运行图，`GET /jobs/:id` 供轮询，`GET /presets` 返回内置预设，`GET /wallpapers` 按匿名
  `deviceId` 分页查询；真实生成验收仍依赖 0003/0004 的外部凭据。
- 0007 的 Expo Router 基础已完成：三 Tab、主题/系统字体、React Query、可配置 API
  client、加载/错误状态与 ≥2K 尺寸推算均通过本地测试和三平台导出。真机需配置局域网
  `EXPO_PUBLIC_API_URL` 后补做 Tab 切换与 `/health` 连通性验收。
- 0008 的静态壁纸预览已完成：手机壳裁切、状态栏、锁屏时钟与桌面图标 overlay 可独立测试。0009 的创作闭环已接入预设、chips、想法、生成 job 轮询、失败重试和结果预览，使用 0007 的 ≥2K 目标尺寸。真实设备联调仍依赖局域网
  `EXPO_PUBLIC_API_URL`，真实图像则另依赖 0003/0004 的外部凭据。
- 0010 的本地 Android Expo Module、`SET_WALLPAPER` config
  plugin 和类型化 API 已完成；0011 已把下载、本地应用、相册保存、系统分享及 iOS 降级接到结果页。静态检查与 mock 测试通过，仍需 Android
  development build 和真机确认三种系统壁纸 target、相册和分享。
- 0012 已加入安全持久化匿名 deviceId、生成/图库共享标识、分页网格、刷新/空态/详情与预设入口占位；真实 API、生成结果与 0011 操作的设备联调待配置局域网服务。
- 0013 已实现 Clerk token 验证、`optionalAuth`/`requireAuth`、`/me`
  upsert 和匿名历史安全绑定，服务端 41 项测试与构建通过；真实 Clerk/JWKS 和 PostgreSQL 验收待凭据。
- 0014 已接入 ClerkProvider、SecureStore token cache、Google SSO
  UI、Bearer 注入和登录后历史绑定。真实 OAuth、redirect URL、会话恢复和跨设备同步待 Clerk
  Dashboard/Google 配置及开发构建设备验收。

## 里程碑

- **Pre-M0 工程化门槛**：Bun monorepo、Vite+ 质量门禁、测试编排、缓存、hooks 和 CI 已完成。
- **M0 基建**：后端基础与 Prisma 数据库已完成；图片和对象存储的外部服务验收待完成。
- **M0.5 SiliconFlow 图片 spike**：验证 `black-forest-labs/FLUX.2-pro`
  返回可下载的图片 URL，随后写入 R2。
- **M1 生成到预览闭环**：0005、0006、0007、0008、0009。
- **M2 应用、分享与图库**：0010、0011、0012。
- **M3 登录认证**：0013、0014。
- **M4 已有图片能力**：0015。
- **M5 打磨**：0016。
- **M6 Self-hosting**：0017 已完成单台 ECS 的 Docker、GHCR 与 GitHub
  Actions 设计确认；Docker/Compose/CI 文件及真实 ECS 验收待实施。

## 本期不做

- 完整生产级多租户图片额度、计费和支付体系。
- iOS 一键设置系统壁纸。
- 应用商店上架。
