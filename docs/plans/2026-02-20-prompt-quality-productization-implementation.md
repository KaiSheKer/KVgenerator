# KV Prompt Quality Productization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在不引入重型生产复杂度的前提下，把 KV 生成链路改造成“演示级高质量”系统：参考图强绑定、双轨 Prompt、候选选优、质量模式可控。  

**Architecture:** 在 `promptGenerator` 中新增运行时 Prompt 编译层，保留展示 Prompt；在生图 API 层增加参考图输入；在生成流程中引入质量模式（1/2/3 候选）与自动选优。UI 只新增必要控制项，确保演示路径稳定。  

**Tech Stack:** Next.js 16、React 19、TypeScript、Gemini generateContent API（v1beta）。

---

## Scope

### In Scope
1. 双轨 Prompt 数据结构和编译逻辑。
2. 参考图输入生图 API。
3. 质量模式与候选选优。
4. Prompt 页面质量模式配置。
5. 生成页候选生成状态和最佳图输出。

### Out of Scope (本轮不做)
1. 生产级队列、熔断、复杂配额治理。
2. 复杂 AI 评分器（先用轻量规则选优）。
3. 全量长文本后处理渲染（先保持轻文本策略）。

---

### Task 1: 定义双轨 Prompt 与质量模式类型

**Files:**
- Modify: `contexts/AppContext.tsx`

**Step 1: 新增类型定义**

在上下文中新增：

```ts
export type GenerationQualityMode = 'fast' | 'balanced' | 'quality';
```

并为 `PosterPrompt` 增加：

```ts
runtimePromptEn?: string;
runtimeNegative?: string;
```

**Step 2: 扩展状态与动作**

新增 `selectedQualityMode` 状态和 `setSelectedQualityMode` action，默认值设为 `quality`（演示优先）。

**Step 3: 运行类型检查**

Run: `npm run typecheck`  
Expected: PASS（无新增 TS 报错）

**Step 4: Commit**

```bash
git add contexts/AppContext.tsx
git commit -m "feat: add runtime prompt and quality mode contracts"
```

---

### Task 2: 构建执行轨 Prompt 编译器骨架

**Files:**
- Modify: `lib/utils/promptGenerator.ts`

**Step 1: 为 runtime prompt 增加编译函数**

新增 `buildRuntimePromptEn(...)`，输出 8 段结构：
1. TASK
2. REFERENCE LOCK
3. PRODUCT FACTS
4. SHOT BLUEPRINT
5. STYLE GRAMMAR
6. TEXT POLICY
7. QUALITY TARGET
8. OUTPUT CONSTRAINTS

**Step 2: 展示轨保留**

保留原 `promptZh/promptEn`（用于 UI 展示），不破坏当前用户可读输出。

**Step 3: 运行时字段写入**

在返回的每张海报对象中写入：

```ts
runtimePromptEn: buildRuntimePromptEn(...),
runtimeNegative: buildRuntimeNegative(...),
```

**Step 4: 运行检查**

Run: `npm run test`  
Expected: PASS

**Step 5: Commit**

```bash
git add lib/utils/promptGenerator.ts
git commit -m "feat: add runtime prompt compiler with dual-track prompt outputs"
```

---

### Task 3: 重构负面词体系（去冲突）

**Files:**
- Modify: `lib/utils/promptGenerator.ts`

**Step 1: 建立全局 + 类型负面词函数**

新增：
1. `buildGlobalRuntimeNegative()`
2. `buildRuntimeNegativeByType(type)`

**Step 2: 删除冲突词**

确保 runtime negative 不含泛词 `text` / `logo`，改成错误形态词：
`wrong logo`, `altered packaging`, `random characters` 等。

**Step 3: 验证输出**

Run: `rg "runtimeNegative|text, logo|wrong logo|altered packaging" -n lib/utils/promptGenerator.ts`  
Expected: runtime negative 已包含新词，冲突词不在 runtime 集合内。

**Step 4: Commit**

```bash
git add lib/utils/promptGenerator.ts
git commit -m "feat: replace conflicting negatives with runtime-safe taxonomy"
```

---

### Task 4: 生图 API 增加参考图输入能力

**Files:**
- Modify: `lib/api/nanobanana.ts`

**Step 1: 扩展请求类型**

在 `GenerationRequest` 中新增：

```ts
referenceImage?: string;
```

**Step 2: 解析 data URL 并注入 parts**

当 `referenceImage` 存在时，向 Gemini 请求 `parts` 增加 `inline_data`：

```ts
{
  inline_data: { mime_type: "...", data: "..." }
}
```

保持 `text part` 仍为第一个元素。

**Step 3: 添加健壮性**

无法解析 data URL 时降级为纯文本请求，不抛 fatal。

**Step 4: 验证**

Run: `npm run typecheck`  
Expected: PASS

**Step 5: Commit**

```bash
git add lib/api/nanobanana.ts
git commit -m "feat: support reference image input for gemini image generation"
```

---

### Task 5: 生成流程接入 runtime prompt 与参考图

**Files:**
- Modify: `app/generate/page.tsx`

**Step 1: 读取 runtime 字段**

请求时优先：

```ts
prompt: poster.runtimePromptEn ?? poster.promptEn
negative: poster.runtimeNegative ?? poster.negative
```

**Step 2: 注入参考图**

