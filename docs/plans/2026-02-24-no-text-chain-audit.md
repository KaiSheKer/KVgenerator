# 无字底图 + 叠字链路审计与修复（2026-02-24）

## 1) 问题现象

1. 叠字结果像“文案窗”悬浮在图上，未跟底图结构融合。
2. runtime 无字模式下，原始底图仍出现大字/额外 logo。
3. 个别海报叠字缺失或可读性极低。

## 2) 链路审计（按执行顺序）

1. 图片生成提示词：
   - 入口：`lib/utils/promptGenerator.ts` -> `buildRuntimePromptEn`
   - 问题：旧 runtime 提示词存在“留白区/文字安全区/参数面板”等语义，诱发模型主动生成文本板或标题区域。
2. 文案生成提示词：
   - 入口：`buildOverlaySpecForPoster`
   - 问题：叠字内容过密（中英双语+多 bullet），导致覆盖区域过大，视觉像独立窗口。
3. 文案与图片合成逻辑：
   - 入口：`lib/utils/posterComposer.ts`
   - 问题：原先依赖强遮罩/大面积面板保证可读，牺牲融合感；在高亮背景下文本对比不足时，出现“看起来没字”。
4. 最终检查逻辑：
   - 入口：`lib/api/nanobanana.ts`
   - 问题：此前没有强制“无字审计”淘汰机制；新增审计后，初版出现“解析失败即放行”漏洞（导致漏检）。

## 3) 已执行修复

### A. runtime 生成提示词去“排版诱导”

文件：`lib/utils/promptGenerator.ts`

1. runtime 从 `buildStyleGrammar(...)` 切到 `buildRuntimeVisualGrammar(...)`，去掉 typography/layout 语义。
2. 强化硬约束：
   - `TEXT POLICY`：禁止任何额外文字。
   - `NO-LOGO POLICY`：禁止包材之外新增 logo/水印/徽章。
   - `OUTPUT CONSTRAINTS`：禁止 text board/title card/caption panel/poster-style cards。
3. 调整 03/06/09/10 等蓝图语义，移除“分栏/面板/步骤卡”倾向，改为自然场景表达。
4. 扩充 runtime negative，加入可读文字/字符/banner/panel 相关显式负词。

### B. overlay 从“浮窗”转向“贴图排版”

文件：`lib/utils/posterComposer.ts`

1. 移除全局可读性遮罩与大面板路径。
2. 新增候选区域评分（`pickBestOverlayArea` + `scoreAreaClutter`），优先在低纹理区域落字。
3. 叠字渲染改为描边文本（`drawTextWithOutline`），降低对整块底板依赖，减少“悬浮窗”感。
4. `loadImage` 对 data URL 关闭 `crossOrigin`，降低叠字合成失败概率。

### C. 最终无字审计改为强制门禁（fail-closed）

文件：`lib/api/nanobanana.ts`

1. 请求链路新增 `enforceNoText`：
   - 前端请求：`app/generate/page.tsx`
   - API route 透传：`app/api/generate/route.ts`
   - client 类型：`lib/api/client.ts`
2. 在图片生成成功后执行 `verifyNoTextPolicy(...)`：
   - 视觉模型审计输出 JSON（`responseMimeType: application/json`）。
   - 命中额外文字/额外 logo 即抛错淘汰候选。
3. 修复“解析失败放行”漏洞：
   - 代码块剥离 + JSON 提取 + 正则兜底解析。
   - 审计接口 429/503 短重试。
   - 审计不可用/解析失败不再放行（fail-closed）。

## 4) 本地验证记录

1. 静态校验：
   - `npm run typecheck` ✅
   - `npm run lint` ✅
   - `npm run build` ✅
2. 集成探针（同一坏提示词，要求大字与 logo）：
   - `enforceNoText=false` -> `/api/generate` 返回 200 ✅
   - `enforceNoText=true` -> `/api/generate` 返回 500，明确报：
     - `No-text policy violation: extra text; extra logo/watermark; found: SUNNY ORANGE ... confidence=0.98` ✅

## 5) 当前结论

1. “底图漏字/漏 logo” 的根因链路已闭环：从“无门禁”升级为“强制审计淘汰”。
2. “浮窗排版”已从强面板改为区域化描边排版，视觉割裂会明显下降。
3. 下一步仍需用你的真实 3 类集（01/04/09）复测主观观感，再决定是否推进 10 类全量。

