# 0017 — Docker self-hosting

> 模块：docker-self-hosting ｜ 优先级：17 ｜ 依赖：0000、0001、0002、landing ｜ 状态：设计已确认，待实施

## 目标

在一台 **2 vCPU / 4 GB 阿里云 ECS** 上，以 Docker Compose 自托管当前 Lumina
landing 与 server；由 Caddy 接收公网流量和管理 TLS。数据库、认证、对象存储与图片生成服务继续使用托管服务。

本文件是已确认的实施设计，不包含 Dockerfile、Compose、CI 工作流或应用代码的实现。

## 已确认的决策

- 主机：单台阿里云 ECS，允许单实例发布时约 10–30 秒的重启窗口。
- 域名：文档使用 `lumina.example.com`（landing）和
  `api.lumina.example.com`（API）作为占位符；上线前替换为实际可解析到 ECS 公网 IP 的域名。
- 编排与入口：Docker Compose + Caddy；仅 Caddy 发布 TCP `80` 与 `443`。
- 数据服务：不在 ECS 部署 PostgreSQL；PostgreSQL、Clerk、Cloudflare
  R2 与图像生成 Provider 均继续托管。
- 镜像：GitHub Actions 构建两份私有 GHCR 镜像；ECS 只拉取镜像并运行，不保存源码或在生产机构建。
- 发布：推送/合并到 `main` 触发 production 发布；不建设 staging。
- 密钥：生产环境变量保存在 ECS 的 `.env` 文件中，不提交仓库、不写进镜像、不输出到 Actions 日志。
- API：通过 `https://api.lumina.example.com` 面向移动端公开；API 容器端口仅位于内部 Docker 网络。

## 推荐架构

```text
Internet
  │
  ├─ :80/:443 → Caddy（唯一公开端口、HTTP→HTTPS、证书续期）
  │                 ├─ lumina.example.com      → landing:3000
  │                 └─ api.lumina.example.com  → server:3000
  │
  ├─ landing（Next.js）
  └─ server（Hono / Node） ──TLS──→ 托管 PostgreSQL
                              ├──→ Clerk
                              ├──→ Cloudflare R2
                              └──→ 图像生成 Provider
```

使用两个子域名而不是把 API 放在 `/api` 路径下。当前 Hono 路由直接暴露 `/health`、`/generate`
等路径，且移动端需要一个稳定、独立的 API 基址；子域名避免 Caddy 的路径剥离规则与客户端基址混在一起。

