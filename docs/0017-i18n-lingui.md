# 0017 — Lingui 国际化

> 产品要求以 [SPEC](./SPEC.md) 为准。实施状态见 [progress](./progress.md)，代码差距见
> [Mobile 待办](./0018-mobile-roadmap.md)。

## 目标与约定

共享国际化资源集中在 packages/i18n，支持英文 en 与简体中文 zh-CN，各端分别加载目录。Mobile 按本地显式偏好优先、系统语言其次选择语言，其他语言回退英文；Profile 切换后立即生效。

语言是本地界面偏好，不承担壁纸业务归属。用户输入的提示词、类型名称不自动翻译。静态 UI、无障碍标签、权限提示、空态、错误和编辑占位文案均需中英文。

使用 Lingui 宏与预编译目录；.po 为翻译源，编译产物由脚本生成。Landing 使用语言路由；文案能力承诺以 SPEC 为准。根 i18n:extract、i18n:compile、i18n:check 脚本维护目录。

## 实现位置

- `packages/i18n/`
- `apps/mobile/src/components/i18n-provider.tsx`
- `apps/mobile/src/stores/locale-store.ts`
- `apps/mobile/src/screens/profile.tsx`

## 当前状态

共享包、Mobile Provider、语言 store 和 Profile 切换已存在；新增产品文案与布局验证见 U04。

## 验收标准

- [ ] 类型选择、生成反馈、账号错误和编辑占位的中英文完整。
- [ ] 切换立即生效，重启保留选择；用户类型名和提示词不改变。
- [ ] 大字号、长译文与读屏可用；目录提取/编译检查通过。
