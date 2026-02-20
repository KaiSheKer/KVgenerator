# KV Generator 前端优化实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 优化 KV Generator 的前端设计,实现温暖商业风格的视觉升级,包括极简首页、大圆角卡片、渐变色系统、悬浮交互等

**Architecture:** 基于 Next.js 15 + Tailwind CSS v4,通过更新全局样式、组件样式和交互效果来优化用户体验

**Tech Stack:**
- Frontend: Next.js 15 (App Router), TypeScript, Tailwind CSS v4
- UI: shadcn/ui + 自定义组件
- Icons: Lucide React
- Animation: CSS transition + Framer Motion

---

## Phase 1: 全局设计系统升级

### Task 1: 更新 Tailwind 配置

**Files:**
- Modify: `tailwind.config.ts`

**Step 1: 扩展 Tailwind 主题配置**

在 `tailwind.config.ts` 中添加自定义颜色、阴影和动画:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B6B',
        accent: '#FFD93D',
        background: '#FFF5F5',
        surface: '#FFFFFF',
      },
      borderRadius: {
        '3xl': '24px',
      },
      boxShadow: {
        'float': '0 12px 48px rgba(255, 107, 107, 0.20)',
        'card': '0 4px 16px rgba(255, 107, 107, 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

**Step 2: 提交配置**

```bash
git add tailwind.config.ts
git commit -m "feat: extend Tailwind theme with custom colors and animations"
```

---

### Task 2: 更新全局样式变量

**Files:**
- Modify: `app/globals.css`

**Step 1: 添加自定义 CSS 变量**

在 `app/globals.css` 的 `@theme` 部分添加自定义颜色变量:

```css
@import "tailwindcss";

@theme {
  --color-background: oklch(98% 0.01 285);
  --color-foreground: oklch(9% 0.02 285);
  --color-surface: oklch(100% 0 0);
  --color-primary: oklch(65% 0.15 285);
  --color-accent: oklch(85% 0.15 85);

  /* 阴影 */
  --shadow-card: 0 4px 16px rgba(255, 107, 107, 0.12);
  --shadow-float: 0 12px 48px rgba(255, 107, 107, 0.20);

  /* 动画 */
  --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Step 2: 提交样式更新**

```bash
git add app/globals.css
git commit -m "feat: add custom CSS variables for gradient and shadows"
```

---

## Phase 2: 首页优化

### Task 3: 重构首页布局

**Files:**
- Modify: `app/page.tsx`

**Step 1: 更新首页组件**

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/ImageUpload';
import { useAppContext } from '@/contexts/AppContext';
import { Upload } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { setUploadedImage } = useAppContext();
  const [imagePreview, setImagePreview] = useState<string>('');

  const handleUpload = (file: File, preview: string) => {
    const uploadedImage = {
      id: Date.now().toString(),
      file,
      preview,
      url: preview,
    };
    setUploadedImage(uploadedImage);
    setImagePreview(preview);
  };

  const handleAnalyze = () => {
    if (imagePreview) {
      router.push('/analyze');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 animate-fade-in">
      <div className="w-full max-w-3xl space-y-6">
        {/* 上传卡片 */}
        <ImageUpload onUpload={handleUpload} image={imagePreview} />

        {/* 开始分析按钮 */}
        {imagePreview && (
          <div className="flex justify-center animate-slide-up">
            <Button
              size="lg"
              onClick={handleAnalyze}
              className="px-12 py-6 text-lg rounded-2xl bg-gradient-to-r from-primary to-accent hover:shadow-float transition-all duration-300 hover:-translate-y-1"
            >
              开始分析 →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: 提交首页更新**

```bash
git add app/page.tsx
git commit -m "refactor: simplify homepage with minimal design"
```

---

### Task 4: 优化上传卡片组件

**Files:**
- Modify: `components/ImageUpload.tsx`

**Step 1: 更新上传卡片样式**

```typescript
'use client';

import { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  onUpload: (file: File, preview: string) => void;
  image?: string;
}

export function ImageUpload({ onUpload, image }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size <= 10 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const preview = e.target?.result as string;
          onUpload(file, preview);
        };
        reader.readAsDataURL(file);
      }
    }
  }, [onUpload]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        onUpload(file, preview);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card
      className={cn(
        "relative w-full aspect-video bg-white rounded-3xl shadow-card",
        "border-4 border-dashed border-primary/30",
        "flex items-center justify-center cursor-pointer",
        "transition-all duration-300",
        "hover:shadow-float hover:-translate-y-1 hover:border-primary",
        isDragging && "border-primary bg-primary/5"
      )}
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      {image ? (
        <div className="space-y-4">
          <img
            src={image}
            alt="上传的图片"
            className="w-full max-w-md mx-auto rounded-2xl"
          />
          <p className="text-center text-sm text-muted-foreground">点击重新上传</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Upload className="w-10 h-10 text-white" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-2xl font-semibold text-foreground">拖拽产品图片到此处</p>
            <p className="text-muted-foreground">或点击上传</p>
            <p className="text-sm text-muted-foreground">
              支持 JPG、PNG、WEBP,最大 10MB
            </p>
          </div>
        </div>
      )}
      <input
        id="file-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </Card>
  );
}
```

**Step 2: 提交上传卡片更新**

```bash
git add components/ImageUpload.tsx
git commit -m "refactor: enhance upload card with gradient and animations"
```

---

## Phase 3: 风格选择页面优化

### Task 5: 优化风格选择页面

**Files:**
- Modify: `app/style/page.tsx`
- Modify: `components/StyleCard.tsx`

**Step 1: 更新 StyleCard 组件**

```typescript
'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StyleCardProps {
  name: string;
  nameEn: string;
  description: string;
  selected: boolean;
  recommended?: boolean;
  onClick: () => void;
}