从上下文读取 `uploadedImage?.preview`，传入 `referenceImage`。

**Step 3: 保持兼容**

无上传图时继续纯文本生图，不影响已有流程。

**Step 4: 验证**

Run: `npm run test`  
Expected: PASS

**Step 5: Commit**

```bash
git add app/generate/page.tsx
git commit -m "feat: use runtime prompts and reference image in generation pipeline"
```

---

### Task 6: 提示词页面增加质量模式配置

**Files:**
- Modify: `app/prompts/page.tsx`

**Step 1: 增加质量模式选项 UI**

新增三档：
1. 快速（1 候选）
2. 平衡（2 候选）
3. 精品（3 候选）

**Step 2: 状态持久化**

接入 `selectedQualityMode` / `setSelectedQualityMode`。

**Step 3: 生成按钮提示增强**

在按钮或说明区显示当前质量模式（便于演示解释）。

**Step 4: 验证**

Run: `npm run test`  
Expected: PASS

**Step 5: Commit**

```bash
git add app/prompts/page.tsx
git commit -m "feat: add quality mode selector on prompts step"
```

---

### Task 7: 候选生成与自动选优

**Files:**
- Modify: `app/generate/page.tsx`
- Modify: `contexts/AppContext.tsx` (如需保存候选列表)

**Step 1: 质量模式映射候选数**

```ts
fast -> 1
balanced -> 2
quality -> 3
```

**Step 2: 每张海报生成 N 候选**

对同一海报循环生成 N 次并收集 URL。

**Step 3: 轻量选优规则**

实现 `selectBestCandidate(urls)`，评分优先级：
1. 包装完整可见（裁切惩罚）
2. 清晰度代理（数据量/尺寸代理）
3. 脏图惩罚（明显异常字符/噪点代理）

输出最佳 URL 作为最终结果。

**Step 4: 状态与消息**

在加载文案中显示 `海报x 候选y/z`，提高可观测性。

**Step 5: 验证**

Run: `npm run test`  
Expected: PASS

**Step 6: Commit**

```bash
git add app/generate/page.tsx contexts/AppContext.tsx
git commit -m "feat: add multi-candidate generation and auto-selection by quality mode"
```

---

### Task 8: 10 张海报运行时蓝图差异化

**Files:**
- Modify: `lib/utils/promptGenerator.ts`

**Step 1: 按海报类型定义 blueprint**

为 10 张海报分别定义：
1. 目的句
2. 主体占比
3. 镜头规则
4. 文本策略
5. 场景限制

**Step 2: 接入 style grammar**

将视觉风格、文字风格、排版格式映射成高信号短语集合，不再堆叠修辞。

**Step 3: 接入 aspect ratio**

runtime prompt 明确比例和方向，保证与 UI 选择一致。

**Step 4: 验证**

Run: `npm run test`  
Expected: PASS

**Step 5: Commit**

```bash
git add lib/utils/promptGenerator.ts
git commit -m "feat: add per-poster runtime blueprints and concise style grammar"
```

---

### Task 9: 文档与示例输出校对

**Files:**
- Modify: `docs/plans/2026-02-20-prompt-quality-productization-design.md`
- Create: `docs/plans/2026-02-20-prompt-quality-productization-validation.md`

**Step 1: 补充示例**

给 Hero/Lifestyle/Specs 各补一段 runtime prompt 示例。

**Step 2: 补充手工验证脚本**

记录“同一产品生成前后 A/B 对比”的操作步骤与截图位点。

**Step 3: Commit**

```bash
git add docs/plans/2026-02-20-prompt-quality-productization-design.md docs/plans/2026-02-20-prompt-quality-productization-validation.md
git commit -m "docs: add runtime prompt examples and validation playbook"
```

---

### Task 10: 最终测试与验收

**Files:**
- No code changes required

**Step 1: 静态检查**

Run:
1. `npm run lint`
2. `npm run typecheck`

Expected: 全部 PASS

**Step 2: 流程烟雾测试**

手工路径：
1. 上传产品图
2. 选择风格/比例
3. 在提示词页选择 `quality`
4. 仅生成海报 01/02/09
5. 检查包装还原、构图清晰、文字可读

**Step 3: 对比验收**

与改造前做同 prompt 对比，至少满足：
1. 包装一致性提升
2. 错 LOGO/错色概率降低
3. 主观美感更稳定

**Step 4: 发布说明**

整理“演示讲解口径”：
1. 双轨 Prompt
2. 参考图锁定
3. 候选选优
4. 质量模式

---

## Testing & Validation Matrix

1. 功能回归：上传、分析、风格选择、提示词预览、生成、画廊下载。
2. 质量功能：质量模式切换是否生效（候选数变化）。
3. Prompt 正确性：runtime prompt 包含 8 段结构，且不包含冲突 negative。
4. API 兼容：有图/无图两种请求都可生成。
5. 性能感知：`quality` 模式耗时可接受，UI 进度有反馈。

---

## Rollout Strategy

1. 第一阶段启用 `balanced` 为默认，`quality` 用于演示关键样例。
2. 若配额压力高，快速切回 `fast` 模式。
3. 关键演示场景固定使用海报 01/02/09 先验证效果，再扩到 10 张。

---

Plan complete and saved to `docs/plans/2026-02-20-prompt-quality-productization-implementation.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration  
**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints
