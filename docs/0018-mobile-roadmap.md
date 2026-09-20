# Mobile 优化与待办

> 核查日期：2026-09-18。本文记录当前产品最终形态、P0/P1 交付结果和后续待办。产品行为以
> [SPEC](./SPEC.md) 为准。

## 最终产品形态

- 用户登录后点击 Add，打开 Bottom Sheet，选择风格、输入提示词、选择壁纸类型并生成一张壁纸。
- 生成成功后，作品归档到当前账号的类型中；首页展示当前账号全部类型的 Card，类型详情展示该类型的全部成功作品。
- 任意作品都通过独立详情接口打开预览页，可查看桌面/锁屏效果、收藏、设置壁纸、保存或分享。
- Add
  Sheet 提供现有图片编辑入口，支持上传、编辑、扩图、增强和提取私有风格；结果会归档到当前账号类型。
- 所有壁纸、类型、任务、收藏、源图和自定义风格都属于账号；服务端校验账号归属，客户端缓存和异步状态按账号隔离。

## P0：账号隔离与数据完整性（已完成）

| 编号 | 交付结果                                                                                                                     | 代码与验证                                                                                                       |
| ---- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| A01  | 生成、类型、作品、收藏、预设、上传和任务接口都要求 Clerk 身份；无登录返回 401，跨账号资源返回 404。                          | `apps/server/src/middleware/auth.ts`、各业务 route；服务端授权测试                                               |
| A02  | `User`、`Category`、`Wallpaper` 使用必填归属关系；生成任务、图编排更新和轮询查询都带 `userId`。                              | `apps/server/prisma/schema.prisma`、`routes/generate.ts`、`graph/`；Prisma 生成通过                              |
| A03  | Mobile API、hooks、生成状态和 Profile 只使用账号身份；账号生命周期切换时清理请求、Query 缓存、创建状态、生成状态和预览状态。 | `apps/mobile/src/hooks/use-account-session.ts`、`use-wallpapers.ts`、`use-generate.ts`、`lib/api.ts`             |
| A04  | 类型、列表、单图详情、预设和任务缓存键包含账号；生成成功/失败回调校验当前账号，迟到响应不能回写新账号。                      | `apps/mobile/src/hooks/`、`stores/generation-store.ts`、`app/_layout.tsx`                                        |
| A05  | 图片数据库记录保存稳定 object key；生成图和源图 key 带账号分区，读取时根据当前账号返回受控访问地址。                         | `apps/server/src/lib/r2.ts`、`graph/nodes/wallpaper.nodes.ts`、`routes/edit.ts`                                  |
| D01  | 首页读取账号类型目录，服务端汇总成功作品数量和最多两张封面，空类型也可显示。                                                 | `apps/server/src/routes/categories.ts`、`apps/mobile/src/screens/home.tsx`                                       |
| D02  | 类型详情按 `categoryId` 分页读取，失败任务不进入作品网格，提供加载、空态、错误重试和继续加载。                               | `apps/server/src/routes/wallpapers.ts`、`apps/mobile/src/hooks/use-wallpapers.ts`、`screens/category-detail.tsx` |
| D03  | 预览页通过账号授权的 `GET /wallpapers/:id` 独立获取作品，不依赖详情页首批列表。                                              | `apps/server/src/routes/wallpapers.ts`、`hooks/use-wallpaper.ts`、两个预览 screen                                |

P0 数据模型由单个最终初始化 migration 创建账号、类型和壁纸表，数据库结构以当前 Prisma
schema 为准；产品未发布，无需为已有数据提供兼容迁移。

## P1：主流程闭环（代码与自动化已完成，真机验收待执行）

- [x] **C02 风格选择约束**：共享账号风格查询；首次加载自动选择有效风格，无风格、加载中或请求失败时禁用生成。高级选项默认折叠，保留芯片与画质控件。
- [x] **C03 任务恢复**：新增授权 `GET /jobs`（全部未完成任务）与
      `GET /jobs?status=recent`（全部未完成任务及最近 20 个终态任务）。根布局持续观察当前任务，关闭 Sheet 保留任务与草稿；切换到前台重新查询，应用重启从服务端恢复。首页可重开未完成任务和最近结果；创建新作品时显式重置草稿。
