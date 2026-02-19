# KV Generator 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建一个电商 KV 海报生成工具,用户上传产品图片后,AI 自动分析产品信息并生成 10 张 9:16 竖版电商海报。

**Architecture:** 使用 Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui 构建极简单页应用,通过 Gemini API 分析产品图片,Nano Banana Pro API 生成海报,使用 localStorage 进行数据持久化,Vercel 零成本部署。

**Tech Stack:**
- Frontend: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- Backend: Next.js API Routes
- AI: Gemini Nano Banana Pro (图像分析), Nano Banana Pro (图像生成)
- Storage: localStorage
- Deployment: Vercel

---

## Phase 1: 项目初始化 (Day 1)

### Task 1: 创建 Next.js 项目

**Files:**
- Create: `kv-generator/` (项目根目录)

**Step 1: 创建项目**
```bash
cd /Users/ericcao/CascadeProjects
npx create-next-app@latest kv-generator --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

**Step 2: 进入项目目录**
```bash
cd kv-generator
```

**Step 3: 验证项目创建**
```bash
ls -la
```
Expected: 看到 package.json, next.config.js, tailwind.config.ts 等文件

**Step 4: 启动开发服务器验证**
```bash
npm run dev
```
Expected: 访问 http://localhost:3000 看到 Next.js 欢迎页面

**Step 5: 停止服务器并提交**
```bash
git add .
git commit -m "feat: initialize Next.js project with TypeScript and Tailwind CSS"
```

---

### Task 2: 安装 shadcn/ui 组件库

**Files:**
- Modify: `package.json`
- Create: `components.json`

**Step 1: 初始化 shadcn/ui**
```bash
npx shadcn@latest init
```

交互式选择:
- Would you like to use TypeScript? yes
- Which style would you like to use? › Default
- Which color would you like to use as base color? › Slate
- Would you like to use CSS variables for colors? › yes

**Step 2: 验证配置文件**
```bash
cat components.json
```
Expected: 看到 shadcn/ui 配置

**Step 3: 安装基础 UI 组件**
```bash
npx shadcn@latest add button card input label textarea dialog toast progress tabs badge separator
```

Expected: components/ui/ 目录下创建多个组件文件

**Step 4: 提交**
```bash
git add .
git commit -m "feat: add shadcn/ui component library"
```

---

### Task 3: 配置项目结构

**Files:**
- Create: `contexts/`, `hooks/`, `lib/`, `lib/api/`, `lib/errors/`, `lib/utils/`

**Step 1: 创建目录结构**
```bash
mkdir -p contexts hooks lib/api lib/errors lib/utils
```

**Step 2: 验证目录创建**
```bash
ls -la
ls contexts/
ls hooks/
ls lib/
```

**Step 3: 提交**
```bash
git add .
git commit -m "feat: create project directory structure"
```

---

### Task 4: 配置环境变量

**Files:**
- Create: `.env.local`
- Create: `.env.example`

**Step 1: 创建环境变量示例文件**
```bash
cat > .env.example << 'EOF'
# Gemini API Key (用于图像分析)
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# Nano Banana Pro API Key (用于图像生成)
NEXT_PUBLIC_NANO_BANANA_API_KEY=your_nano_banana_api_key_here
EOF
```

**Step 2: 创建本地环境变量文件**
```bash
cp .env.example .env.local
```

**Step 3: 添加到 .gitignore**
```bash
echo ".env.local" >> .gitignore
```

**Step 4: 提交**
```bash
git add .env.example .gitignore
git commit -m "feat: add environment variable configuration"
```

---

## Phase 2: 核心工具函数 (Day 2)

### Task 5: 创建错误处理系统

**Files:**
- Create: `lib/errors/errorTypes.ts`
- Create: `lib/errors/errorHandler.ts`
- Create: `lib/errors/errorBoundary.tsx`

**Step 1: 创建错误类型定义**
```typescript
// lib/errors/errorTypes.ts
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_TIMEOUT = 'API_TIMEOUT',
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  API_ERROR = 'API_ERROR',
  API_KEY_INVALID = 'API_KEY_INVALID',
  API_QUOTA_EXCEEDED = 'API_QUOTA_EXCEEDED',
  GENERATION_FAILED = 'GENERATION_FAILED',
  GENERATION_TIMEOUT = 'GENERATION_TIMEOUT',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
}

