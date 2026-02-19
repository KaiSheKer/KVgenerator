# 电商 KV 海报生成工具设计文档

**日期:** 2026-02-19
**项目名称:** KV Generator
**版本:** v1.0
**状态:** 设计阶段

---

## 目录

1. [项目概述](#项目概述)
2. [技术架构](#技术架构)
3. [核心功能模块](#核心功能模块)
4. [数据流设计](#数据流设计)
5. [UI 组件系统](#ui-组件系统)
6. [错误处理](#错误处理)
7. [用户体验优化](#用户体验优化)
8. [项目结构](#项目结构)
9. [开发计划](#开发计划)

---

## 项目概述

### 核心价值

帮助电商卖家通过上传产品图片,自动生成 10 张 9:16 竖版电商主视觉海报的完整提示词系统,并调用 AI 图像生成 API 直接生成海报。

### 目标用户

- 电商卖家
- 运营人员
- 设计师

### 使用场景

快速为产品创建一套完整的电商视觉素材,适用于:
- 淘宝/天猫商品主图
- 抖音/小红书种草文案配图
- 微信朋友圈推广素材
- 电商活动促销海报

---

## 技术架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                    用户浏览器                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │         Next.js 前端应用                         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐      │   │
│  │  │图片上传  │→ │信息编辑  │→ │风格选择  │      │   │
│  │  └──────────┘  └──────────┘  └──────────┘      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐      │   │
│  │  │AI 分析   │→ │提示词生成│→ │海报生成  │      │   │
│  │  └──────────┘  └──────────┘  └──────────┘      │   │
│  └─────────────────────────────────────────────────┘   │
│                         ↓                               │
└─────────────────────────┼─────────────────────────────┘
                          │
                    ┌─────┴─────┐
                    │  HTTPS    │
                    └─────┬─────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              外部 API 服务                               │
│  ┌──────────────────┐      ┌──────────────────┐        │
│  │ Gemini Nano      │      │ Nano Banana      │        │
│  │ Banana Pro       │      │ Pro (图像生成)   │        │
│  │ (图像分析+文本)  │      │                  │        │
│  └──────────────────┘      └──────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

### 技术栈

#### 前端
- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **UI 组件库**: shadcn/ui
- **状态管理**: React Context API
- **图标**: Lucide React

#### 后端
- **API 路由**: Next.js API Routes
- **图像分析**: Gemini Nano Banana Pro API
- **图像生成**: Nano Banana Pro API

#### 数据存储
- **本地存储**: localStorage
- **会话管理**: Session Manager (带过期时间)

#### 部署
- **平台**: Vercel
- **域名**: 自定义域名(可选)
- **HTTPS**: 自动配置

---

## 核心功能模块

### 模块 1: 图片上传

**功能描述**: 用户上传产品图片,支持拖拽和点击上传

**数据结构**:
```typescript
interface UploadedImage {
  id: string;
  file: File;
  preview: string; // base64 预览
  url: string; // 上传后的 URL
}
```

**核心特性**:
- ✅ 拖拽上传
- ✅ 点击上传
- ✅ 图片预览
- ✅ 大小限制(最大 10MB)
- ✅ 格式限制(JPG、PNG、WEBP)
- ✅ 自动压缩优化
- ✅ 重新上传

**UI 布局**:
```
┌──────────────────────────────────────────┐
│         📸 上传产品图片                   │
│                                          │
│   ┌─────────────────────────────┐        │
│   │     拖拽图片到此处           │        │
│   │     或点击上传               │        │
│   │                             │        │
│   │   支持 JPG、PNG、WEBP        │        │
│   │   最大 10MB                  │        │
│   └─────────────────────────────┘        │
│                                          │
│              [开始分析] 按钮              │
└──────────────────────────────────────────┘
```

---

### 模块 2: AI 信息提取

**功能描述**: 调用 Gemini API 分析产品图片,提取所有必要信息

**数据结构**:
```typescript
interface AnalysisResponse {
  brandName: {
    zh: string;
    en: string;
  };
  productType: {
    category: string; // 大类
    specific: string; // 具体产品
  };
  specifications: string;
  sellingPoints: Array<{
    zh: string;
    en: string;
  }>;
  colorScheme: {
    primary: string[];
    secondary: string[];
    accent: string[];
  };
  designStyle: string;
  targetAudience: string;
  brandTone: string;
  packagingHighlights: string[];
  parameters: {
    netContent: string;
    ingredients: string;
    nutrition: string;
    usage: string;
    shelfLife: string;
    storage: string;
  };
  recommendedStyle: string;
  recommendedTypography: string;
}
```

**AI 提取内容**:
1. ✅ 品牌名称识别(中英文)
2. ✅ 产品类型判断
3. ✅ 卖点提取(5个核心卖点)
4. ✅ 配色方案分析(RGB/HEX)
5. ✅ 设计风格判断
6. ✅ 目标受众推断
7. ✅ 产品参数提取
8. ✅ 包装亮点识别

**UI 布局**:
```
┌──────────────────────────────────────────┐
│  ⏳ AI 正在分析产品图片...                │
│                                          │
│  ████████████░░░░░░░░ 60%               │
│                                          │
│  • 识别品牌名称... ✓                      │
│  • 提取产品信息... ✓                      │
│  • 分析配色方案... 🔄 进行中              │
│  • 识别设计风格... ⏳ 等待中              │
└──────────────────────────────────────────┘
```

---

### 模块 3: 信息编辑

**功能描述**: 用户查看 AI 提取的信息,可以编辑或补充

**核心特性**:
- ✅ 所有字段可编辑
- ✅ 卖点支持拖拽排序
- ✅ 卖点可以添加/删除
- ✅ 配色可以点击选择器修改
- ✅ 实时保存到 localStorage

**UI 布局**:
```
┌──────────────────────────────────────────┐
│  📝 编辑产品信息                          │
│                                          │
│  ┌─────┐  ┌──────────────────────────┐  │
│  │产品 │  │ 品牌名称 (中/英)          │  │
│  │图片 │  │ [朗诺          ]         │  │
│  │预览 │  │ [RANOVA        ]         │  │
│  └─────┘  └──────────────────────────┘  │
│                                           │
│  ┌────────────────────────────────────┐  │
│  │ 核心卖点 (可编辑/删除/添加)         │  │
│  │ 1. [100%纯肉] / [100% Pure Meat]   │  │
│  │ 2. [冻干锁鲜] / [Frozen Fresh]     │  │
│  │ 3. [无谷配方] / [Grain-Free]       │  │
│  │ [+ 添加卖点]                        │  │
│  └────────────────────────────────────┘  │
│                                           │
│  [上一步]  [下一步: 选择风格 →]           │
└──────────────────────────────────────────┘
```

---

### 模块 4: 风格选择

**功能描述**: 用户选择视觉风格和排版效果,AI 根据产品信息给出推荐

#### 4.1 视觉风格选项 (8种)

1. **杂志编辑风格** (Magazine Editorial)
   - 特点: 高级、专业、大片感、粗衬线标题、极简留白

2. **水彩艺术风格** (Watercolor Art)
   - 特点: 温暖、柔和、晕染效果、手绘质感

3. **科技未来风格** (Tech Future)
   - 特点: 冷色调、几何图形、数据可视化、蓝光效果

4. **复古胶片风格** (Vintage Film)
   - 特点: 颗粒质感、暖色调、怀旧氛围、宝丽来边框

5. **极简北欧风格** (Minimal Nordic)
   - 特点: 性冷淡、大留白、几何线条、黑白灰

6. **霓虹赛博风格** (Neon Cyberpunk)
   - 特点: 荧光色、描边发光、未来都市、暗色背景

7. **自然有机风格** (Natural Organic)
   - 特点: 植物元素、大地色系、手工质感、环保理念

#### 4.2 文字排版选项 (6种)

1. **粗衬线大标题** (Bold Serif)
   - 细线装饰 + 网格对齐(杂志风)

2. **玻璃拟态卡片** (Glassmorphism)
   - 半透明背景 + 柔和圆角(现代风)

3. **3D浮雕文字** (3D Embossed)
   - 金属质感 + 光影效果(奢华风)

4. **手写体标注** (Handwritten)
   - 水彩笔触 + 不规则布局(艺术风)

5. **无衬线粗体** (Bold Sans-serif)
   - 霓虹描边 + 发光效果(赛博风)

6. **极细线条字** (Thin Sans-serif)
   - 大量留白 + 精确对齐(极简风)

#### 4.3 中英文排版格式 (3种)

1. **格式A - 中英堆叠** (最常用)
   ```
   纯肉冻干
   PURE FREEZE-DRIED
   ```
   - 中文在上(较大字号)
   - 英文在下(较小字号)
   - 垂直堆叠,居中对齐

2. **格式B - 中英并列**
   ```
   纯肉冻干 | PURE FREEZE-DRIED
   ```
   - 中英文横向并列
   - 用竖线或斜杠分隔
   - 字号相同或中文略大

3. **格式C - 中英分离**
   ```
   [左上角] 纯肉冻干
   [右下角] PURE FREEZE-DRIED
   ```
   - 中英文分别放置在不同位置
   - 形成视觉对比

**UI 布局**:
```
┌──────────────────────────────────────────┐
│  🎨 选择视觉风格                          │
│                                          │
│  💡 AI 推荐: 水彩艺术风格                │
│     基于您的产品包装设计风格推荐          │
│                                          │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐            │
│  │杂志│ │水彩│ │科技│ │复古│            │
│  │编辑│ │艺术│ │未来│ │胶片│            │
│  │    │ │ ✓  │ │    │ │    │            │
│  └────┘ └────┘ └────┘ └────┘            │
│                                          │
│  📝 选择文字排版                          │
│                                          │
│  ┌────────┐ ┌────────┐ ┌────────┐      │
│  │玻璃拟态│ │3D浮雕  │ │手写体  │      │
│  │   ✓   │ │        │ │        │      │
│  └────────┘ └────────┘ └────────┘      │
│                                          │
│  📐 中英文排版格式                        │
│  ○ 中英堆叠  ● 中英并列  ○ 中英分离      │
│                                          │
│  [上一步]  [下一步: 生成提示词 →]        │
└──────────────────────────────────────────┘
```

---

### 模块 5: 提示词生成

**功能描述**: 基于所有信息生成 10 张海报的完整提示词

**海报类型** (10张):

1. **海报01 - 主KV视觉** (Hero Shot)
   - 必须严格还原上传的产品图
   - 展示产品全貌和品牌形象

2. **海报02 - 生活场景** (Lifestyle)
   - 展示产品实际使用场景
   - 增强用户代入感

3. **海报03 - 工艺/技术** (Process/Concept)
   - 基于识别的卖点可视化
   - 展示产品技术优势

4. **海报04-07 - 细节特写** (Details)
   - Detail 01: 产品细节
   - Detail 02: 材质/质感特写
   - Detail 03: 功能细节
   - Detail 04: 或用户评价

5. **海报08 - 品牌故事** (Brand Story/Moodboard)
   - 使用识别的配色
   - 展示品牌调性

6. **海报09 - 产品参数** (Specifications)
   - 使用识别的参数
   - 数据可视化呈现

7. **海报10 - 使用指南** (Usage Guide)
   - 基于产品类型
   - 步骤化说明

**每张海报包含**:
- ✅ 中文提示词(600-1000字)
- ✅ 英文 Prompt(完整翻译)
- ✅ 负面词(20-30个关键词)
- ✅ 详细排版布局说明
  - 所有文字的具体位置
  - 所有文字的字号大小关系
  - 所有文字的颜色
  - 所有文字的字体风格
  - LOGO位置(通常左上角)
  - CTA按钮设计

**核心要求**:

1. **产品图还原**:
   ```
   "严格还原上传的产品图,包括包装设计、颜色、LOGO位置、
    文字内容、图案元素等所有细节"
   ```

2. **文案排版** (中英文双语):
   - 标题: 3种排版格式可选
   - 卖点: 斜杠分隔或上下堆叠
   - 段落: 中英分别成段,英文略小
   - 按钮: 中英并列或上下排列
   - 参数表: 表头和参数都中英双语

3. **风格统一**:
   - 10张海报使用相同文字排版效果
   - 10张海报使用相同配色系统
   - LOGO位置统一(左上角)
   - 中英文排版格式一致

**数据结构**:
```typescript
interface PosterPrompt {
  id: string; // 01-10
  title: string;
  titleEn: string;
  type: 'hero' | 'lifestyle' | 'process' | 'detail' | 'brand' | 'specs' | 'usage';
  promptZh: string;
  promptEn: string;
  negative: string;
  layout: LayoutSpec;
}

interface PromptsSystem {
  logo: string;
  posters: PosterPrompt[];
}
```

**UI 布局**:
```
┌──────────────────────────────────────────┐
│  📋 生成的提示词 (10 张海报)              │
│                                          │
│  ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬─┐│
│  │01 │02 │03 │04 │05 │06 │07 │08 │09 │10││
│  │主KV│场景│工艺│细节│细节│细节│细节│品牌│参数│指南│
│  │ ✓ │ ✓ │ ✓ │ ✓ │ ✓ │ ✓ │ ✓ │ ✓ │ ✓ │✓ │
│  └───┴───┴───┴───┴───┴───┴───┴───┴───┴─┘│
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ 海报 01 - 主KV视觉                  │  │
│  │                                    │  │
│  │ 中文提示词:                         │  │
│  │ [展开全部]                         │  │
│  │                                    │  │
│  │ 英文 Prompt:                       │  │
│  │ [展开全部]                         │  │
│  │                                    │  │
│  │ 负面词: cluttered, busy...         │  │
│  │                                    │  │
│  │ [复制] [编辑]                      │  │
│  └────────────────────────────────────┘  │
│                                          │
│  [← 上一张]  [1/10]  [下一张 →]          │
│                                          │
│  [上一步]  [开始生成海报 →]              │
└──────────────────────────────────────────┘
```

---

### 模块 6: 海报生成

**功能描述**: 调用 Nano Banana Pro API 生成 10 张海报

**生成策略**:
```typescript
interface GenerationConfig {
  strategy: 'sequential' | 'parallel'; // 串行/并行
  batchSize: number; // 并行数量
  size: '9:16' | '1:1' | '16:9';
  quality: 'standard' | 'hd';
}
```

**生成进度**:
```typescript
interface GenerationProgress {
  total: number;
  completed: number;
  failed: number;
  current: number;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  images: Array<{
    id: string;
    status: string;
    url?: string;
    error?: string;
  }>;
}
```

**UI 布局**:
```
┌──────────────────────────────────────────┐
│  🎨 正在生成海报...                       │
│                                          │
│  总进度: ████████████████░░ 80% (8/10)   │
│                                          │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐    │
│  │ ✓  │ │ ✓  │ │ ✓  │ │ ✓  │ │ ✓  │    │
│  │01  │ │02  │ │03  │ │04  │ │05  │    │
│  └────┘ └────┘ └────┘ └────┘ └────┘    │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐    │
│  │ ✓  │ │ ✓  │ │ ✓  │ │ 🔄  │ │ ⏳ │    │
│  │06  │ │07  │ │08  │ │09  │ │10  │    │
│  │    │ │    │ │    │ │生成中││等待 │    │
│  └────┘ └────┘ └────┘ └────┘ └────┘    │
│                                          │
│  当前: 海报 09 - 细节特写04               │
│  预计剩余时间: 2 分钟                     │
│                                          │
│  [取消生成]                              │
└──────────────────────────────────────────┘
```

**生成完成后**:
```
┌──────────────────────────────────────────┐
│  ✅ 海报生成完成!                         │
│                                          │
│  [下载全部 (ZIP)]  [重新生成]            │
│                                          │
│  [← 返回首页]                            │
└──────────────────────────────────────────┘
```

---

## 数据流设计

### 全局状态管理

使用 React Context API 管理全局状态:

```typescript
interface AppState {
  currentStep: number;
  uploadedImage: UploadedImage | null;
  productInfo: AnalysisResponse | null;
  editedProductInfo: AnalysisResponse | null;
  selectedStyle: {
    visual: string;
    typography: string;
    textLayout: 'stacked' | 'parallel' | 'separated';
  } | null;
  generatedPrompts: PromptsSystem | null;
  generatedPosters: GeneratedPoster[] | null;
  isLoading: boolean;
  error: string | null;
}
```

### 数据流图

```
上传图片
    ↓
localStorage 保存
    ↓
调用 Gemini API 分析
    ↓
返回产品信息
    ↓
localStorage 保存
    ↓
用户编辑信息
    ↓
localStorage 保存
    ↓
选择风格
    ↓
localStorage 保存
    ↓
生成提示词
    ↓
localStorage 保存
    ↓
调用 Nano Banana API 生成海报
    ↓
返回海报 URL
    ↓
localStorage 保存
```

### localStorage 数据结构

```typescript
interface LocalStorageData {
  'kv-image': UploadedImage;
  'kv-analysis': AnalysisResponse;
  'kv-edited-info': AnalysisResponse;
  'kv-style': StyleConfig;
  'kv-prompts': PromptsSystem;
  'kv-posters': GeneratedPoster[];
  'kv-created-at': string;
  'kv-updated-at': string;
}
```

### 会话管理

- **会话时长**: 24 小时
- **自动保存**: 每个关键步骤后自动保存
- **自动恢复**: 刷新页面后自动恢复会话
- **过期清理**: 超过 24 小时自动清除

---

## UI 组件系统

### 设计系统配置

**颜色主题**:
- Primary: 蓝色系 (#221.2 83.2% 53.3%)
- 支持亮色/暗色模式切换
- 基于 HSL 色彩空间

**字体**:
- 标题: Inter (无衬线)
- 正文: Inter (无衬线)
- 代码: Fira Code (等宽)

**圆角**:
- sm: calc(var(--radius) - 4px)
- md: calc(var(--radius) - 2px)
- lg: var(--radius) (默认 0.5rem)

**动画**:
- fade-in: 淡入动画
- slide-in: 滑入动画
- pulse-slow: 慢速脉冲

### 核心组件库

基于 shadcn/ui 的组件:

```
components/ui/
├── button.tsx          # 按钮
├── card.tsx            # 卡片
├── input.tsx           # 输入框
├── label.tsx           # 标签
├── textarea.tsx        # 文本域
├── select.tsx          # 选择器
├── dialog.tsx          # 对话框
├── toast.tsx           # 提示
├── progress.tsx        # 进度条
├── tabs.tsx            # 标签页
├── badge.tsx           # 徽章
├── separator.tsx       # 分隔线
└── slider.tsx          # 滑块
```

### 自定义业务组件

#### ImageUpload
图片上传组件,支持拖拽和点击上传

#### StyleCard
风格选择卡片,带推荐标记

#### ProgressCard
进度展示卡片,实时显示生成进度

#### PromptEditor
提示词编辑器,支持查看、复制、编辑

#### StepIndicator
步骤指示器,显示当前流程位置

### 响应式设计

**断点**:
- mobile: < 768px
- tablet: 768px - 1024px
- desktop: > 1024px
- 2xl: > 1400px

**网格布局**:
- mobile: 1 列
- tablet: 2-3 列
- desktop: 3-6 列(根据内容自适应)

---

## 错误处理

### 错误类型

```typescript
enum ErrorType {
  // 网络错误
  NETWORK_ERROR,
  API_TIMEOUT,
  API_RATE_LIMIT,

  // 文件错误
  FILE_TOO_LARGE,
  INVALID_FILE_TYPE,
  FILE_UPLOAD_FAILED,

  // API 错误
  API_ERROR,
  API_KEY_INVALID,
  API_QUOTA_EXCEEDED,

  // 生成错误
  GENERATION_FAILED,
  GENERATION_TIMEOUT,

  // 用户错误
  INVALID_INPUT,
  MISSING_REQUIRED_FIELD,
}
```

### 错误处理策略

1. **友好提示**: 用通俗易懂的语言描述错误
2. **解决建议**: 提供具体的解决方案
3. **自动重试**: 网络错误自动重试 3 次
4. **错误边界**: 捕获未预期的错误
5. **详细日志**: 控制台记录完整错误信息

### Toast 通知系统

```typescript
toast({
  title: '生成成功',
  description: '10 张海报已全部生成完成',
  variant: 'success',
  duration: 3000,
  action: {
    label: '立即查看',
    onClick: () => console.log('查看'),
  },
});
```

### 错误边界组件

捕获组件树中的任何错误,显示友好的错误页面,提供刷新和返回首页的选项。

---

## 用户体验优化

### 加载体验

1. **骨架屏**: 内容加载时显示骨架屏
2. **进度指示**: 实时显示加载进度
3. **预计时间**: 显示预计剩余时间
4. **最小显示时间**: 避免加载闪烁

### 性能优化

1. **图片压缩**: 上传前自动压缩
2. **防抖/节流**: 输入和滚动事件优化
3. **虚拟滚动**: 大列表使用虚拟滚动
4. **代码分割**: 路由级别的代码分割

### 数据持久化

1. **自动保存**: 每个关键步骤后自动保存
2. **会话恢复**: 刷新页面后自动恢复
3. **过期清理**: 超过 24 小时自动清理
4. **存储优化**: 只保存必要的数据

### 无障碍设计

1. **键盘导航**: 支持键盘操作
2. **ARIA 标签**: 完整的无障碍标签
3. **焦点管理**: 清晰的焦点指示
4. **颜色对比**: 符合 WCAG AA 标准

---

## 项目结构

```
kv-generator/
├── app/
│   ├── layout.tsx              # 根布局
│   ├── page.tsx                # 首页(上传图片)
│   ├── analyze/                # 分析页面
│   │   └── page.tsx
│   ├── edit/                   # 编辑页面
│   │   └── page.tsx
│   ├── style/                  # 风格选择
│   │   └── page.tsx
│   ├── prompts/                # 提示词预览
│   │   └── page.tsx
│   ├── generate/               # 生成页面
│   │   └── page.tsx
│   ├── gallery/                # 成果展示
│   │   └── page.tsx
│   └── globals.css             # 全局样式
├── components/
│   ├── ui/                     # shadcn/ui 组件
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── textarea.tsx
│   │   ├── dialog.tsx
│   │   ├── toast.tsx
│   │   ├── progress.tsx
│   │   ├── tabs.tsx
│   │   ├── badge.tsx
│   │   ├── separator.tsx
│   │   └── slider.tsx
│   ├── ImageUpload.tsx         # 图片上传
│   ├── StyleCard.tsx           # 风格卡片
│   ├── ProgressCard.tsx        # 进度卡片
│   ├── PromptEditor.tsx        # 提示词编辑器
│   ├── StepIndicator.tsx       # 步骤指示器
│   ├── LoadingScreen.tsx       # 加载屏幕
│   ├── SkeletonLoader.tsx      # 骨架屏
│   └── ErrorBoundary.tsx       # 错误边界
├── contexts/
│   └── AppContext.tsx          # 全局状态管理
├── hooks/
│   ├── useLoading.ts           # 加载状态
│   ├── usePersistedState.ts    # 持久化状态
│   └── useVirtualization.ts    # 虚拟滚动
├── lib/
│   ├── api/
│   │   ├── gemini.ts           # Gemini API
│   │   └── nanobanana.ts       # Nano Banana API
│   ├── errors/
│   │   ├── errorTypes.ts       # 错误类型
│   │   ├── errorHandler.ts     # 错误处理
│   │   └── errorBoundary.tsx   # 错误边界
│   └── utils/
│       ├── imageOptimizer.ts   # 图片优化
│       ├── debounce.ts         # 防抖
│       ├── throttle.ts         # 节流
│       └── sessionManager.ts   # 会话管理
├── public/
│   └── styles/                 # 风格预览图
│       ├── magazine.jpg
│       ├── watercolor.jpg
│       ├── tech.jpg
│       └── ...
├── .env.local                  # 环境变量(本地)
├── .env.example                # 环境变量示例
├── next.config.js              # Next.js 配置
├── tailwind.config.ts          # Tailwind 配置
├── tsconfig.json               # TypeScript 配置
├── package.json                # 依赖管理
└── README.md                   # 项目说明
```

---

## 开发计划

### 时间估算 (4 周)

#### Week 1: 基础架构搭建
- [ ] 初始化 Next.js 项目
- [ ] 配置 Tailwind CSS
- [ ] 安装 shadcn/ui 组件库
- [ ] 搭建项目结构
- [ ] 配置 TypeScript
- [ ] 创建全局状态管理(Context)
- [ ] 实现路由布局
- [ ] 创建基础 UI 组件

#### Week 2: 核心功能开发 (前半)
- [ ] 实现图片上传组件
- [ ] 集成 Gemini API
- [ ] 实现 AI 信息提取功能
- [ ] 创建信息编辑页面
- [ ] 实现数据持久化
- [ ] 添加表单验证
- [ ] 实现会话管理

#### Week 3: 核心功能开发 (后半)
- [ ] 创建风格选择页面
- [ ] 实现风格推荐算法
- [ ] 创建提示词生成逻辑
- [ ] 实现提示词编辑器
- [ ] 集成 Nano Banana API
- [ ] 实现海报生成功能
- [ ] 添加进度显示

#### Week 4: 优化和测试
- [ ] 实现错误处理系统
- [ ] 添加 Toast 通知
- [ ] 优化加载体验
- [ ] 性能优化
- [ ] 响应式测试
- [ ] 浏览器兼容性测试
- [ ] 用户测试和反馈
- [ ] Bug 修复

### 关键里程碑

1. **Week 1 结束**: 基础架构完成,可以运行项目
2. **Week 2 结束**: 完成 AI 分析和信息编辑功能
3. **Week 3 结束**: 完成风格选择和提示词生成功能
4. **Week 4 结束**: 完成海报生成,项目上线

### 技术债务和未来改进

#### 未来功能
- [ ] 用户登录系统
- [ ] 历史记录管理
- [ ] 项目保存和分享
- [ ] 批量处理
- [ ] 自定义风格上传
- [ ] 视频生成支持
- [ ] 多语言支持

#### 性能改进
- [ ] 服务端渲染(SSR)
- [ ] 静态生成(SSG)
- [ ] 图片 CDN 加速
- [ ] API 响应缓存
- [ ] WebSocket 实时更新

#### 安全加固
- [ ] API Key 加密存储
- [ ] 请求签名验证
- [ ] 访问频率限制
- [ ] 内容安全检测
- [ ] 用户权限管理

---

## 附录

### API 密钥配置

创建 `.env.local` 文件:

```bash
# Gemini API Key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

# Nano Banana Pro API Key
NEXT_PUBLIC_NANO_BANANA_API_KEY=your_nano_banana_api_key
```

### 部署指南

#### Vercel 部署

1. 推送代码到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量
4. 自动部署

#### 自定义域名

1. 在 Vercel 项目设置中添加自定义域名
2. 配置 DNS 记录
3. 自动配置 HTTPS

### 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行生产版本
npm start

# 代码检查
npm run lint

# 类型检查
npm run type-check
```

---

## 总结

这是一个**极简、高效、零运维成本**的电商 KV 海报生成工具方案,通过:

- ✅ **Next.js + TypeScript**: 现代化前端技术栈
- ✅ **shadcn/ui**: 精美的 UI 组件库
- ✅ **Gemini + Nano Banana**: 强大的 AI 能力
- ✅ **localStorage**: 简单可靠的数据持久化
- ✅ **Vercel**: 零成本部署和全球 CDN

在 **4 周**内完成一个功能完整的 MVP,适合个人/内部工具使用,未来可扩展为 SaaS 产品。

**核心价值主张**:
> 5 分钟生成 10 张专业电商海报,AI 全程自动化,零设计门槛。

---

*设计文档版本: v1.0*
*最后更新: 2026-02-19*
