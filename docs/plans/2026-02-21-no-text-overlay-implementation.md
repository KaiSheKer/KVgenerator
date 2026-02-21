# KV 无字生图 + 前端叠字实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将生图链路改造成“模型只出无字底图，前端统一叠字成品图”，显著提升中文可读性与排版一致性。  

**Architecture:** 在 `promptGenerator` 注入无字约束与 `overlaySpec`；在 `generate` 页面拿到原图后调用 Canvas 合成器产出最终图；在 `gallery` 页面支持成品/原图切换预览。  

**Tech Stack:** Next.js 16、React 19、TypeScript、Canvas 2D API、Gemini generateContent API。

---

## Scope

### In Scope
1. runtime prompt 无字策略。
2. `overlaySpec` 数据结构与模板生成。
3. 前端 Canvas 叠字合成器。
4. 生成流程接入（raw + final）。
5. 画廊页成品/原图切换。

### Out of Scope
1. 服务端合成。
2. 可视化排版编辑器。
3. 批量字体资源管理。

---

### Task 1: 扩展类型定义（Overlay + Raw）

**Files:**
- Modify: `contexts/AppContext.tsx`

**Step 1: 新增 Overlay 类型**

新增：
1. `PosterOverlayPalette`
2. `PosterOverlaySpec`

**Step 2: 扩展 Prompt 与结果类型**

1. `PosterPrompt` 增加 `overlaySpec?: PosterOverlaySpec`
2. `GeneratedPoster` 增加：
   - `rawUrl?: string`
   - `overlayApplied?: boolean`

**Step 3: 类型检查**

Run: `npm run typecheck`  
Expected: PASS

---

### Task 2: Prompt 编译器接入无字策略与 overlaySpec

**Files:**
- Modify: `lib/utils/promptGenerator.ts`

**Step 1: runtime prompt 文本策略改造**

在 `buildRuntimePromptEn` 的 `TEXT POLICY` 中改为：
1. 禁止额外营销文案渲染。
2. 仅保留参考图包装自身印刷内容。

**Step 2: runtime negative 增加无字约束词**

在 `buildRuntimeNegativeByType` 中追加：
1. `floating headline text`
2. `marketing slogan overlay`
3. `random typography blocks`
4. `subtitle banners`

**Step 3: 新增 overlaySpec 生成函数**

新增：
1. `buildOverlaySpecForPoster(...)`
2. 按海报 id 生成 hero/lifestyle/specs/generic 模板数据。

**Step 4: 回填到 posters 结果**

在 `postersWithRuntime` 映射中写入 `overlaySpec`。

**Step 5: 验证**

Run: `npm run test`  
Expected: PASS

---

### Task 3: 新增前端叠字合成器

**Files:**
- Create: `lib/utils/posterComposer.ts`

**Step 1: 建立图片载入与 Canvas 初始化**

实现：
1. `loadImage(url)` Promise 封装
2. `createCanvas(width, height)` 与 context 获取

**Step 2: 叠字绘制能力**

实现：
1. 顶部标题（中英层级）
2. 副标题
3. 卖点列表（最多 3 条）
4. CTA 药丸按钮

**Step 3: 模板布局**

实现：
1. `hero` 模板
2. `lifestyle` 模板
3. `specs` 模板
4. `generic` 兜底模板

**Step 4: 导出与降级**

导出：
1. 返回 `{ dataUrl, applied: true }`
2. 出错时返回 `{ dataUrl: originalUrl, applied: false }`

**Step 5: 验证**

Run: `npm run typecheck`  
Expected: PASS

---

### Task 4: 生成流程接入合成器（raw -> final）

**Files:**
- Modify: `app/generate/page.tsx`

**Step 1: 引入合成器**

在候选选优完成后，调用：
`composePosterWithOverlay({ imageUrl: bestRawUrl, width, height, spec })`

**Step 2: 结果写入**

每张海报写入：
1. `rawUrl: bestRawUrl`
2. `url: composed.dataUrl`
3. `overlayApplied: composed.applied`

**Step 3: 兼容策略**

无 `overlaySpec` 或合成失败时，`url` 回退 `rawUrl`，流程不中断。

**Step 4: 验证**

Run: `npm run test`  
Expected: PASS

---

### Task 5: 画廊页支持成品/原图切换

**Files:**
- Modify: `app/gallery/page.tsx`

**Step 1: 增加预览模式状态**

新增：
1. `previewMode: 'final' | 'raw'`

**Step 2: 详情页切换按钮**

在弹窗头部加入按钮组：
1. 查看成品图（默认）
2. 查看 AI 原图（`rawUrl` 存在时可切换）

**Step 3: 下载行为**

默认下载成品图；可在原图模式下载原图。

**Step 4: 验证**

Run: `npm run test`  
Expected: PASS

---

### Task 6: 配置与文档更新

**Files:**
- Modify: `.env.example`
- Create: `docs/plans/2026-02-21-no-text-overlay-validation.md`

**Step 1: 配置说明**

新增说明：
1. 默认不允许 flash 回退（保持中文质量）
2. `NEXT_PUBLIC_ALLOW_FLASH_FALLBACK` 用于显式开关

**Step 2: 验证文档**

编写手工验证脚本，覆盖：
1. 无字底图是否生效
2. 前端叠字是否稳定
3. 详情页是否可切换原图/成品图

---

### Task 7: 最终测试与本地部署

**Files:**
- No code changes required

**Step 1: 静态验证**

Run:
1. `npm run lint`
2. `npm run typecheck`

Expected: PASS

**Step 2: 构建验证**

Run: `npm run build`  
Expected: PASS

**Step 3: 本地部署**

Run: `npm start`  
Expected: `http://localhost:3000` 可访问，流程可用

---

## Testing Matrix

1. 流程回归：上传 -> 分析 -> 风格 -> 提示词 -> 生成 -> 画廊。
2. 文案稳定：同输入重复生成，中文标题无乱码。
3. 预览切换：详情页可切换 `final/raw`，缩放拖拽仍可用。
4. 下载正确：final/raw 下载内容匹配当前模式。
5. 容错：Canvas 合成失败时仍展示原图，不中断流程。

