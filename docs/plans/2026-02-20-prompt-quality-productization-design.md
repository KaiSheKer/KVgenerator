# KV Generator Prompt Productization Design (Demo-First)

## 1. 背景与目标

本次改造目标不是生产级稳定性，而是“演示级可观感质量最大化”。

当前链路已经完成流程化（识别 -> 风格 -> 提示词 -> 生成），但存在三个核心问题：

1. 还原失真：生成阶段只用文本，未强绑定参考图，导致包装和品牌细节漂移。
2. 提示词冲突：正向要求“保留文字/LOGO”，负面词却包含 `text/logo`。
3. 抽卡波动：单海报单次生成，缺少候选比较和质量选优。

本设计目标：

1. 保留“可展示方法论”的完整提示词（展示轨）。
2. 新增“面向模型执行”的短硬约束提示词（执行轨）。
3. 建立候选生成和选优机制，优先提升视觉稳定性。
4. 让海报 01/02/09 在演示中优先达到“可汇报质量”。

---

## 2. 设计原则（Demo 优先）

1. 少而硬：执行 Prompt 避免长段修辞，保留不可违背规则。
2. 双轨并存：页面展示完整中英提示词，API 执行优化版 Prompt。
3. 可解释：每张图都能说明“为什么这样生成（结构可读）”。
4. 高收益优先：先做参考图锁定、冲突消除、候选选优，不先做重工程。

---

## 3. 目标架构（Prompt Compiler）

### 3.1 双轨 Prompt 数据结构

每张海报的 Prompt 由两套内容组成：

1. `displayPromptZh` / `displayPromptEn`：用于 UI 展示和作品集讲解。
2. `runtimePromptEn`：用于真实生图调用，结构化短指令。

负面词同样分离：

1. `displayNegative`：展示版（可较完整）。
2. `runtimeNegative`：执行版（按海报类型最小冲突词集）。

### 3.2 执行 Prompt 的固定段落结构

每张海报 `runtimePromptEn` 统一由 8 段构成：

1. `TASK`  
示例：`Create a premium e-commerce hero poster for one product package.`

2. `REFERENCE LOCK`（强约束）  
明确上传图为唯一真值，不得修改包装轮廓、LOGO、色板、图标位置、主要文案区域。

3. `PRODUCT FACTS`  
品牌、品类、规格、卖点、颜色（仅关键字段，控制长度）。

4. `SHOT BLUEPRINT`  
画幅、机位、主体占比、视觉焦点、安全区（LOGO/CTA/文本区）。

5. `STYLE GRAMMAR`  
视觉风格 + 文字风格 + 光线 + 材质语法（高信号短语）。

6. `TEXT POLICY`  
默认轻文字：只生成短标题和短 CTA，避免长中文段落和复杂表格。

7. `QUALITY TARGET`  
商业广告质感目标：边缘清晰、主体完整、无裁切、无多产品污染。

8. `OUTPUT CONSTRAINTS`  
单包装、无替换品牌、无无关道具、避免脏乱背景。

---

## 4. 提取结果到 Prompt 的映射规则

### 4.1 字段优先级

1. 一级（必须可信）：`brandName`, `productType`, `colorScheme`, `specifications`
2. 二级（增强叙事）：`sellingPoints`, `designStyle`, `targetAudience`, `brandTone`
3. 三级（可缺省）：`packagingHighlights`, `parameters`

### 4.2 缺失值回退

1. 卖点不足 5 条时使用模板占位文案（已存在逻辑保留）。
2. 参数缺失时 Specs 海报只展示“核心参数块”而非完整表格。
3. 色值缺失时使用品牌主色 + 中性色回退。

---

## 5. 10 张海报的运行时蓝图（内容层级）

### 海报01 Hero（主 KV）
1. 目的：产品还原第一优先，品牌识别清晰。
2. 构图：产品占画面 55%-65%，背景弱化，主焦点在包装正面。
3. 文字策略：短标题 + CTA，不放长段文案。

### 海报02 Lifestyle（使用场景）
1. 目的：展示用户场景，但不牺牲包装清晰度。
2. 构图：产品主体居中或偏右，人物/场景作为辅助层。
3. 文字策略：一个主卖点 + CTA。

### 海报03 Process（工艺概念）
1. 目的：可视化卖点，不做复杂流程图。
2. 构图：产品 + 1~2 个信息图元素，避免信息拥堵。
3. 文字策略：标题 + 2 条短说明。

### 海报04 Detail-1（细节）
1. 目的：强调局部工艺与材质。
2. 构图：微距 + 浅景深，主体细节清晰。
3. 文字策略：极简短标题。

### 海报05 Detail-2（材质）
1. 目的：展示触感/纹理。
2. 构图：材质区域占比提高，背景保持干净。
3. 文字策略：短标签式文案。

### 海报06 Detail-3（功能）
1. 目的：功能点可感知。
2. 构图：产品主体 + 功能动作或结构示意。
3. 文字策略：1 主标题 + 1 副标题。

### 海报07 Detail-4 / Review（信任）
1. 目的：形成口碑与信任感。
2. 构图：产品主体 + 简洁信任元素（徽章/评分）。
3. 文字策略：短评句，不放大段评论。

### 海报08 Brand Story（品牌调性）
1. 目的：建立品牌情绪与色板一致性。
2. 构图：品牌氛围元素不遮挡包装。
3. 文字策略：品牌短句 + 英文短句。

