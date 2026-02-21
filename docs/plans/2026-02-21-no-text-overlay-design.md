# KV 无字生图 + 前端叠字设计文档

## 1. 目标与范围

目标：
1. 彻底规避模型生成中文营销文案导致的乱码问题。
2. 保持现有生成流程不变（上传 -> 分析 -> 选风格 -> 生成 -> 画廊）。
3. 在演示中可对比“AI 原图（无字）”和“前端叠字成品图”。

范围（本轮）：
1. 统一改为“无字生图 + 前端叠字”链路。
2. 海报 01/02/09 提供更强叠字模板；其余海报使用通用模板兜底。
3. 新增本地 Canvas 合成能力与 overlay 数据结构。

不做：
1. 服务端图片合成。
2. 富文本排版编辑器。
3. 完整字体资产管理与商用字体嵌入。

---

## 2. 总体架构

### 2.1 现状问题

当前生成流程是：
1. `promptGenerator` 输出展示 prompt + runtime prompt。
2. `generate/page.tsx` 调用 Gemini 返回图片 URL。
3. 结果直接写入 `generatedPosters.url`。

问题在于：
1. runtime prompt 仍允许模型渲染营销文字。
2. 输出阶段没有“后处理合成”层。

### 2.2 新架构

新流程：
1. Prompt 层：runtime prompt 明确“禁止渲染额外营销文案”。
2. 生成层：获得无字原图 `rawUrl`。
3. 合成层：`posterComposer` 根据 `overlaySpec` 在前端 Canvas 叠字。
4. 结果层：保存 `rawUrl` 和 `url(final)`。
5. 展示层：画廊默认用 `url(final)`，详情支持切换查看 `rawUrl`。

---

## 3. 数据结构设计

### 3.1 PosterPrompt 扩展

在 `contexts/AppContext.tsx` 中为 `PosterPrompt` 增加：
1. `overlaySpec?: PosterOverlaySpec`

`PosterOverlaySpec` 建议结构：
1. `layout`: `'hero' | 'lifestyle' | 'specs' | 'generic'`
2. `titleZh` / `titleEn`
3. `subtitleZh?` / `subtitleEn?`
4. `bullets?: Array<{ zh: string; en: string }>`
5. `ctaZh?` / `ctaEn?`
6. `logoText?`
7. `palette?: { primary: string; secondary: string; accent: string; textOnDark: string }`

### 3.2 GeneratedPoster 扩展

在 `GeneratedPoster` 中增加：
1. `rawUrl?: string`（模型原图）
2. `overlayApplied?: boolean`

说明：
1. `url` 继续作为最终展示图，兼容现有页面逻辑。
2. 若叠字失败则 `url=rawUrl` 并 `overlayApplied=false`。

---

## 4. Prompt 设计调整

### 4.1 runtime prompt 改造

`buildRuntimePromptEn` 的 `TEXT POLICY` 从“短文本”改为“无文本”：
1. 禁止额外 headline/body/CTA。
2. 仅允许保留参考图产品包装自身印刷内容。

### 4.2 runtime negative 补强

追加无字相关负面词：
1. `floating headline text`
2. `marketing slogan overlay`
3. `random typography blocks`
4. `subtitle banners`

---

## 5. 前端合成引擎设计

新增文件：`lib/utils/posterComposer.ts`

核心 API：
1. `composePosterWithOverlay({ imageUrl, width, height, spec }): Promise<{ dataUrl: string; applied: boolean }>`

渲染步骤：
1. 载入原图到 Canvas。
2. 绘制渐变遮罩（提升文字可读性，避免挡主体）。
3. 按模板绘制：
   - 标题（中文较大、英文较小）
   - 副标题
   - 卖点列表（最多 3 条）
   - CTA 按钮
4. 导出 `dataUrl`。

容错：
1. 图片跨域或 Canvas 导出失败时，返回 `applied=false`，不阻塞主流程。

---

## 6. 页面与流程改造

### 6.1 generate 页

在 `app/generate/page.tsx`：
1. 候选判优选中最佳 `rawUrl` 后执行 `composePosterWithOverlay`。
2. 保存：
   - `url`: 合成图（或降级原图）
   - `rawUrl`: 原图
   - `overlayApplied`: 是否成功叠字

### 6.2 gallery 页

在 `app/gallery/page.tsx`：
1. 网格与下载默认使用 `url(final)`。
2. 查看详情弹窗新增“成品图/原图”切换按钮（仅当 `rawUrl` 存在）。

---

## 7. 风险与缓解

风险：
1. Canvas 导出失败（跨域/taint）。
2. 某些比例下文字位置不理想。
3. mock 模式图片源可能不允许导出。

缓解：
1. 叠字失败自动回退原图，不影响出图。
2. 采用归一化布局 + 安全区，先覆盖 01/02/09。
3. 在验证文档中增加 mock 与真实 API 双路径检查。

---

## 8. 验收标准

1. 生成链路中 runtime prompt 已切换为“无营销文案渲染”策略。
2. 画廊默认图为前端叠字成品图。
3. 详情页可切换查看原图与成品图。
4. `npm run test` 与 `npm run build` 通过。
5. 本地可部署访问并完成端到端验证。

