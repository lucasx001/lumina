# 0009 — Add 与创建 Sheet

> 产品要求以 [SPEC](./SPEC.md) 为准。实施状态见 [progress](./progress.md)，代码差距见
> [Mobile 待办](./0018-mobile-roadmap.md)。

## 目标与约定

点击 Add 打开 Bottom
Sheet，依次选择风格、填写简单提示词、选择账号内类型，生成一张壁纸。类型选择器支持已有类型及新建类型，规则见 SPEC。高级情绪/色调和画质设置不阻碍主流程。

Sheet 可下滑关闭、按钮关闭及系统返回，输入适配键盘。生成前明确校验风格、提示词与类型；提交期间防重复请求，限流显示等待时间，失败可重试。

已提交任务归属于账号并可恢复，关闭或重开 Sheet 不丢任务。成功后显示“已保存到 {类型}”，更新类型卡片和作品列表，并提供单图预览/类型详情入口。

保留次级图片编辑入口，标注即将推出，当前进入占位说明。

## 实现位置

- `apps/mobile/src/app/create-wallpaper.tsx`
- `apps/mobile/src/screens/create-wallpaper.tsx`
- `apps/mobile/src/components/create/`
- `apps/mobile/src/hooks/use-generate.ts`
- `apps/mobile/src/lib/create-wallpaper-session.ts`

## 当前状态

Sheet 与生成基础已有；风格必选、类型选择、任务恢复、归档导航、编辑入口见 C01–C04、E01。

## 验收标准

- [ ] 主流程只需风格、提示词和类型，点击生成产出一张作品。
- [ ] 下滑/返回/键盘行为和生成中的关闭重开通过验证。
- [ ] 成功可从首页类型找到该作品，编辑占位入口可达。