export class AppError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public userMessage: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

**Step 2: 创建错误处理器**
```typescript
// lib/errors/errorHandler.ts
import { AppError, ErrorType } from './errorTypes';

export function handleError(error: unknown) {
  console.error('Error occurred:', error);

  if (error instanceof AppError) {
    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
        alert('网络连接失败,请检查您的网络连接后重试');
        break;
      case ErrorType.API_TIMEOUT:
        alert('请求超时,服务器响应时间过长,请稍后重试');
        break;
      case ErrorType.FILE_TOO_LARGE:
        alert(error.userMessage || '文件大小不能超过 10MB');
        break;
      case ErrorType.INVALID_FILE_TYPE:
        alert('请上传 JPG、PNG 或 WEBP 格式的图片');
        break;
      case ErrorType.API_KEY_INVALID:
        alert('API 密钥无效,请检查您的 API 密钥配置');
        break;
      case ErrorType.GENERATION_FAILED:
        alert(error.userMessage || '生成过程中出现错误,请重试');
        break;
      default:
        alert(error.userMessage || '发生未知错误,请重试');
    }
  } else if (error instanceof Error) {
    alert(error.message || '请稍后重试');
  } else {
    alert('发生未知错误,请刷新页面后重试');
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`重试第 ${i + 1} 次...`);
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error('重试失败');
}
```

**Step 3: 创建错误边界组件**
```typescript
// lib/errors/errorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 space-y-4 border rounded-lg shadow-lg">
            <h1 className="text-xl font-semibold text-red-600">出错了</h1>
            <p className="text-sm text-gray-600">
              抱歉,应用程序遇到了一个错误。您可以尝试刷新页面或重新开始。
            </p>
            {this.state.error && (
              <details className="text-sm bg-gray-100 p-3 rounded">
                <summary className="cursor-pointer font-medium mb-2">错误详情</summary>
                <pre className="text-xs overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-2">
              <Button onClick={() => window.location.reload()} className="flex-1">
                刷新页面
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="flex-1"
              >
                返回首页
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Step 4: 提交**
```bash
git add .
git commit -m "feat: add error handling system"
```

---

### Task 6: 创建工具函数

**Files:**
- Create: `lib/utils/imageOptimizer.ts`
- Create: `lib/utils/debounce.ts`
- Create: `lib/utils/throttle.ts`
- Create: `lib/utils/sessionManager.ts`

**Step 1: 创建图片优化工具**
```typescript
// lib/utils/imageOptimizer.ts
export async function optimizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('无法获取 canvas context'));
          return;
        }

        // 计算压缩后的尺寸
        const maxSize = 1920;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;

        // 绘制并压缩
        ctx.drawImage(img, 0, 0, width, height);

        // 转换为 base64,质量 0.8
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        resolve(compressed);
      };

      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}
```

**Step 2: 创建防抖函数**
```typescript
// lib/utils/debounce.ts
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);
  };
}
```

**Step 3: 创建节流函数**
```typescript
// lib/utils/throttle.ts
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
```

**Step 4: 创建会话管理器**
```typescript
// lib/utils/sessionManager.ts
export class SessionManager {
  private static readonly SESSION_KEY = 'kv-generator-session';
  private static readonly MAX_AGE = 24 * 60 * 60 * 1000; // 24小时

