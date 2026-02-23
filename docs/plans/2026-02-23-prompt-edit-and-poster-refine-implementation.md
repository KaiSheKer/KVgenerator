# 2026-02-23 Prompt Edit + Poster Refine Implementation

## 1. 实施范围
- Modify: `/Users/ericcao/CascadeProjects/kv-generator/app/prompts/page.tsx`
- Modify: `/Users/ericcao/CascadeProjects/kv-generator/app/gallery/page.tsx`
- Modify: `/Users/ericcao/CascadeProjects/kv-generator/app/generate/page.tsx`
- Modify: `/Users/ericcao/CascadeProjects/kv-generator/contexts/AppContext.tsx`

## 2. 任务拆解
### Task A: 提示词页英文 Prompt 可编辑
1. 增加 `editablePromptEnById` 本地状态。
2. 在 prompts 初始化后建立每张海报的编辑初值。
3. 英文 Prompt 区改为可编辑文本框。
4. 增加复制英文、恢复模板按钮。
5. 点击“开始生成”时，把编辑后的 Prompt 写回 `generatedPrompts` 快照。

完成标准：
- 切换海报时编辑值不丢失。
- 进入生成页后使用的是编辑值而不是模板默认值。

### Task B: 生成结果版本化（v1）
1. 扩展 `GeneratedPoster` 类型（versions + activeVersionId）。
2. 初次生成成功后写入 `v1` 版本结构。

完成标准：
- 旧逻辑兼容。
- 画廊卡片显示 active 版本图。

### Task C: 画廊详情支持单图二次优化
1. 在详情弹窗增加：
   - 版本切换按钮
   - 提示词详情折叠
   - 优化意见输入框与提交按钮
2. 生成请求使用：
   - 当前海报 Prompt
   - 当前版本图作为 reference image
   - 用户优化意见拼接指令
3. 成功后追加版本并切换到最新。
4. 失败后保留当前版本并展示错误信息。

完成标准：
- 单图二次优化可连续执行。
- 可在 v1/v2/v3 之间切换查看。

## 3. 验证步骤
1. Run: `npm --prefix /Users/ericcao/CascadeProjects/kv-generator run typecheck`
2. 手动验证流程：
   - 上传 -> 分析 -> 风格 -> 提示词
   - 编辑海报 01 英文 Prompt
   - 进入生成并查看画廊
   - 打开详情，输入优化意见，提交优化
   - 校验版本切换与下载
3. 失败路径验证：
   - 输入空意见
   - 模拟接口失败并确认旧版本未覆盖

## 4. 回滚策略
1. 若二次优化不稳定，可临时隐藏优化输入区，仅保留版本显示。
2. 若版本结构导致兼容问题，可退回单 `url` 模式并关闭版本切换 UI。
