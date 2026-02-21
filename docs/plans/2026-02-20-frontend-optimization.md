# KV Generator 前端优化执行文档（参考图驱动）

**日期**: 2026-02-20  
**关联设计文档**: `/Users/ericcao/CascadeProjects/kv-generator/docs/plans/2026-02-20-frontend-optimization-design.md`  
**执行状态**: 待执行

---

## 1. 执行目标

1. 将当前 UI 升级为深色霓虹工作台风格（对齐参考图）
2. 保持现有业务流程不变
3. 修复当前影响体验的前端行为不一致（生成数量、按钮文案、状态表现）

---

## 2. 执行范围

### 2.1 全局样式层

1. 更新 `app/globals.css`
- 深色霓虹主题 token
- 统一动画与阴影工具类
- 页面背景氛围层

2. 更新基础 UI 组件
- `components/ui/button.tsx`
- `components/ui/card.tsx`
- `components/ui/input.tsx`
- `components/ui/progress.tsx`

### 2.2 页面与业务样式层

1. 首页与上传区
- `app/page.tsx`
- `components/ImageUpload.tsx`

2. 风格 / 提示词 / 生成 / 画廊
- `app/style/page.tsx`
- `components/StyleCard.tsx`
- `app/prompts/page.tsx`
- `app/generate/page.tsx`
- `app/gallery/page.tsx`

### 2.3 行为一致性修复

1. 默认恢复按提示词数量生成（默认 10），允许环境变量限流调试
2. 画廊下载文案与实际行为一致（非 ZIP 时不得标注 ZIP）
3. 生成过程状态文本与真实任务一致

---

## 3. 实施步骤

### Step 1: 主题与基础组件

1. 重写全局 token 与背景层  
2. 统一按钮/卡片/输入框/进度条视觉语义  
3. 运行 `npm run lint`

### Step 2: 页面重构（视觉）

1. 首页改为双栏工作台语义布局  
2. 风格与提示词页统一暗色卡片系统  
3. 生成页与画廊页对齐参考图的展示结构  
4. 运行 `npm run lint`

### Step 3: 行为与文案修复

1. 生成数量改为可配置上限（默认全部）  
2. 下载全部文案修正  
3. 保持现有 API 流程兼容  
4. 运行 `npm run test`

---

## 4. 测试与验证设计

### 4.1 自动化验证

1. `npm run lint` 必须通过  
2. `npm run typecheck` 必须通过  
3. `npm run test`（lint + typecheck）必须通过

### 4.2 手工验证清单

1. 首页
- 上传卡片显示正常，拖拽/点击上传正常
- 上传后“开始分析”按钮可用

2. 分析到编辑链路
- 分析后能进入编辑页
- 编辑输入框可编辑并进入下一步

3. 风格与提示词
- 样式卡选中态明显
- 提示词切换、复制、翻页正常

4. 生成页
- 进度条和状态卡同步更新
- 失败时错误可见，不崩溃
- 生成数量默认与提示词数量一致（或符合配置）

5. 画廊页
- 缩略图可预览/下载
- “下载全部”文案与行为一致

### 4.3 验收口径

1. 视觉风格与参考图方向一致（深色霓虹、双栏工作台、渐变 CTA）
2. 业务流程完整可用
3. 自动化检查通过