  static save(data: any) {
    const session = {
      data,
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  static load(): any | null {
    try {
      const item = localStorage.getItem(this.SESSION_KEY);
      if (!item) return null;

      const session = JSON.parse(item);
      const age = Date.now() - session.timestamp;

      if (age > this.MAX_AGE) {
        this.clear();
        return null;
      }

      return session.data;
    } catch (error) {
      console.error('Failed to load session:', error);
      return null;
    }
  }

  static clear() {
    localStorage.removeItem(this.SESSION_KEY);
  }

  static isExpired(): boolean {
    const item = localStorage.getItem(this.SESSION_KEY);
    if (!item) return true;

    try {
      const session = JSON.parse(item);
      const age = Date.now() - session.timestamp;
      return age > this.MAX_AGE;
    } catch {
      return true;
    }
  }
}
```

**Step 5: 提交**
```bash
git add .
git commit -m "feat: add utility functions"
```

---

## Phase 3: 全局状态管理 (Day 3)

### Task 7: 创建 App Context

**Files:**
- Create: `contexts/AppContext.tsx`

**Step 1: 创建类型定义**
```typescript
// contexts/AppContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

// 类型定义
interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  url: string;
}

interface AnalysisResponse {
  brandName: {
    zh: string;
    en: string;
  };
  productType: {
    category: string;
    specific: string;
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

interface StyleConfig {
  visual: string;
  typography: string;
  textLayout: 'stacked' | 'parallel' | 'separated';
}

interface PosterPrompt {
  id: string;
  title: string;
  titleEn: string;
  type: 'hero' | 'lifestyle' | 'process' | 'detail' | 'brand' | 'specs' | 'usage';
  promptZh: string;
  promptEn: string;
  negative: string;
}

interface PromptsSystem {
  logo: string;
  posters: PosterPrompt[];
}

interface GeneratedPoster {
  id: string;
  url: string;
  status: 'completed' | 'failed';
}

interface AppState {
  currentStep: number;
  uploadedImage: UploadedImage | null;
  productInfo: AnalysisResponse | null;
  editedProductInfo: AnalysisResponse | null;
  selectedStyle: StyleConfig | null;
  generatedPrompts: PromptsSystem | null;
  generatedPosters: GeneratedPoster[] | null;
  isLoading: boolean;
  error: string | null;
}

interface AppActions {
  setCurrentStep: (step: number) => void;
  setUploadedImage: (image: UploadedImage) => void;
  setProductInfo: (info: AnalysisResponse) => void;
  updateProductInfo: (info: Partial<AnalysisResponse>) => void;
  setSelectedStyle: (style: StyleConfig) => void;
  setGeneratedPrompts: (prompts: PromptsSystem) => void;
  setGeneratedPosters: (posters: GeneratedPoster[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// 创建 Context
const AppContext = createContext<AppState & AppActions | undefined>(undefined);

// Provider 组件
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    currentStep: 0,
    uploadedImage: null,
    productInfo: null,
    editedProductInfo: null,
    selectedStyle: null,
    generatedPrompts: null,
    generatedPosters: null,
    isLoading: false,
    error: null,
  });

  const actions: AppActions = {
    setCurrentStep: (step) => setState((prev) => ({ ...prev, currentStep: step })),
    setUploadedImage: (image) => setState((prev) => ({ ...prev, uploadedImage: image })),
    setProductInfo: (info) => setState((prev) => ({ ...prev, productInfo: info, editedProductInfo: info })),
    updateProductInfo: (info) => setState((prev) => ({
      ...prev,
      editedProductInfo: prev.editedProductInfo ? { ...prev.editedProductInfo, ...info } : null
    })),
    setSelectedStyle: (style) => setState((prev) => ({ ...prev, selectedStyle: style })),
    setGeneratedPrompts: (prompts) => setState((prev) => ({ ...prev, generatedPrompts: prompts })),
    setGeneratedPosters: (posters) => setState((prev) => ({ ...prev, generatedPosters: posters })),
    setLoading: (loading) => setState((prev) => ({ ...prev, isLoading: loading })),
    setError: (error) => setState((prev) => ({ ...prev, error })),
    reset: () => setState({
      currentStep: 0,
      uploadedImage: null,
      productInfo: null,
      editedProductInfo: null,
      selectedStyle: null,
      generatedPrompts: null,
      generatedPosters: null,
      isLoading: false,
      error: null,
    }),
  };

  return (
    <AppContext.Provider value={{ ...state, ...actions }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
```

**Step 2: 提交**
```bash
git add .
git commit -m "feat: add global state management with Context API"
```

---

### Task 8: 创建自定义 Hooks

**Files:**
- Create: `hooks/useLoading.ts`
- Create: `hooks/usePersistedState.ts`

**Step 1: 创建加载状态 Hook**
```typescript
// hooks/useLoading.ts
'use client';

import { useState, useCallback } from 'react';

export function useLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');

  const startLoading = (initialMessage = '加载中...') => {
    setIsLoading(true);
    setProgress(0);
    setMessage(initialMessage);
  };

  const updateProgress = (newProgress: number, newMessage?: string) => {
    setProgress(Math.min(100, Math.max(0, newProgress)));
    if (newMessage) setMessage(newMessage);
  };

  const stopLoading = () => {
    setIsLoading(false);
    setProgress(100);
  };

  return {
    isLoading,
    progress,
    message,
    startLoading,
    updateProgress,
    stopLoading,
  };
}
```

**Step 2: 创建持久化状态 Hook**
```typescript
// hooks/usePersistedState.ts
'use client';

import { useState, useEffect } from 'react';

export function usePersistedState<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  };

  return [storedValue, setValue];
}
```

**Step 3: 提交**
```bash
git add .
git commit -m "feat: add custom hooks for loading and persisted state"
```

---

## Phase 4: 根布局和导航 (Day 4)

### Task 9: 更新根布局

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

**Step 1: 更新 layout.tsx**
```typescript
// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/contexts/AppContext';
import { ErrorBoundary } from '@/lib/errors/errorBoundary';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'KV Generator - 电商海报生成工具',
  description: 'AI 驱动的电商 KV 海报生成工具,5 分钟生成 10 张专业海报',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <ErrorBoundary>
          <AppProvider>
            <div className="min-h-screen bg-background">
              {/* Header */}
              <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
                <div className="container flex h-16 items-center px-4">
                  <h1 className="text-xl font-bold">KV Generator</h1>
                </div>
              </header>

              {/* Main Content */}
              <main className="container py-8 px-4">
                {children}
              </main>

              {/* Footer */}
              <footer className="border-t py-6">
                <div className="container text-center text-sm text-muted-foreground px-4">
                  © 2026 KV Generator. All rights reserved.
                </div>
              </footer>
            </div>
          </AppProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

**Step 2: 提交**
```bash
git add .
git commit -m "feat: update root layout with header and footer"
```

---

### Task 10: 创建首页(上传图片)

**Files:**
- Create: `app/page.tsx`
- Create: `components/ImageUpload.tsx`

**Step 1: 创建图片上传组件**
```typescript
// components/ImageUpload.tsx
'use client';

import { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';
import { Card } from '@/components/ui/card';

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
      if (file.size <= 10 * 1024 * 1024) { // 10MB
        const reader = new FileReader();
        reader.onload = (e) => {
          const preview = e.target?.result as string;
          onUpload(file, preview);
        };
        reader.readAsDataURL(file);
      } else {
        alert('图片大小不能超过 10MB');
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
      className={`relative border-2 border-dashed transition-all cursor-pointer p-12
        ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
      `}
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
            className="w-full max-w-md mx-auto rounded-lg"
          />
          <p className="text-center text-sm text-muted-foreground">点击重新上传</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <Upload className="w-12 h-12 text-muted-foreground" />
          <div className="text-center">
            <p className="text-lg font-medium">拖拽图片到此处</p>
            <p className="text-sm text-muted-foreground">或点击上传</p>
            <p className="text-xs text-muted-foreground mt-2">
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

**Step 2: 创建首页**
```typescript
// app/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/ImageUpload';
import { useAppContext } from '@/contexts/AppContext';

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
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">上传产品图片</h2>
        <p className="text-muted-foreground">
          AI 将自动分析产品信息并生成 10 张专业电商海报
        </p>
      </div>

      <ImageUpload onUpload={handleUpload} image={imagePreview} />

      {imagePreview && (
        <div className="flex justify-center">
          <Button size="lg" onClick={handleAnalyze}>
            开始分析 →
          </Button>
        </div>
      )}
    </div>
  );
}
```

**Step 3: 测试首页**
```bash
npm run dev
```
访问 http://localhost:3000,验证:
- 可以看到上传界面
- 拖拽图片可以上传
- 点击上传可以上传
- 上传后显示"开始分析"按钮

**Step 4: 提交**
```bash
git add .
git commit -m "feat: add home page with image upload"
```

---

## Phase 5: AI 分析功能 (Day 5-6)

### Task 11: 集成 Gemini API

**Files:**
- Create: `lib/api/gemini.ts`

**Step 1: 创建 Gemini API 集成**
```typescript
// lib/api/gemini.ts
import { withRetry } from '@/lib/errors/errorHandler';

interface AnalysisResponse {
  brandName: {
    zh: string;
    en: string;
  };
  productType: {
    category: string;
    specific: string;
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

const ANALYSIS_PROMPT = `
请仔细分析这张产品图片,提取以下信息并以 JSON 格式返回:

1. 品牌名称(中英文)
2. 产品类型(大类和具体产品)
3. 产品规格
4. 核心卖点(5个,中英文双语)
5. 配色方案(主色、辅助色、点缀色的 HEX 值)
6. 设计风格
7. 目标受众
8. 品牌调性
9. 包装亮点
10. 产品参数(净含量、成分、营养、用法、保质期、储存)
11. 推荐的视觉风格(从以下选择: magazine, watercolor, tech, vintage, minimal, cyber, organic)
12. 推荐的文字排版(从以下选择: glassmorphism, 3d, handwritten, serif, sans-serif, thin)

请严格按照以下 JSON 格式返回:
{
  "brandName": {"zh": "", "en": ""},
  "productType": {"category": "", "specific": ""},
  "specifications": "",
  "sellingPoints": [
    {"zh": "", "en": ""},
    {"zh": "", "en": ""},
    {"zh": "", "en": ""},
    {"zh": "", "en": ""},
    {"zh": "", "en": ""}
  ],
  "colorScheme": {
    "primary": ["#HEX", "#HEX"],
    "secondary": ["#HEX"],
    "accent": ["#HEX", "#HEX"]
  },
  "designStyle": "",
  "targetAudience": "",
  "brandTone": "",
  "packagingHighlights": ["", "", ""],
  "parameters": {
    "netContent": "",
    "ingredients": "",
    "nutrition": "",
    "usage": "",
    "shelfLife": "",
    "storage": ""
  },
  "recommendedStyle": "",
  "recommendedTypography": ""
}
`;

export async function analyzeProduct(imageBase64: string): Promise<AnalysisResponse> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  // 移除 base64 前缀
  const base64Data = imageBase64.split(',')[1] || imageBase64;

  return withRetry(async () => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: ANALYSIS_PROMPT
              },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: base64Data
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 8192,
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gemini API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No response from Gemini API');
    }