export function StyleCard({ name, nameEn, description, selected, recommended, onClick }: StyleCardProps) {
  return (
    <Card
      className={cn(
        "relative p-6 cursor-pointer transition-all duration-300",
        "hover:shadow-lg hover:-translate-y-1",
        selected && "ring-4 ring-primary ring-offset-4 scale-105"
      )}
      onClick={onClick}
    >
      {recommended && (
        <Badge className="absolute top-2 right-2 bg-gradient-to-r from-primary to-accent text-white text-xs">
          AI 推荐
        </Badge>
      )}
      <div className="space-y-2">
        <h3 className="font-semibold">{name}</h3>
        <p className="text-sm text-muted-foreground">{nameEn}</p>
        <p className="text-xs text-muted-foreground mt-2">{description}</p>
      </div>
    </Card>
  );
}
```

**Step 2: 更新风格选择页面布局**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StyleCard } from '@/components/StyleCard';

const VISUAL_STYLES = [
  { id: 'magazine', name: '杂志编辑', nameEn: 'Magazine Editorial', description: '高级、专业、大片感' },
  { id: 'watercolor', name: '水彩艺术', nameEn: 'Watercolor Art', description: '温暖、柔和、晕染效果' },
  { id: 'tech', name: '科技未来', nameEn: 'Tech Future', description: '冷色调、几何图形' },
  { id: 'vintage', name: '复古胶片', nameEn: 'Vintage Film', description: '颗粒质感、暖色调' },
  { id: 'minimal', name: '极简北欧', nameEn: 'Minimal Nordic', description: '性冷淡、大留白' },
  { id: 'cyber', name: '霓虹赛博', nameEn: 'Neon Cyberpunk', description: '荧光色、描边发光' },
  { id: 'organic', name: '自然有机', nameEn: 'Natural Organic', description: '植物元素、大地色系' },
];

export default function StylePage() {
  // ... 现有逻辑保持不变

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-8 animate-fade-in">
      {/* 简化的标题 */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">选择视觉风格</h2>
        <p className="text-sm text-muted-foreground">AI 推荐: {VISUAL_STYLES.find(s => s.id === visualStyle)?.name}</p>
      </div>

      {/* 视觉风格网格 */}
      <Card className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {VISUAL_STYLES.map((style) => (
            <StyleCard
              key={style.id}
              {...style}
              selected={visualStyle === style.id}
              recommended={style.id === recommendedStyle}
              onClick={() => setVisualStyle(style.id)}
            />
          ))}
        </div>
      </Card>

      {/* ... 其他部分 */}
    </div>
  );
}
```

