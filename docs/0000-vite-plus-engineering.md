# 0000 — 工程规范与验证

> 产品基线见 [SPEC](./SPEC.md)。本文件描述工程最终约定；当前功能差距见
> [Mobile 待办](./0018-mobile-roadmap.md)。

## 工作区与工具

Bun 1.3.11
workspace 包含 apps/mobile（Expo）、apps/server（Hono）、apps/landing（Next.js）和 packages/i18n（Lingui）。依赖安装在根目录执行 bun
install --frozen-lockfile，各包声明自己的运行依赖。

Vite+ 负责格式、Oxlint、类型检查、服务端 Vitest 和任务编排。bun run dev 直接调用 Turbo
TUI，启动 mobile/server/landing 的开发脚本。Expo
CLI/Metro 负责 Mobile，Next.js 负责 Landing，服务端使用 TypeScript 编译。Mobile 测试使用 Jest +
jest-expo，保持原生模块 mock 与组件测试运行环境。

## 代码与文件规则

- 配置中心为 vite.config.ts；共享 Oxlint 规则位于 config/oxlint-presets.ts。
- 使用单引号、分号、100 字符行宽、严格 TypeScript 和 import type。
- Mobile 路由位于 apps/mobile/src/app，测试集中在 apps/mobile/src/**tests**。
- 服务端新测试按 AGENTS.md 与实现同目录放置；调整测试布局时同时确保 Vitest 发现规则覆盖它们。
- 当前 vite.config.ts 的服务端测试匹配 apps/server/src/**tests**/**/*.test.ts；实施就近测试时必须同步配置，避免新用例未执行。
- 忽略依赖、构建产物、Expo/Next 状态与缓存，密钥不得进入日志或任务缓存。
- native 模块由开发构建提供；纯组件测试使用集中 mock，模块入口避免无关测试提前加载原生运行时。

## 常用命令

| 命令                           | 用途                             |
| ------------------------------ | -------------------------------- |
| bun install --frozen-lockfile  | 确定性安装                       |
| bun run dev                    | 三端开发任务                     |
| bun run lint                   | Oxlint                           |
| bun run check                  | 国际化编译、格式、lint、类型检查 |
| bun run check -- --fix <paths> | 提交前按仓库约定修复指定路径     |
| bun run test                   | Mobile Jest 和服务端测试         |
| bun run test:server            | 服务端测试                       |
| bun run build                  | Expo 导出及工作区构建            |
| bun run i18n:check             | 翻译目录检查                     |
| bun run fmt -- --check docs    | 文档格式检查                     |

构建使用 bun run build，不能使用缺少入口参数的 bare bun
build。数据库、EAS、部署与需凭据的外部验收不作为可复用本地缓存任务。

## 验证要求

文档调整检查格式、内部链接、路径和产品表述。功能实现先跑相关测试，再完成 AGENTS.md 要求的检查、完整测试和生产构建；PR 包含范围、验证与 UI 截图。真机和外部服务结果与 mock 测试分别记录。改写 Expo/React
Native 代码前读取 [SDK 56 文档](https://docs.expo.dev/versions/v56.0.0/)。