### 海报09 Specs（参数）
1. 目的：参数清晰，不追求模型生成复杂中英文表格。
2. 构图：左右分区（产品区 + 参数区）。
3. 文字策略：短字段标签，复杂表格后处理可选。

### 海报10 Usage（使用指南）
1. 目的：步骤清晰，利于电商解释。
2. 构图：步骤卡片 3 步以内，箭头引导。
3. 文字策略：步骤短句，避免密集段落。

---

## 5.1 Runtime Prompt 示例（执行轨）

### 示例A：Hero（海报01）

```text
TASK: Create hero KV visual focused on product package fidelity.
REFERENCE LOCK: Use uploaded product image as single source of truth. Keep package silhouette, logo spelling/placement, color palette, icon positions, and label hierarchy unchanged.
PRODUCT FACTS: Brand RANOVA; Category Pet Food; Product Freeze-dried Chicken.
SHOT BLUEPRINT: Package front view dominant (55-65% frame), clean gradient backdrop, center-weighted composition. Aspect ratio 9:16 vertical.
STYLE GRAMMAR: editorial composition; bold serif hierarchy; bilingual stacked layout.
TEXT POLICY: One headline plus one CTA only.
QUALITY TARGET: Commercial ad quality, sharp edges, clear package front, no crop.
OUTPUT CONSTRAINTS: Single package only, no second brand, no fake label text.
```

### 示例B：Lifestyle（海报02）

```text
TASK: Create lifestyle scene while keeping product package as main subject.
REFERENCE LOCK: Preserve all package details exactly from reference image.
PRODUCT FACTS: Brand + product facts + key selling points.
SHOT BLUEPRINT: Product foreground, lifestyle context in background, no subject occlusion, ratio 9:16.
STYLE GRAMMAR: soft natural light; controlled color harmony; modern e-commerce clarity.
TEXT POLICY: One benefit line + CTA.
QUALITY TARGET: Product remains sharp and readable in scene context.
OUTPUT CONSTRAINTS: No face-dominant framing, no clutter, no multi-package.
```

### 示例C：Specs（海报09）

```text
TASK: Create specification-focused poster for key product parameters.
REFERENCE LOCK: Packaging identity remains unchanged.
PRODUCT FACTS: Include compact parameter snippets (net content, ingredients, nutrition, usage).
SHOT BLUEPRINT: Split layout (product zone + spec zone), high contrast readability, ratio 9:16.
STYLE GRAMMAR: clean grid structure; restrained visual accents.
TEXT POLICY: concise label-value snippets only, avoid dense bilingual table rendering.
QUALITY TARGET: clear hierarchy, easy scan in 3 seconds.
OUTPUT CONSTRAINTS: no handwritten noisy text, no broken grid, no tiny unreadable blocks.
```

---

## 6. 负面词体系重构（Runtime）

### 6.1 全局基准负面词

`wrong logo, altered packaging, different brand text, extra product package, duplicated product, cropped package, deformed package shape, noisy composition, oversaturated colors, blurry focus, low resolution, watermark, random characters, unreadable text, chaotic layout`

### 6.2 类型附加负面词

1. Hero：`busy background, dramatic distortion, tilted unreadable label`
2. Lifestyle：`subject occlusion, face-dominant framing, product out of focus`
3. Specs：`handwritten table, dense tiny text, broken grid`
4. Detail：`plastic fake texture, excessive bloom, over-sharpened halos`

### 6.3 冲突消除规则

1. 禁止在 runtime negative 中出现 `text` 和 `logo`（泛词）。
2. 所有 negative 必须是“错误形态”描述，而不是“功能对象”描述。

---

## 7. 候选生成与选优（Demo 模式）

### 7.1 质量模式

1. `fast`：每张 1 候选（最低成本）
2. `balanced`：每张 2 候选（默认）
3. `quality`：每张 3 候选（演示推荐）

### 7.2 自动选优评分（轻量规则）

用于演示的轻量选优，不做重模型评分：

1. 包装完整度（是否被裁切）
2. 中心构图稳定性（主体居中程度）
3. 图像清晰度代理（数据量与边缘清晰代理）
4. 负面触发惩罚（明显错标/错字/多包装）

先用规则分，后续可加 AI 评分器。

---

## 8. 用户流程与交互变更

1. 在提示词页面新增“生成质量模式”。
2. 保持“单张/多张/全部”选择能力。
3. 生成页显示“当前海报 + 当前候选序号”。
4. 结果页默认展示每张最佳候选，保留候选切换入口（后续可选）。

---

## 9. 演示验收标准

### 9.1 必达

1. 海报01、02、09 的产品包装一致性显著改善。
2. 错 Logo、错配色、错包装形态的概率明显下降。
3. 默认“balanced/quality”模式下，主观美感优于当前版本。

### 9.2 可选增强

1. Hero 海报支持“图生图后处理文本叠加”。
2. Specs 海报参数区改为前端渲染覆盖层。

---

## 10. 本设计不做的事项（本轮）

1. 生产级容错治理（熔断、复杂重试编排、配额治理）。
2. 全量 10 张海报都做文本后处理。
3. 复杂多模型协同评分流水线。

---

## 11. 下一步

该设计确认后，进入实施计划文档，按文件级任务拆解到可执行步骤，并附测试验证流程。