    // 提取 JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const result = JSON.parse(jsonMatch[0]);
    return result as AnalysisResponse;
  });
}
```

**Step 2: 提交**
```bash
git add .
git commit -m "feat: integrate Gemini API for product analysis"
```

---

### Task 12: 创建分析页面

**Files:**
- Create: `app/analyze/page.tsx`
- Create: `components/LoadingScreen.tsx`

**Step 1: 创建加载屏幕组件**
```typescript
// components/LoadingScreen.tsx
'use client';

import { Progress } from '@/components/ui/progress';

interface LoadingScreenProps {
  progress: number;
  message: string;
}

export function LoadingScreen({ progress, message }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="max-w-md w-full p-8 space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-lg font-medium">{message}</p>
          <p className="text-sm text-muted-foreground">
            预计剩余时间: {Math.ceil((100 - progress) / 20)} 分钟
          </p>
        </div>

        <Progress value={progress} className="h-2" />

        <p className="text-center text-sm text-muted-foreground">
          {Math.round(progress)}%
        </p>
      </div>
    </div>
  );
}
```

**Step 2: 创建分析页面**
```typescript
// app/analyze/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { useLoading } from '@/hooks/useLoading';
import { analyzeProduct } from '@/lib/api/gemini';
import { LoadingScreen } from '@/components/LoadingScreen';
import { setProductInfo } from '@/contexts/AppContext';

