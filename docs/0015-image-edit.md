# 0015 — 图片编辑

> 产品要求以 [SPEC](./SPEC.md) 为准。实施状态见 [progress](./progress.md)，代码差距见
> [Mobile 待办](./0018-mobile-roadmap.md)。

## 目标与约定

图片编辑是产品的后续能力，当前阶段保留可见、可达的入口。在 Add
Sheet 提供“图片编辑 · 即将推出”，点击显示说明，当前不创建任务或上传图片。

完整能力包括：从相册选图、基于描述编辑、按目标比例扩图、画质增强、提取风格并保存账号私有预设。用户选择归档类型，成功图片保存到当前账号该类型下；风格提取的交付结果是可复用私有预设。

完整编辑交付时，上传授权、源图、任务、结果和预设均校验当前账号；Provider 不支持的模式明确提示。验证图片类型/大小、取消选图、上传失败、处理失败与重试。专业图层、批量及复杂蒙版编辑不在本期范围。

## 实现位置

- `apps/mobile/src/screens/existing-image-editor.tsx`
- `apps/mobile/src/components/edit/`
- `apps/server/src/routes/edit.ts`
- `apps/server/src/providers/`
- `apps/server/src/graph/nodes/wallpaper.nodes.ts`

## 当前状态

已有编辑组件、上传和 Provider 分支，但入口尚未接入；完整编辑未交付。E01 是当前入口待办，E02 是后续能力验收。

## 验收标准

- [ ] 当前：入口可见可达，标注即将推出，不发送上传/生成请求。
- [ ] 后续：编辑、扩图、增强逐项真实验证，结果归档正确。
- [ ] 后续：风格提取生成私有预设，并可用于下一次生成；A/B 数据互不可访问。
