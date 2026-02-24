# 3类快速验证（01/04/09）

## 目标

在最小成本下验证核心方向：

1. 质量问题主要来自 AI 直接出字，还是来自后期叠字质量不足。
2. `runtimePrompt/runtimeNegative` 与 `legacy prompt/negative` 的实际差异是否显著。
3. 是否值得推进到 10 类全量改造。

---

## 验证前准备

1. 使用同一张产品图。
2. 海报类型固定为：`01`（主KV）、`04`（细节）、`09`（参数）。
3. 质量模式固定为 `quality`（每张 3 候选）。
4. 在提示词页点击 `快速预设 01/04/09`。

---

## 三种链路模式

1. `AI原生出字`（legacy_ai_text）
2. `无字底图`（runtime_no_text）
3. `无字+叠字`（runtime_overlay）

每种模式跑 2 轮，避免偶然性。

总样本数：`3类 × 3模式 × 2轮 = 18`。

---

## 记录口径（每张图）

评分区间：`1-5`（5最好）

1. 产品还原度（logo/包装/颜色/形体）
2. 文字可读性（中文正确、字号、对比度）
3. 版式一致性（层级、对齐、留白稳定）
4. 重复稳定性（两轮波动）

建议补充备注：

1. 是否出现乱码/伪字
2. 是否出现背景脏乱或主体裁切
3. 是否出现叠字压主体的问题

---

## 验证表（可复制）

| Mode | Poster | Run | Fidelity | Readability | Layout | Stability | Notes |
|---|---|---|---:|---:|---:|---:|---|
| legacy_ai_text | 01 | 1 |  |  |  |  |  |
| legacy_ai_text | 01 | 2 |  |  |  |  |  |
| legacy_ai_text | 04 | 1 |  |  |  |  |  |
| legacy_ai_text | 04 | 2 |  |  |  |  |  |
| legacy_ai_text | 09 | 1 |  |  |  |  |  |
| legacy_ai_text | 09 | 2 |  |  |  |  |  |
| runtime_no_text | 01 | 1 |  |  |  |  |  |
| runtime_no_text | 01 | 2 |  |  |  |  |  |
| runtime_no_text | 04 | 1 |  |  |  |  |  |
| runtime_no_text | 04 | 2 |  |  |  |  |  |
| runtime_no_text | 09 | 1 |  |  |  |  |  |
| runtime_no_text | 09 | 2 |  |  |  |  |  |
| runtime_overlay | 01 | 1 |  |  |  |  |  |
| runtime_overlay | 01 | 2 |  |  |  |  |  |
| runtime_overlay | 04 | 1 |  |  |  |  |  |
| runtime_overlay | 04 | 2 |  |  |  |  |  |
| runtime_overlay | 09 | 1 |  |  |  |  |  |
| runtime_overlay | 09 | 2 |  |  |  |  |  |

---

## 升级到10类全量的门槛

满足任一条即可进入 10 类验证：

1. `runtime_overlay` 在“文字可读性”和“版式一致性”上平均分领先 `legacy_ai_text` 至少 `+1.0`。
2. `runtime_no_text` 的产品还原度明显优于 `legacy_ai_text`，说明 AI 端“去文字负担”有效。

若不满足：

1. 先修 `overlaySpec` 覆盖和布局逻辑，再重跑 3 类快速验证。