export default function AnalyzePage() {
  const router = useRouter();
  const { uploadedImage, setProductInfo } = useAppContext();
  const { isLoading, progress, message, startLoading, updateProgress, stopLoading } = useLoading();

  useEffect(() => {
    if (!uploadedImage) {
      router.push('/');
      return;
    }

    const analyze = async () => {
      startLoading('AI 正在分析产品图片...');

      try {
        updateProgress(20, '识别品牌名称...');
        await new Promise(resolve => setTimeout(resolve, 500));

        updateProgress(40, '提取产品信息...');
        const result = await analyzeProduct(uploadedImage.preview);

        updateProgress(80, '分析配色方案...');
        await new Promise(resolve => setTimeout(resolve, 500));

        updateProgress(100, '分析完成!');
        setProductInfo(result);

        setTimeout(() => {
          stopLoading();
          router.push('/edit');
        }, 500);
      } catch (error) {
        console.error('Analysis failed:', error);
        alert('分析失败: ' + (error instanceof Error ? error.message : '未知错误'));
        stopLoading();
        router.push('/');
      }
    };

    analyze();
  }, [uploadedImage]);

  if (isLoading) {
    return <LoadingScreen progress={progress} message={message} />;
  }

  return null;
}
```

**Step 3: 提交**
```bash
git add .
git commit -m "feat: add analysis page with loading screen"
```

---

## Phase 6: 信息编辑页面 (Day 7)

### Task 13: 创建编辑页面

**Files:**
- Create: `app/edit/page.tsx`

**Step 1: 创建编辑页面**
```typescript
// app/edit/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

