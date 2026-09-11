# 0002 — 账号、类型与壁纸数据模型

> 产品要求以 [SPEC](./SPEC.md) 为准。实施状态见 [progress](./progress.md)，代码差距见
> [Mobile 待办](./0018-mobile-roadmap.md)。

## 目标与约定

Prisma +
PostgreSQL 管理 User、Category、Preset、Wallpaper。User.clerkUserId 唯一；Category 含 id、userId、name、normalizedName，同一账号内 normalizedName 唯一。Wallpaper.userId 与 categoryId 为必填，且所选类型必须属于同一账号。Preset 为内置或账号私有。

Wallpaper 保存 presetId、mode、prompt、源图与结果 object
key、实际宽高、status、quality、favorite 和错误信息。任务记录与作品可以共用 Wallpaper，但成功作品查询只计 succeeded 且有可用产物的记录。类型/作品/收藏查询索引以 userId 为首要归属字段。

所有持久化标量映射 snake_case 列（@map），关系导航字段不加 @map；每个模型含 createdAt、updatedAt 和 @@map。数据库约束或事务必须确保作品与类型的账号一致。源图元数据也必须登记所有者。

开发数据库、建库脚本、Prisma 类型与测试夹具采用同一目标结构，不承担历史数据或旧客户端兼容义务。根目录 db:generate、db:migrate、db:deploy、db:reset、db:seed 等脚本用于对应数据库操作。

## 实现位置

- `apps/server/prisma/schema.prisma`
- `apps/server/prisma/seed.ts`
- `apps/server/src/lib/db.ts`

## 当前状态

目标账号/类型结构尚未全部落实，见 A02、A03、C01。

## 验收标准

- [ ] 首次登录用户可直接建任务，userId 不为空。
- [ ] A/B 同名类型独立，跨账号 categoryId 写入被拒绝。
- [ ] 建库、种子及外键约束可重复验证；类型计数只含成功作品。