Next.js 官方建议在 self-host 场景中使用反向代理，不直接向互联网暴露 Next.js 进程；Docker 容器部署受支持。Caddy 在指定合格域名时可自动申请证书和 HTTP→HTTPS 跳转。参考：[Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting)、
[Caddy automatic HTTPS](https://caddyserver.com/docs/caddyfile/options)。

## 当前仓库调查结果

| 组件             | 当前行为                                                                                         | 对部署设计的影响                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| landing          | `apps/landing` 使用 Next.js 16，`next build` / `next start`；当前没有 Docker 配置。              | 首版以 Next.js 容器运行；实施时应启用 `output: 'standalone'`，减小运行时镜像。                                                        |
| Android 下载 URL | `NEXT_PUBLIC_ANDROID_DOWNLOAD_URL` 在服务端组件中读取，页面可静态预渲染。                        | 这是公开值，必须在 landing **构建镜像时**提供；改 URL 后需重建并发布 landing 镜像。不能把它当作可在同一静态产物上热更新的运行时密钥。 |
| server           | `apps/server` 通过 `node dist/src/index.js` 启动，监听 `PORT`（默认 3000），已有 `GET /health`。 | server 容器应监听内部 `3000`，并通过 `/health` 配置 Docker/Caddy/发布后检查。                                                         |
| 数据库           | Prisma 使用外部 `DATABASE_URL`；仓库已有三份 PostgreSQL migration。                              | 不增加数据库容器；发布前仅运行一次 `prisma migrate deploy`，禁止使用开发用 `migrate dev`。                                            |
| 外部依赖         | Clerk、R2、SiliconFlow/OpenAI 由环境变量配置。                                                   | 所有凭据只能在 ECS 运行环境提供，绝不可使用 Docker build args 或写入 GHCR 层。                                                        |

Next.js 的 standalone 输出会产生最小运行时 `server.js` 与追踪到的依赖；若采用它，仍需在镜像中复制
`.next/static` 与
`public`。这是后续实现项，不是当前配置。参考：[Next.js deployment options](https://nextjs.org/docs/app/getting-started/deploying)、
[standalone output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)。

## 计划新增的部署文件（尚未创建）

```text
deploy/
  Dockerfile.landing             # 多阶段构建，root 为 build context
  Dockerfile.server              # 多阶段构建，构建产物与生产依赖分层
  compose.production.yml         # caddy、landing、server、内部网络、healthcheck
  Caddyfile                      # 两个占位域名到两个内部 service 的反向代理
  .env.example                   # 仅键名和非敏感样例，不含值
  deploy.sh                      # 仅在 ECS 执行：pull、migrate、up、healthcheck
.github/workflows/deploy.yml     # main → test → GHCR → SSH 触发 deploy.sh
.dockerignore                    # 排除 .git、node_modules、.env、构建输出与本地密钥
```

Docker build context 必须是仓库根目录而非单个 app 目录，因为 Bun workspace 的依赖解析依赖根
`package.json` 与 `bun.lock`。Bun 的生产安装应使用
`bun install --frozen-lockfile --production`；构建阶段仍需保留开发依赖来运行 TypeScript 和 Prisma 生成。参考：[Bun Docker guide](https://bun.sh/docs/guides/ecosystem/docker)、
[Bun frozen lockfile](https://bun.sh/docs/pm/cli/install)。

## Compose 运行原则

### 网络、端口与持久化数据

- `caddy`、`landing`、`server` 加入一个命名为 `lumina_internal` 的网络。
- 只有 `caddy` 配置 `80:80` 和 `443:443`；landing 与 server 不配置 host `ports`。
- 为 Caddy 的数据与配置使用命名 volume，避免证书在容器重建后丢失。
- 不挂载应用源码或 `node_modules`；生产代码只来自带版本标签的镜像。
- `restart: unless-stopped` 用于三个长期服务；迁移任务为一次性服务，不自动重启。
- Compose healthcheck 使用 server 的
  `http://localhost:3000/health`。landing 暂无专用健康端点，可临时检查 `/`
  返回成功；后续可增加轻量健康路由以提高诊断质量。

Compose 的 `healthcheck`、restart
policy 与生产 override 均是标准服务配置；Docker 也建议生产环境移除源码 bind
mount 并设置重启策略。参考：
[Compose service reference](https://docs.docker.com/reference/compose-file/services/)、
[Use Compose in production](https://docs.docker.com/compose/how-tos/production/)。

### 资源预算

2 vCPU / 4 GB 是单实例的起点。初始目标（上线后按真实监控调整）：

| 服务     | CPU 上限建议 | 内存上限建议 | 说明                                                               |
| -------- | -----------: | -----------: | ------------------------------------------------------------------ |
| Caddy    |     0.25 CPU |      128 MiB | TLS 与反向代理。                                                   |
| landing  |     0.50 CPU |      512 MiB | 当前页面很轻；Next runtime 保留余量。                              |
| server   |      1.0 CPU |        1 GiB | 图片任务主要调用外部 Provider，仍需为 Prisma、请求和序列化留余量。 |
| 主机余量 |            — | 至少 1.5 GiB | Docker、内核 page cache、日志与突发流量。                          |

这些数值不是性能承诺。Docker 默认不限制容器资源；上线后应按内存、CPU、重启次数和请求延迟调整。参考：[Docker resource constraints](https://docs.docker.com/engine/containers/resource_constraints/)。

## 环境变量与密钥边界

ECS 上创建以下两个**不在 Git 中**的文件，目录建议为 `/opt/lumina/env/`，属主为部署用户、权限
`0600`：

- `compose.env`：镜像名称/标签、占位域名、公开 Android 下载 URL 等 Compose 插值值。
- `server.env`：server 的完整运行时环境变量。

应用运行时密钥遵循上述 ECS `.env` 决策。唯一例外是 GitHub
Actions 登录 ECS 所需的**部署凭据**：它不是应用环境变量，应以 GitHub production environment
secret 保存私钥，ECS 仅在部署用户的 `authorized_keys` 保存对应公钥。

`server.env` 至少包含：

| 分类  | 变量                                                                                                               |
| ----- | ------------------------------------------------------------------------------------------------------------------ |
| 基础  | `NODE_ENV=production`、`PORT=3000`、`DATABASE_URL`、`CORS_ORIGIN`                                                  |
| Clerk | `CLERK_SECRET_KEY`、`CLERK_PUBLISHABLE_KEY`，以及 `CLERK_JWT_ISSUER` 或 `CLERK_JWKS_URL`                           |
| R2    | `R2_ACCOUNT_ID`、`R2_BUCKET`、`R2_ACCESS_KEY_ID`、`R2_SECRET_ACCESS_KEY`、`R2_ENDPOINT`、可选 `R2_PUBLIC_BASE_URL` |
| 图像  | 依实际启用的 Provider 设置 `SILICONFLOW_PROVIDER_ENABLED`、`SILICONFLOW_API_KEY`，以及可选 OpenAI 变量             |

`CORS_ORIGIN` 应使用未来真正的 Web
origin（逗号分隔、无多余通配符）；当前 landing 不调用 API，但未来 Web 功能接入时必须保持最小允许列表。移动 App 的
`EXPO_PUBLIC_API_URL` 则要在其自身构建配置中指向 `https://api.lumina.example.com`。

`NEXT_PUBLIC_ANDROID_DOWNLOAD_URL` 并非密钥，但因为会进入 landing 构建产物，也应只提供 HTTPS
URL；它改变时必须重新构建 landing 镜像。所有真正的密钥都不得放进 `.github/workflows`、Docker build
args、镜像层或日志。

## 数据库迁移与预设

1. 在流量切换前，使用带 Prisma CLI 的一次性 migration 容器执行 `prisma migrate deploy`。
2. 仅由一个发布任务运行迁移，避免并发发布互相竞争。
3. 第一次上线或需要更新内置预设时，显式、一次性地执行 seed；不让每个 server 副本在启动时 seed。
4. 迁移失败即停止发布，保留当前 server 镜像运行；先修复数据库状态再重试。

生产环境应使用 `prisma migrate deploy`；它只应用待执行 migration，不进行 drift 检测、reset 或 shadow
database 操作。参考：[Prisma migrate deploy](https://docs.prisma.io/docs/cli/migrate/deploy)。

## GitHub Actions → GHCR → ECS 发布设计

### CI/CD 流程

```text
push to main
  → bun install --frozen-lockfile
  → bun run test / bun run check / production builds
  → Buildx 构建 landing 与 server（根目录 build context）
  → 以 immutable commit SHA 和受控 latest 标签推送私有 ghcr.io/<owner>/<image>
  → SSH 到 ECS
  → docker compose pull
  → 一次性 migrate
  → docker compose up -d --remove-orphans
  → curl https://api.lumina.example.com/health
  → 发布结果回传 GitHub Actions
```

- Actions job 使用 `contents: read` 和 `packages: write`，通过短期 `GITHUB_TOKEN` 登录 GHCR 推送。
- 所有第三方 Actions 固定到完整 commit SHA，不只引用浮动标签。
- ECS 用专用部署账户；GitHub Actions 的 SSH 私钥只保存为 production environment
  secret，ECS 仅信任对应公钥。该账户拥有 Docker 操作权限与 `/opt/lumina` 读写权限。
- ECS 对私有 GHCR 使用仅含 `read:packages` 的 GitHub classic
  PAT 登录。该 token 仅保存于 ECS 的 root/部署用户私有文件，不放 GitHub Actions
  secrets（Actions 不需要它）。
- 镜像必须使用 SHA 标签部署；`latest` 只用于人工识别，不作为回滚依据。

Docker
daemon 访问在多数 Linux 主机上等同高权限；因此部署账户必须禁止交互式共享、限制 SSH 来源，并只授予所需的
`authorized_keys`。不能把“非 root 用户”视为 Docker 权限的安全边界。

GitHub 官方的 GHCR 示例使用 `GITHUB_TOKEN`、`packages: write`、`login-action` 与 `build-push-action`
发布镜像；私有镜像拉取需要带 `read:packages`
的 token。参考：[Publishing Docker images](https://docs.github.com/en/actions/tutorials/publish-packages/publish-docker-images?learn=continuous_deployment)、
[GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)。

### ECS 一次性准备

1. 安装 Docker Engine 与 Compose V2；不要在生产机安装项目依赖或 clone 源码。
2. 创建专用部署用户、`/opt/lumina/{deploy,env}` 目录，限制目录与 `.env` 权限。
3. 登录私有 GHCR，保留 read-only token。
4. 将已审阅的 Compose、Caddyfile 与部署脚本放入 `/opt/lumina/deploy`；这些文件应随发行版本更新。
5. 在阿里云安全组仅放行 TCP `22`（限制运维来源）、`80`、`443`；不要公开 Docker
   daemon、PostgreSQL 或 app 内部 3000 端口。
6. 将两个实际域名的 A/AAAA 记录指向 ECS；在 DNS 生效且 `80/443`
   可达前不要启动 Caddy 的正式证书流程。

## 发布、验证、回滚

### 首次发布前检查

- `docker compose config` 渲染成功，且没有未替换的占位变量。
- GHCR 两个镜像均能由 ECS 拉取。
- `DATABASE_URL` 可从 ECS 连接到托管 PostgreSQL，并已备份/验证恢复流程。
- Clerk 的允许域名、redirect URL 与 JWT/JWKS 配置已包含实际 production 域名。
- R2、SiliconFlow/OpenAI 凭据已在 ECS `server.env` 中，且未写入任何 CI 输出。
- DNS、ECS 安全组与 HTTPS 证书申请前提满足。

### 发布后验收

1. `https://lumina.example.com` 返回 landing，浏览器没有 mixed-content 或证书错误。
2. `https://api.lumina.example.com/health` 返回 `200` 和 `{ "ok": true }`。
3. 仅 Caddy 在宿主机监听公网端口；`docker ps` 不显示 server/landing 的 host port 映射。
4. Android CTA 在配置有效 HTTPS 下载 URL 时打开正确地址；未配置时保持产品约定的 inert 状态。
5. 移动端以 `EXPO_PUBLIC_API_URL=https://api.lumina.example.com` 进行一次真实 `/health`
   和登录/生成链路验收。
6. 检查 Caddy、server、landing 的日志，没有环境变量校验、Prisma、CORS 或证书错误。

### 回滚

- 将 `/opt/lumina/env/compose.env` 中两个镜像标签改回上一条成功的 commit SHA。
- 执行 `docker compose pull && docker compose up -d --remove-orphans`，然后重复健康检查。
- 数据库 migration 不是自动回滚对象；任何破坏性 schema 变更必须先有独立的回滚/兼容计划。
- 发布前保存最近一次成功的两个 SHA、Compose/Caddyfile 版本和数据库备份恢复记录。

## 明确不在本期实施

- PostgreSQL 容器、数据库备份系统或数据库高可用。
- 多 ECS、Kubernetes、Docker Swarm、零停机滚动发布与跨实例 Next.js cache 协调。
- Staging 环境、蓝绿部署、CDN/WAF、集中式日志与告警平台。
- 将环境变量迁移到阿里云 KMS/Secrets Manager。

当单机资源、可用性或流量不再满足需求时，再评估拆分 staging、接入监控与备份、迁移密钥管理，以及多实例部署。多实例 Next.js 需要额外考虑共享缓存和 revalidation 协调；当前单实例不需要。参考：[Next.js caching and multi-instance coordination](https://nextjs.org/docs/app/guides/self-hosting)。

## 实施完成标准（后续编码任务）

- [ ] Dockerfile、`.dockerignore`、Compose、Caddyfile、ECS 环境变量样例和 GitHub
      Actions 均已实现并通过审阅。
- [ ] 两个生产镜像可从干净环境构建，并在 ECS 通过私有 GHCR 拉取。
- [ ] migration、healthcheck、部署后验收和 SHA 回滚均经一次演练。
- [ ] 生产域名 HTTPS、landing、API、移动端真实 API 与 Android 下载 CTA 已人工验收。
- [ ] ECS、GHCR、托管 PostgreSQL、Clerk、R2 和 Provider 的密钥均未泄漏至 Git、镜像或 CI 日志。