export default function EditPage() {
  const router = useRouter();
  const { editedProductInfo, updateProductInfo, setSelectedStyle } = useAppContext();

  useEffect(() => {
    if (!editedProductInfo) {
      router.push('/');
    }
  }, [editedProductInfo]);

  if (!editedProductInfo) {
    return null;
  }

  const handleNext = () => {
    setSelectedStyle({
      visual: editedProductInfo.recommendedStyle,
      typography: editedProductInfo.recommendedTypography,
      textLayout: 'stacked',
    });
    router.push('/style');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">编辑产品信息</h2>
        <p className="text-muted-foreground">
          请确认并编辑 AI 提取的产品信息
        </p>
      </div>

      <Card className="p-6 space-y-6">
        {/* 品牌名称 */}
        <div className="space-y-2">
          <Label>品牌名称 (中文)</Label>
          <Input
            value={editedProductInfo.brandName.zh}
            onChange={(e) => updateProductInfo({
              brandName: { ...editedProductInfo.brandName, zh: e.target.value }
            })}
          />
        </div>

        <div className="space-y-2">
          <Label>品牌名称 (英文)</Label>
          <Input
            value={editedProductInfo.brandName.en}
            onChange={(e) => updateProductInfo({
              brandName: { ...editedProductInfo.brandName, en: e.target.value }
            })}
          />
        </div>

        {/* 产品类型 */}
        <div className="space-y-2">
          <Label>产品类别</Label>
          <Input
            value={editedProductInfo.productType.category}
            onChange={(e) => updateProductInfo({
              productType: { ...editedProductInfo.productType, category: e.target.value }
            })}
          />
        </div>

        <div className="space-y-2">
          <Label>具体产品</Label>
          <Input
            value={editedProductInfo.productType.specific}
            onChange={(e) => updateProductInfo({
              productType: { ...editedProductInfo.productType, specific: e.target.value }
            })}
          />
        </div>

        {/* 核心卖点 */}
        <div className="space-y-2">
          <Label>核心卖点</Label>
          <div className="space-y-2">
            {editedProductInfo.sellingPoints.map((point, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={point.zh}
                  onChange={(e) => {
                    const newPoints = [...editedProductInfo.sellingPoints];
                    newPoints[index] = { ...newPoints[index], zh: e.target.value };
                    updateProductInfo({ sellingPoints: newPoints });
                  }}
                  placeholder="中文卖点"
                />
                <Input
                  value={point.en}
                  onChange={(e) => {
                    const newPoints = [...editedProductInfo.sellingPoints];
                    newPoints[index] = { ...newPoints[index], en: e.target.value };
                    updateProductInfo({ sellingPoints: newPoints });
                  }}
                  placeholder="English卖点"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 配色方案 */}
        <div className="space-y-2">
          <Label>主色调</Label>
          <div className="flex gap-2">
            {editedProductInfo.colorScheme.primary.map((color, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-12 h-12 rounded border"
                  style={{ backgroundColor: color }}
                />
                <Input
                  value={color}
                  onChange={(e) => {
                    const newColors = [...editedProductInfo.colorScheme.primary];
                    newColors[index] = e.target.value;
                    updateProductInfo({
                      colorScheme: { ...editedProductInfo.colorScheme, primary: newColors }
                    });
                  }}
                  className="w-24"
                />
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          ← 上一步
        </Button>
        <Button onClick={handleNext}>
          下一步: 选择风格 →
        </Button>
      </div>
    </div>
  );
}
```

**Step 2: 提交**
```bash
git add .
git commit -m "feat: add edit page for product information"
```

---

## 验证和测试

在每个 Phase 完成后,运行以下命令验证:

```bash
# 1. 类型检查
npm run type-check

# 2. 代码检查
npm run lint

# 3. 构建测试
npm run build

# 4. 本地测试
npm run dev
```

访问 http://localhost:3000 验证功能:
- [ ] 首页可以上传图片
- [ ] 分析页面正常显示加载进度
- [ ] 编辑页面可以修改产品信息

---

## 部署到 Vercel

### Task 14: 部署配置

**Step 1: 推送到 GitHub**
```bash
git add .
git commit -m "feat: complete Phase 1-6 implementation"
git remote add origin https://github.com/yourusername/kv-generator.git
git push -u origin main
```

**Step 2: 在 Vercel 导入项目**
1. 访问 https://vercel.com
2. 点击 "New Project"
3. 导入 GitHub 仓库 `kv-generator`
4. 配置环境变量:
   - `NEXT_PUBLIC_GEMINI_API_KEY`
   - `NEXT_PUBLIC_NANO_BANANA_API_KEY`
5. 点击 "Deploy"

**Step 3: 验证部署**
- 访问 Vercel 提供的域名
- 测试完整流程

---

## 下一步

完成 Phase 1-6 后,继续实施:
- Phase 7: 风格选择页面
- Phase 8: 提示词生成
- Phase 9: 海报生成
- Phase 10: 优化和测试

这些内容将在后续的实施计划中详细说明。