**Step 3: 提交风格选择更新**

```bash
git add app/style/page.tsx components/StyleCard.tsx
git commit -m "refactor: enhance style selection page with improved card design"
```

---

## Phase 4: 提示词预览页面优化

### Task 6: 优化提示词预览页面

**Files:**
- Modify: `app/prompts/page.tsx`

**Step 1: 更新布局样式**

简化提示词预览页面,移除不必要的标题和说明,聚焦内容:

```typescript
// ... imports

export default function PromptsPage() {
  // ... 现有逻辑

  return (
    <div className="max-w-7xl mx-auto p-8 animate-fade-in">
      {/* 顶部导航 */}
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          ← 上一步
        </Button>
        <Button size="lg" onClick={handleGenerate} className="bg-gradient-to-r from-primary to-accent">
          开始生成海报 →
        </Button>
      </div>

      {/* 海报选择标签 */}
      <div className="flex gap-2 overflow-x-auto pb-4">
        {prompts.posters.map((poster, index) => (
          <button
            key={poster.id}
            className={cn(
              "px-6 py-3 rounded-xl whitespace-nowrap transition-all duration-200",
              selectedIndex === index
                ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            )}
            onClick={() => setSelectedIndex(index)}
          >
            {poster.id}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <Card className="p-8 animate-slide-up">
        <h3 className="text-xl font-bold mb-6">
          海报 {currentPrompt.id} - {currentPrompt.title}
        </h3>
        {/* 提示词内容 */}
      </Card>

      {/* 底部导航 */}
      <div className="flex justify-center items-center gap-4 mt-6">
        <Button
          variant="outline"
          onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
          disabled={selectedIndex === 0}
        >
          ← 上一张
        </Button>
        <span className="text-sm text-muted-foreground">
          {selectedIndex + 1} / {prompts.posters.length}
        </span>
        <Button
          variant="outline"
          onClick={() => setSelectedIndex(Math.min(prompts.posters.length - 1, selectedIndex + 1))}
          disabled={selectedIndex === prompts.posters.length - 1}
        >
          下一张 →
        </Button>
      </div>
    </div>
  );
}
```

**Step 2: 提交提示词页面更新**

```bash
git add app/prompts/page.tsx
git commit -m "refactor: simplify prompts preview page layout"
```

---

## Phase 5: 成果展示页面优化

### Task 7: 添加悬浮下载按钮

**Files:**
- Modify: `app/gallery/page.tsx`
- Modify: `app/gallery/page.tsx`

**Step 1: 更新画廊页面,添加悬浮下载功能**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Eye } from 'lucide-react';

