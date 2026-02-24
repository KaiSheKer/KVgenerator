# KV 三模式快速验证 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 增加可观测三模式生成链路，完成 3 类海报快速对照验证，为是否推进 10 类全量改造提供证据。  

**Architecture:** 在状态层新增 `generationMode`；提示词页负责模式与 3 类预设选择；生成页按模式分流执行并写入诊断字段；画廊展示诊断信息，验证链路真实性。  

**Tech Stack:** Next.js 16, React 19, TypeScript, Canvas 2D API, Gemini generateContent API。

---

### Task 1: 扩展状态与类型

**Files:**
- Modify: `contexts/AppContext.tsx`

**Step 1: 定义生成模式类型**

新增：

```ts
export type GenerationPipelineMode =
  | 'legacy_ai_text'
  | 'runtime_no_text'
  | 'runtime_overlay';
```

**Step 2: 扩展全局状态与 actions**

新增：

1. `selectedGenerationMode`（默认 `legacy_ai_text`）
2. `setSelectedGenerationMode`

**Step 3: 扩展结果诊断字段**

`GeneratedPoster` 新增：

1. `generationMode?: GenerationPipelineMode`
2. `promptSource?: string`
3. `negativeSource?: string`

**Step 4: 验证**

Run: `npm run typecheck`  
Expected: PASS

---

### Task 2: 提示词页接入模式开关与快速预设

**Files:**
- Modify: `app/prompts/page.tsx`

**Step 1: 增加模式选项 UI**

新增三种模式按钮：

1. AI原生出字
2. 无字底图
3. 无字+叠字

并通过 `setSelectedGenerationMode` 持久化。

**Step 2: 增加“3类快速预设”**

新增预设按钮，一键选择 `01/04/09`。

**Step 3: 显示当前配置**

开始生成按钮显示：

`海报数量 + 质量模式 + 生成链路模式`

**Step 4: 验证**

Run: `npm run lint`  
Expected: PASS

---

### Task 3: 生成页按模式真实分流

**Files:**
- Modify: `app/generate/page.tsx`
- Use: `lib/utils/posterComposer.ts`

**Step 1: 增加 prompt 解析函数**

实现 `resolvePromptExecution(poster)`：

1. legacy -> `promptEn/negative`
2. runtime -> `runtimePromptEn/runtimeNegative`（缺失回退到 legacy）

**Step 2: 按模式分流生成**

1. 生成请求使用上一步解析后的 prompt/negative。
2. `runtime_overlay` 执行 `composePosterWithOverlay`。

**Step 3: 写入诊断结果**

每张图写入：

1. `rawUrl`（runtime 模式）
2. `overlayApplied`
3. `generationMode`
4. `promptSource`
5. `negativeSource`

**Step 4: 记录运行日志**

每张图输出一行诊断日志，包含 `poster id / mode / prompt source / negative source / overlay`。

**Step 5: 验证**

Run:

1. `npm run typecheck`
2. `npm run build`

Expected: PASS

---

### Task 4: 画廊增加链路诊断展示

**Files:**
- Modify: `app/gallery/page.tsx`

**Step 1: 卡片角标显示生成模式**

便于快速确认每张图实际来自哪个链路。

**Step 2: 详情页显示诊断来源**

显示：

1. 链路模式
2. `promptSource`
3. `negativeSource`

**Step 3: 验证**

Run: `npm run lint`  
Expected: PASS

---

### Task 5: 快速验证文档与评分口径

**Files:**
- Create: `docs/plans/2026-02-24-3mode-quick-validation.md`

**Step 1: 固定实验规模**

定义 `3类 × 3模式 × 2轮 = 18`。

**Step 2: 定义评分指标**

1. 产品还原度
2. 文字可读性
3. 版式一致性
4. 重复稳定性

**Step 3: 定义晋级门槛**

达到门槛后进入 10 类全量验证，否则先优化叠字模板再重测。

**Step 4: 验证**

Run: `npm run test`  
Expected: PASS

---

### Task 6: 运行与结论产出

**Files:**
- No code changes required

**Step 1: 执行快速验证**

按文档跑 18 张结果并记录评分表。

**Step 2: 输出结论**

1. 是否通过门槛
2. 是否进入 10 类全量
3. 若不通过，阻塞项在哪一段（AI阶段或叠字阶段）

**Step 3: 复核**

Run: `npm run build`  
Expected: PASS

---

Plan complete and saved to `docs/plans/2026-02-24-3mode-quick-validation-implementation.md`. Two execution options:

1. Subagent-Driven (this session) - I dispatch fresh subagent per task, review between tasks, fast iteration
2. Parallel Session (separate) - Open new session with executing-plans, batch execution with checkpoints

Which approach?
