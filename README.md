# KV Generator - 电商海报生成工具

AI 驱动的电商 KV 海报生成工具,5 分钟生成 10 张专业海报。

## 项目定位

- 这是用于简历作品集展示的 Demo 项目,不是生产环境架构
- API Key 仅建议使用低额度测试 Key,并配置严格配额与过期策略
- 当前默认启用 mock 图像生成,方便本地演示

## 功能特性

- ✅ **智能分析**: 上传产品图片,AI 自动提取品牌、产品、卖点等信息
- ✅ **风格定制**: 8 种视觉风格 × 6 种文字排版 × 3 种中英文格式
- ✅ **批量生成**: 一键生成 10 张 9:16 竖版海报
- ✅ **完整流程**: 主KV、生活场景、工艺技术、细节特写、品牌故事等
- ✅ **实时预览**: 查看和编辑提示词,支持下载全部海报

## 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS v4
- **UI**: shadcn/ui
- **AI**: Gemini API (分析 + 生成)
- **状态**: React Context API
- **通知**: Sonner

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.example` 为 `.env.local`:

```bash
cp .env.example .env.local
```

编辑 `.env.local`,配置 API 密钥:

```env
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_GEMINI_ANALYSIS_MODEL=gemini-2.5-flash
NEXT_PUBLIC_GEMINI_IMAGE_MODEL=gemini-3-pro-image-preview
NEXT_PUBLIC_GEMINI_IMAGE_FALLBACK_MODEL=
NEXT_PUBLIC_USE_MOCK=true
```

`NEXT_PUBLIC_USE_MOCK=true` 时使用本地 mock 生成图片,`false` 时调用真实图像生成 API。

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
npm run build
npm start
```

## 使用流程

1. **上传产品图片**: 拖拽或点击上传产品图片
2. **AI 分析**: AI 自动提取产品信息
3. **编辑信息**: 确认并编辑 AI 提取的信息
4. **选择风格**: 选择视觉风格和文字排版
5. **生成提示词**: 查看 10 张海报的完整提示词
6. **生成海报**: AI 生成所有海报
7. **下载成果**: 查看并下载海报

## 海报类型

1. **主KV视觉** - 展示产品全貌和品牌形象
2. **生活场景** - 展示产品实际使用场景
3. **工艺技术** - 基于卖点的可视化展示
4. **细节特写 01-04** - 产品细节、材质、功能、用户体验
5. **品牌故事** - 展示品牌调性和理念
6. **产品参数** - 数据可视化呈现
7. **使用指南** - 步骤化说明

## 视觉风格 (8种)

- 杂志编辑 (Magazine Editorial)
- 水彩艺术 (Watercolor Art)
- 科技未来 (Tech Future)
- 复古胶片 (Vintage Film)
- 极简北欧 (Minimal Nordic)
- 霓虹赛博 (Neon Cyberpunk)
- 自然有机 (Natural Organic)

## 文字排版 (6种)

- 玻璃拟态 (Glassmorphism)
- 3D 浮雕 (3D Embossed)
- 手写体 (Handwritten)
- 粗衬线 (Bold Serif)
- 无衬线粗体 (Bold Sans-serif)
- 极细线条 (Thin Sans-serif)

## 项目结构

```
kv-generator/
├── app/                    # Next.js 页面
│   ├── analyze/           # AI 分析页面
│   ├── edit/              # 信息编辑页面
│   ├── style/             # 风格选择页面
│   ├── prompts/           # 提示词预览页面
│   ├── generate/          # 海报生成页面
│   └── gallery/           # 成果展示页面
├── components/            # React 组件
├── contexts/              # 全局状态管理
├── hooks/                 # 自定义 Hooks
├── lib/                   # 工具函数和 API
└── public/                # 静态资源
```

## 开发命令

```bash
npm run dev        # 启动开发服务器
npm run build      # 构建生产版本
npm run start      # 运行生产版本
npm run lint       # 代码检查
npm run typecheck  # TypeScript 类型检查
npm run test       # 测试 (lint + typecheck)
```

## 注意事项

- 确保 API 密钥正确配置
- 图片格式支持: JPG、PNG、WEBP
- 图片大小限制: 最大 10MB
- 会话自动保存 24 小时

## 许可证

MIT License

---

**开发者**: Claude Code
**版本**: v1.0.0
**日期**: 2026-02-19