export default function GalleryPage() {
  const router = useRouter();
  const { generatedPosters, generatedPrompts } = useAppContext();
  const [selectedPoster, setSelectedPoster] = useState<number | null>(null);

  useEffect(() => {
    if (!generatedPosters || generatedPosters.length === 0) {
      router.push('/');
    }
  }, [generatedPosters, router]);

  const handleDownload = (url: string, id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const link = document.createElement('a');
    link.href = url;
    link.download = `poster-${id}.jpg`;
    link.click();
  };

  if (!generatedPosters || generatedPosters.length === 0) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8 animate-fade-in">
      {/* 成功提示 */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full">
          <span className="text-3xl">✓</span>
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          海报生成完成!
        </h2>
        <p className="text-muted-foreground">
          成功生成 {generatedPosters.filter(p => p.status === 'completed').length} 张海报
        </p>
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-center gap-4">
        <Button size="lg" className="bg-gradient-to-r from-primary to-accent">
          下载全部 ZIP
        </Button>
        <Button size="lg" variant="outline" onClick={() => router.push('/')}>
          重新开始
        </Button>
      </div>

      {/* 海报网格 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {generatedPosters.map((poster, index) => {
          if (poster.status !== 'completed') return null;

          const prompt = generatedPrompts?.posters[index];
          return (
            <Card
              key={poster.id}
              className="relative group cursor-pointer overflow-hidden rounded-3xl shadow-md transition-all duration-300 hover:shadow-float hover:-translate-y-1"
              onClick={() => setSelectedPoster(index)}
            >
              <div className="aspect-[9/16] relative">
                {poster.url ? (
                  <img
                    src={poster.url}
                    alt={prompt?.title || `Poster ${poster.id}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    暂无图片
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-lg">
                  {poster.id}
                </div>

                {/* 悬浮下载按钮 */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={(e) => handleDownload(poster.url!, poster.id, e)}
                    className="bg-white/90 text-gray-900 px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-white transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    下载
                  </button>
                  <button className="bg-white/90 text-gray-900 px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-white transition-colors">
                    <Eye className="w-4 h-4" />
                    查看详情
                  </button>
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm truncate">
                  {prompt?.title || `海报 ${poster.id}`}
                </h3>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: 提交画廊更新**

```bash
git add app/gallery/page.tsx
git commit -m "feat: add hover download buttons to gallery page"
```

---

## Phase 6: 生成进度页面优化

### Task 8: 优化生成进度页面

**Files:**
- Modify: `app/generate/page.tsx`

**Step 1: 更新生成进度页面样式**

```typescript
// ... imports

export default function GeneratePage() {
  // ... 现有逻辑

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="max-w-4xl w-full p-8 space-y-8">
        {/* 标题和进度 */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">正在生成海报...</h2>
          <Progress value={progress} className="h-2 bg-gradient-to-r from-primary to-accent" />
          <p className="text-sm text-muted-foreground">
            {Math.round(progress)}% ({completedCount}/{total})
          </p>
        </div>

        {/* 海报进度网格 */}
        <div className="grid grid-cols-5 gap-4">
          {postersProgress.map((poster) => (
            <div
              key={poster.id}
              className={cn(
                "aspect-square rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-300",
                poster.status === 'completed' && "border-green-500 bg-green-500/10",
                poster.status === 'generating' && "border-primary animate-pulse-slow",
                poster.status === 'failed' && "border-red-500 bg-red-500/10",
                poster.status === 'pending' && "border-gray-300"
              )}
            >
              <div className="text-2xl mb-2">
                {poster.status === 'completed' && '✓'}
                {poster.status === 'generating' && '🔄'}
                {poster.status === 'failed' && '✗'}
                {poster.status === 'pending' && '⏳'}
              </div>
              <div className="text-xs font-semibold">{poster.id}</div>
            </div>
          ))}
        </div>

        {/* 当前状态 */}
        <div className="text-center text-sm text-muted-foreground">
          当前: 海报 {postersProgress.findIndex(p => p.status === 'generating') + 1}
        </div>

        {/* 取消按钮 */}
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => router.push('/')}>
            取消生成
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: 提交生成进度更新**

```bash
git add app/generate/page.tsx
git commit -m "refactor: enhance generation progress page with visual feedback"
```

---

## Phase 7: 其他页面优化

### Task 9: 优化编辑和分析页面

**Files:**
- Modify: `app/edit/page.tsx`
- Modify: `app/analyze/page.tsx`

**Step 1: 更新编辑页面样式**

简化编辑页面,使用大圆角卡片和清晰的布局:

```typescript
// ... 现有逻辑

return (
  <div className="max-w-4xl mx-auto space-y-8 p-8 animate-fade-in">
    {/* 简化标题 */}
    <div className="text-center space-y-2">
      <h2 className="text-2xl font-semibold">编辑产品信息</h2>
      <p className="text-sm text-muted-foreground">请确认并编辑 AI 提取的产品信息</p>
    </div>

    {/* 内容卡片 */}
    <Card className="p-8 rounded-3xl shadow-lg space-y-6">
      {/* 表单字段 */}
    </Card>

    {/* 导航按钮 */}
    <div className="flex justify-between">
      <Button variant="outline" onClick={() => router.back()}>
        ← 上一步
      </Button>
      <Button onClick={handleNext} className="bg-gradient-to-r from-primary to-accent">
        下一步: 选择风格 →
      </Button>
    </div>
  </div>
);
```

**Step 2: 更新分析页面样式**

```typescript
// 在 LoadingScreen 组件中添加渐变进度条

export function LoadingScreen({ progress, message }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="max-w-md w-full p-8 space-y-6 animate-fade-in">
        <div className="text-center space-y-3">
          <p className="text-lg font-medium">{message}</p>
          <Progress value={progress} className="h-2 bg-gradient-to-r from-primary to-accent" />
          <p className="text-sm text-muted-foreground">
            {Math.round(progress)}%
          </p>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: 提交编辑和分析页面更新**

```bash
git add app/edit/page.tsx app/analyze/page.tsx components/LoadingScreen.tsx
git commit -m "refactor: enhance edit and analyze pages with consistent styling"
```

---

## Phase 8: 添加缺失的 UI 组件

### Task 10: 添加 Badge 组件

**Files:**
- Create: `components/ui/badge.tsx`

**Step 1: 创建 Badge 组件**

```typescript
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring-2 focus:ring-offset-2",
  {
    variants: {
      default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
      secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
      destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
      outline: "text-foreground",
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
```

**Step 2: 提交 Badge 组件**

```bash
git add components/ui/badge.tsx
git commit -m "feat: add Badge component for AI recommendations"
```

---

## Phase 9: 最终验证和测试

### Task 11: 构建和类型检查

**Step 1: 运行类型检查**

```bash
npm run typecheck
```

Expected: 无 TypeScript 错误

**Step 2: 运行 ESLint 检查**

```bash
npm run lint
```

Expected: 无 ESLint 错误

**Step 3: 构建项目**

```bash
npm run build
```

Expected: 构建成功,无错误

**Step 4: 提交验证**

```bash
git add .
git commit -m "chore: pass all type checks and build successfully"
```

---

### Task 12: 本地测试

**Step 1: 启动开发服务器**

```bash
npm run dev
```

**Step 2: 手动测试流程**

访问 http://localhost:3000 并验证:

1. **首页**:
   - ✅ 上传卡片居中显示
   - ✅ 悬浮时卡片上浮
   - ✅ 上传后显示渐变按钮
   - ✅ 拖拽上传正常工作

2. **风格选择**:
   - ✅ 卡片大尺寸,有推荐标签
   - ✅ 选中时放大+渐变边框
   - ✅ 悬浮时上浮效果

3. **提示词预览**:
   - ✅ 顶部标签栏横向滚动
   - ✅ 选中标签用渐变背景
   - ✅ 内容区布局清晰

4. **生成进度**:
   - ✅ 进度条使用渐变色
   - ✅ 状态卡片可视化
   - ✅ 实时进度更新

5. **成果展示**:
   - ✅ 网格布局正确
   - ✅ 悬浮显示下载按钮
   - ✅ 下载功能正常

**Step 3: 提交完成**

```bash
git add .
git commit -m "feat: complete frontend optimization with warm commercial design"
```

---

## 验证和测试总结

在每个 Phase 完成后,运行以下命令验证:

```bash
# 1. 类型检查
npm run typecheck

# 2. 代码检查
npm run lint

# 3. 构建测试
npm run build

# 4. 本地测试
npm run dev
```

访问 http://localhost:3000 验证功能:
- [ ] 首页上传卡片居中,悬浮效果正常
- [ ] 风格选择卡片大尺寸,推荐标签显示
- [ ] 提示词预览页面标签栏和内容区布局
- [ ] 生成进度页面渐变进度条和状态卡片
- [ ] 成果展示页面悬浮下载按钮
- [ ] 所有页面动画流畅
- [ ] 响应式布局正常

---

## 总结

**实施范围**:
- ✅ 全局设计系统(配色、圆角、阴影、动画)
- ✅ 首页极简重构
- ✅ 风格选择页面优化
- ✅ 提示词预览页面优化
- ✅ 生成进度页面优化
- ✅ 成果展示页面添加悬浮下载
- ✅ 其他页面样式统一
- ✅ 添加缺失的 UI 组件

**核心改进**:
1. **视觉升级**: 暖色渐变 + 大圆角 + 柔和阴影
2. **交互优化**: 悬浮效果 + 即时反馈
3. **用户体验**: 极简布局 + 清晰操作流程
4. **品牌感**: 专业且友好的 AI 工具风格

**预计时间**: 2-3 小时(12个任务)

---

**实施计划版本**: v1.0
**最后更新**: 2026-02-20
**基于设计**: docs/plans/2026-02-20-frontend-optimization-design.md
