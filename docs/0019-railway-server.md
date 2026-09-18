# 0019 — Railway 服务端容器部署

## 构建产物

服务端使用仓库根目录作为 Docker build context，由 `apps/server/Dockerfile` 完成两阶段构建：Bun
1.3.11 安装锁定依赖、生成 Prisma Client、编译 TypeScript，运行阶段只安装生产依赖并复制 `dist`
与生成后的 Prisma Client。容器通过 Railway 注入的 `PORT` 启动，健康检查地址为 `/health`。

仓库根目录的 `railway.toml`
已指定服务端 Dockerfile、启动命令、健康检查和失败重启策略。由于服务端依赖根目录的 `package.json` 与
`bun.lock`，Railway 服务的 Root Directory 必须留空（仓库根目录）；不要把 Root Directory 设置为
`apps/server`。如果项目设置未读取 `railway.toml`，可在服务变量中设置
`RAILWAY_DOCKERFILE_PATH=/apps/server/Dockerfile`。

## Railway 配置

1. 在 Railway 中连接 GitHub 仓库，并为服务使用仓库根目录作为 Source/Root Directory。
2. 确认构建配置使用仓库内的 `railway.toml`，或手动设置 Dockerfile 路径为 `apps/server/Dockerfile`。
3. 在 Railway Variables 中配置 `apps/server/.env.example` 列出的运行时变量。至少需要
   `DATABASE_URL`、Clerk、R2 和 Provider 相关配置；不要把 `.env` 提交到仓库。
4. 部署后访问 Railway 生成域名的 `/health`，应返回 `{ "ok": true }`。

数据库迁移仍通过受控环境执行 `bun --cwd=apps/server run prisma:deploy`。本镜像没有把 Prisma
CLI 放入运行时依赖，也不会在每次启动时自动执行迁移。

## 本地验证

从仓库根目录构建并运行：

```sh
docker build -f apps/server/Dockerfile -t lumina-server .
docker run --rm -p 3000:3000 --env-file apps/server/.env lumina-server
```

使用 `.env.example`
时需要先填入真实配置；服务端会在启动时校验必填环境变量。Railway 的实际部署验证还需要连接真实 PostgreSQL、Clerk、R2 和 Provider。