- [x] **C04 归档反馈**：结果页显示已归档类型，提供查看作品、查看类型、创建新作品入口；恢复的任务缺少本地原始参数时不提供无效的“重新生成”。
- [x] **U01/U02 反馈完整性**：封面、网格、结果和全屏预览共用图片失败重试组件，重试时刷新访问地址；收藏提交中禁用重复操作，失败显示错误并允许重试。
- [x] **N01/N02 平台操作与清理**：Android 桌面/锁屏/两者、相册权限、保存、分享及失败重试已覆盖 mock 测试。下载文件使用应用专用临时目录，成功、失败及迟到下载均清理；启动和账号切换清理该目录，系统操作前复核会话。iOS 提供保存/分享和手动设置说明，Web 显示能力说明并隐藏不支持的原生操作。**用户明确要求本轮不做真机验收，系统效果与真实权限行为未验证。**
- [x] **Q01 真实质量展示**：存储层从上传图像字节读取实际宽高，归档时优先采用该尺寸；SiliconFlow 不再把请求尺寸当成实际结果返回。结果页显示像素尺寸，未知时显示“尺寸不可用”，移除固定“Full
      2K+”承诺。

P1 同时修复生成、收藏、创建类型和系统壁纸操作的迟到响应：每次操作记录账号会话版本，退出再登录同一账号也使旧版本失效；API、源图上传和本地文件操作在账号变化时中止或拒绝完成。回归测试覆盖挂载中的 hooks 切换账号、创建类型后切换账号、收藏响应迟到、下载完成前切换账号。

任务恢复指 **Mobile 应用重启**
后重新查询已落库任务，不包含服务端进程重启后的持久化 worker 重调度。自动化通过不代表真实 Clerk、Provider、R2 的端到端验收完成。此前 Review 中的源图归属与 URL/object
key 混用问题已在服务端生成契约和图编排中修复：客户端提交账号归属
`sourceImageKey`，Provider 只接收服务端按 key 签发的短期 URL；P2 已将完整图片编辑接入 Mobile，但仍需真实 Provider、R2、Clerk 和真机验收。

本轮验证：`bun run check` 通过；服务端 13 个测试文件 / 47 项测试，Mobile 25 个测试套 /
63 项测试（使用 `--forceExit`）；服务端编译、Mobile/Landing
TypeScript 检查和 Android/iOS/Web 导出通过。Mobile
Jest 自然退出仍有异步句柄；真实 Provider、R2、Clerk 和真机效果仍需单独验收。

## 后续待办

### P2：完整图片编辑与体验（本轮已完成代码实现，待真机与 Provider 验收）

- [x] **E02 图片编辑**：Add
      Sheet 已接入选图和账号授权上传；编辑、扩图、增强、提取风格均复用生成任务、失败重试、结果归档和私有预设。Codex
      Provider 支持这些模式，SiliconFlow 仍会明确返回不支持错误。
- [x] **U03 大列表性能**：类型详情使用 `FlatList`
      行虚拟化、分页触底加载、批量渲染窗口和内存图片缓存，适用于 200 张以上作品；私有图片不落盘。
- [x] **U04 国际化与无障碍**：编辑入口、分类、错误、上传、下载和操作状态补齐 Lingui 文案；错误容器声明 alert/live
      region，按钮与模式选择保留可访问状态。
- [x] **U05 平台一致性**：Web 预览与 Apply
      Sheet 提供真实下载操作和平台能力说明；原生平台继续按 Android/iOS 能力显示设置、保存与分享操作。

P2 代码验收重点：真实 Clerk 会话下完成源图上传和四种编辑模式；分别验证 Codex
Provider 成功归档、SiliconFlow 不支持提示、200 张以上列表滚动和 Web 下载。完成真机与外部 Provider 验收后，再将本节的“待验收”状态更新为已验收。

## 自动化验证

本轮完成后应保持以下命令通过：

- `bun run check`
- `bun run test:server`
- `bun --cwd=apps/mobile run test -- --runInBand --forceExit`
- `bun --filter=@lumina/server run build`
- `bun --filter=@lumina/mobile run build`

自动化结果不能替代真实 Clerk、Provider、R2 和真机验收；这些外部条件需要在对应环境中单独验证。
