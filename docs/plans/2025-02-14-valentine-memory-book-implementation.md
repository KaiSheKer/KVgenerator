# 情人节时光回忆录实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 创建一个复古胶片风格的照片回忆录网站，支持CSV内容管理、自动播放背景音乐、翻页浏览体验，部署到Vercel并生成分享链接。

**Architecture:** Next.js 15 + Tailwind CSS构建响应式单页应用，使用Papa Parse解析CSV配置，Next.js Image组件优化照片加载，Vercel零配置部署。

**Tech Stack:** Next.js 15, Tailwind CSS, Papa Parse, Lucide React, Vercel, Google Fonts

---

## Task 1: 创建Next.js项目并配置Tailwind CSS

**Files:**
- Create: `package.json`, `next.config.js`, `tailwind.config.js`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`

**Step 1: 创建项目目录结构**

```bash
cd /Users/ericcao/CascadeProjects
mkdir valentine-memory-book
cd valentine-memory-book
```

**Step 2: 初始化Next.js项目**

```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --use-npm
```

预期输出：
```
✔ Would you like to use TypeScript? … Yes
✔ Would you like to use Tailwind CSS? … Yes
✔ Would you like to use App Router? … Yes
```

**Step 3: 安装额外依赖**

```bash
npm install papaparse lucide-react
npm install --save-dev @types/papaparse
```

**Step 4: 验证项目结构**

```bash
ls -la
```

预期输出应该包含：
```
app/  public/  node_modules/  package.json  tailwind.config.ts  next.config.ts
```

**Step 5: 启动开发服务器验证**

```bash
npm run dev
```

预期输出：
```
✓ Ready in 2.3s
◈ Local: http://localhost:3000
```

**Step 6: 停止开发服务器并提交**

```bash
# Ctrl+C 停止服务器
git add .
git commit -m "feat: initialize Next.js project with Tailwind CSS"
```

---

## Task 2: 配置Google Fonts（中文字体）

**Files:**
- Modify: `app/layout.tsx`

**Step 1: 修改layout.tsx导入中文字体**

```typescript
// app/layout.tsx
import type { Metadata } from "next";
import { Ma_Shan_Zheng, Zhi_Mang_Xing, Noto_Serif_SC } from "next/font/google";

const maShanZheng = Ma_Shan_Zheng({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-ma-shan-zheng",
  display: "swap",
});

const zhiMangXing = Zhi_Mang_Xing({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-zhi-mang-xing",
  display: "swap",
});

const notoSerifSC = Noto_Serif_SC({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-noto-serif-sc",
  display: "swap",
});

export const metadata: Metadata = {
  title: "我们的时光·Valentine Memory Book",
  description: "那些细节，我都记得",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${maShanZheng.variable} ${zhiMangXing.variable} ${notoSerifSC.variable} font-serif antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
```

**Step 2: 提交配置**

```bash
git add app/layout.tsx
git commit -m "feat: add Chinese handwriting fonts from Google Fonts"
```

---

## Task 3: 创建全局样式（胶片效果）

**Files:**
- Modify: `app/globals.css`

**Step 1: 编写胶片效果CSS**

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg-color: #f5f0e8;
  --text-color: #3d342b;
  --accent-color: #c94a4a;
}

body {
  background-color: var(--bg-color);
  color: var(--text-color);
  position: relative;
  overflow-x: hidden;
}

/* 胶片噪点效果 */
.film-noise::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 50;
  opacity: 0.05;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}

/* 暗角效果 */
.vignette::after {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 49;
  background: radial-gradient(circle, transparent 50%, rgba(0, 0, 0, 0.15) 100%);
}

/* 胶卷齿孔边框 */
.film-frame {
  position: relative;
  background: #fff;
  padding: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.film-frame::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 8px;
  background: repeating-linear-gradient(
    to bottom,
    #1a1a1a 0px,
    #1a1a1a 8px,
    transparent 8px,
    transparent 16px
  );
}

/* 照片旋转动画 */
.photo-rotate-neg { transform: rotate(-2deg); }
.photo-rotate-pos { transform: rotate(2deg); }
.photo-rotate-none { transform: rotate(0deg); }

/* 纸张纹理 */
.paper-texture {
  background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paper)' opacity='0.3'/%3E%3C/svg%3E");
}

/* 手写字体类 */
.font-handwriting {
  font-family: var(--font-ma-shan-zheng), cursive;
}

/* 装饰线 */
.decorative-line {
  height: 1px;
  background: linear-gradient(to right, transparent, var(--text-color) 20%, var(--text-color) 80%, transparent);
  opacity: 0.3;
}

/* 日期印章样式 */
.date-stamp {
  font-family: var(--font-zhi-mang-xing), cursive;
  color: var(--accent-color);
  border: 2px solid var(--accent-color);
  border-radius: 4px;
  padding: 4px 12px;
  display: inline-block;
  transform: rotate(-5deg);
  opacity: 0.9;
}
```

**Step 2: 提交样式**

```bash
git add app/globals.css
git commit -m "feat: add film effect styles (noise, vignette, frame)"
```

---

## Task 4: 创建CSV配置文件和示例数据

**Files:**
- Create: `public/photos.csv`

**Step 1: 创建示例CSV文件**

```csv
image,date,location,title,story
photo-001.jpg,2024.03.15,星巴克,那个下午你说,还记得我们在咖啡馆坐了整个下午，你穿那件米色毛衣，阳光刚好洒在你侧脸，你说"这样的阳光真好"
photo-002.jpg,2024.05.20,外滩,第一次看夜景,那天风很大，你帮我整理围巾，黄浦江的灯火映在你眼睛里，比风景更美
photo-003.jpg,2024.08.14,家里,一起做饭,你炒菜时哼着歌，我偷偷拍了张背影，这是我们最日常也最珍贵的瞬间
photo-004.jpg,2024.10.01,西湖,旅行,你说要带我看你大学时最爱的日落，我们错过了最佳时间，但你说"有你在就好"
photo-005.jpg,2025.01.01,街头,新年第一天,我们在人群中倒数，新年的第一秒，你在许愿，我在看你
```

**Step 2: 创建占位照片说明**

```bash
mkdir -p public/photos
cat > public/photos/README.md << 'EOF'
# 照片文件夹说明

请将你的照片放到这个文件夹，命名为：
- photo-001.jpg
- photo-002.jpg
- photo-003.jpg
...

照片要求：
- 格式：JPG或PNG
- 建议：1920x1080或更大
- 质量：70-80%压缩比

iPhone HEIC格式转换：
1. 在照片应用中导出为JPG
2. 或使用在线转换工具
EOF
```

**Step 3: 提交配置**

```bash
git add public/photos.csv public/photos/README.md
git commit -m "feat: add CSV configuration and photo instructions"
```

---

## Task 5: 添加背景音乐文件

**Files:**
- Create: `public/background-music.mp3`

**Step 1: 创建占位音乐文件说明**

```bash
cat > public/music/README.md << 'EOF'
# 背景音乐说明

请将背景音乐文件命名为：background-music.mp3

推荐曲目：River Flows In You - Yiruma

音乐获取方式：
1. 从你的音乐库中导出
2. 或使用合法的音乐平台下载
3. 确保文件大小不超过10MB（Vercel限制）
EOF

mkdir -p public/music
```

**Step 2: 提交说明**

```bash
git add public/music/README.md
git commit -m "feat: add music placeholder instructions"
```

---

## Task 6: 创建类型定义

**Files:**
- Create: `types/photo.ts`

**Step 1: 定义Photo类型**

```typescript
// types/photo.ts
export interface Photo {
  id: string;
  image: string;
  date: string;
  location: string;
  title: string;
  story: string;
}

export interface CSVPhoto {
  image: string;
  date: string;
  location: string;
  title: string;
  story: string;
}
```

**Step 2: 提交类型定义**

```bash
git add types/photo.ts
git commit -m "feat: add TypeScript types for Photo data"
```

---

## Task 7: 创建CSV解析工具函数

**Files:**
- Create: `lib/parseCSV.ts`

**Step 1: 实现CSV解析函数**

```typescript
// lib/parseCSV.ts
import Papa from 'papaparse';
import { CSVPhoto, Photo } from '@/types/photo';

export async function parsePhotosFromCSV(): Promise<Photo[]> {
  try {
    const response = await fetch('/photos.csv');
    const csvText = await response.text();

    const parsed = Papa.parse<CSVPhoto>(csvText, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
    });

    if (parsed.errors.length > 0) {
      console.error('CSV解析错误:', parsed.errors);
      throw new Error('CSV解析失败');
    }

    return parsed.data.map((item, index) => ({
      id: `photo-${index + 1}`,
      image: `/photos/${item.image}`,
      date: item.date,
      location: item.location,
      title: item.title,
      story: item.story,
    }));
  } catch (error) {
    console.error('加载CSV失败:', error);
    return [];
  }
}
```

**Step 2: 提交解析函数**

```bash
git add lib/parseCSV.ts
git commit -m "feat: add CSV parsing utility with error handling"
```

---

## Task 8: 创建音乐播放器组件

**Files:**
- Create: `components/MusicPlayer.tsx`

**Step 1: 实现音乐播放器**

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import { Music, Music2, X } from 'lucide-react';

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // 尝试自动播放
    audio.volume = 0;
    audio.play().then(() => {
      // 淡入效果
      const fadeIn = setInterval(() => {
        if (audio.volume < volume) {
          audio.volume = Math.min(audio.volume + 0.05, volume);
        } else {
          clearInterval(fadeIn);
        }
      }, 100);

      setIsPlaying(true);
      return () => clearInterval(fadeIn);
    }).catch((error) => {
      console.log('自动播放被阻止，需要用户交互:', error);
    });
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <>
      <audio
        ref={audioRef}
        src="/music/background-music.mp3"
        loop
        playsInline
      />
      <div className="fixed top-6 right-6 z-50 flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="p-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all"
          aria-label={isPlaying ? '暂停音乐' : '播放音乐'}
        >
          {isPlaying ? (
            <Music className="w-5 h-5 text-amber-700" />
          ) : (
            <Music2 className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>
    </>
  );
}
```

**Step 2: 提交音乐播放器**

```bash
git add components/MusicPlayer.tsx
git commit -m "feat: add music player with auto-play and fade-in"
```

---

## Task 9: 创建照片展示组件

**Files:**
- Create: `components/PhotoDisplay.tsx`

**Step 1: 实现照片展示组件**

```typescript
'use client';

import Image from 'next/image';
import { Photo } from '@/types/photo';

interface PhotoDisplayProps {
  photo: Photo;
  index: number;
}

export default function PhotoDisplay({ photo, index }: PhotoDisplayProps) {
  // 随机旋转角度
  const rotations = ['photo-rotate-neg', 'photo-rotate-pos', 'photo-rotate-none'];
  const rotation = rotations[index % 3];

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto px-6 py-12">
      {/* 日期印章 */}
      <div className="mb-6">
        <div className="date-stamp text-lg">
          📷 {photo.date}
        </div>
      </div>

      {/* 照片区域 */}
      <div className={`film-frame ${rotation} transition-transform duration-500 hover:scale-105`}>
        <div className="relative w-full h-[60vh] min-h-[400px] max-h-[700px]">
          <Image
            src={photo.image}
            alt={photo.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            priority={index < 3}
          />
        </div>
      </div>

      {/* 装饰线 */}
      <div className="decorative-line w-64 my-10"></div>

      {/* 文字区域 */}
      <div className="max-w-xl text-center space-y-4">
        {/* 标题 */}
        <h2 className="font-handwriting text-3xl text-amber-900 leading-relaxed">
          ☁️ {photo.title}
        </h2>

        {/* 故事 */}
        <div className="paper-texture bg-amber-50/50 rounded-lg p-6 shadow-sm">
          <p className="text-lg leading-loose text-gray-800 whitespace-pre-line">
            📝 {photo.story}
          </p>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: 提交照片展示组件**

```bash
git add components/PhotoDisplay.tsx
git commit -m "feat: add photo display component with film effect"
```

---

## Task 10: 创建导航控制组件

**Files:**
- Create: `components/Navigation.tsx`

**Step 1: 实现导航控制**

```typescript
'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface NavigationProps {
  currentIndex: number;
  totalPhotos: number;
  onPrevious: () => void;
  onNext: () => void;
}

export default function Navigation({
  currentIndex,
  totalPhotos,
  onPrevious,
  onNext,
}: NavigationProps) {
  return (
    <div className="fixed bottom-8 left-0 right-0 flex justify-center items-center gap-8 z-40">
      <button
        onClick={onPrevious}
        disabled={currentIndex === 0}
        className="p-4 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 active:scale-95"
        aria-label="上一张"
      >
        <ChevronLeft className="w-6 h-6 text-gray-700" />
      </button>

      <div className="text-lg font-serif text-gray-700 bg-white/80 backdrop-blur-sm px-6 py-2 rounded-full shadow-sm">
        {currentIndex + 1} / {totalPhotos}
      </div>

      <button
        onClick={onNext}
        disabled={currentIndex === totalPhotos - 1}
        className="p-4 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 active:scale-95"
        aria-label="下一张"
      >
        <ChevronRight className="w-6 h-6 text-gray-700" />
      </button>
    </div>
  );
}
```

**Step 2: 提交导航组件**

```bash
git add components/Navigation.tsx
git commit -m "feat: add navigation controls with page counter"
```

---

## Task 11: 创建主页面组件

**Files:**
- Modify: `app/page.tsx`

**Step 1: 实现主页面逻辑**

```typescript
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Photo } from '@/types/photo';
import { parsePhotosFromCSV } from '@/lib/parseCSV';

const MusicPlayer = dynamic(() => import('@/components/MusicPlayer'), { ssr: false });
const PhotoDisplay = dynamic(() => import('@/components/PhotoDisplay'), { ssr: false });
const Navigation = dynamic(() => import('@/components/Navigation'), { ssr: false });

export default function Home() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPhotos() {
      const loadedPhotos = await parsePhotosFromCSV();
      if (loadedPhotos.length > 0) {
        setPhotos(loadedPhotos);
      }
      setIsLoading(false);
    }
    loadPhotos();
  }, []);

  useEffect(() => {
    function handleKeyPress(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else if (event.key === 'ArrowRight' && currentIndex < photos.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    }

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, photos]);

  function handlePrevious() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleNext() {
    if (currentIndex < photos.length - 1) {
      setCurrentIndex(currentIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">📷</div>
          <p className="font-handwriting text-2xl text-gray-600">正在加载回忆...</p>
        </div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="font-handwriting text-2xl text-gray-600 mb-4">
            还没有照片呢
          </p>
          <p className="text-sm text-gray-500">
            请先上传照片到 public/photos/ 文件夹，并编辑 public/photos.csv
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="film-noise vignette min-h-screen pb-24">
      <MusicPlayer />
      <PhotoDisplay
        photo={photos[currentIndex]}
        index={currentIndex}
      />
      <Navigation
        currentIndex={currentIndex}
        totalPhotos={photos.length}
        onPrevious={handlePrevious}
        onNext={handleNext}
      />
    </main>
  );
}
```

**Step 2: 提交主页面**

```bash
git add app/page.tsx
git commit -m "feat: implement main page with photo gallery and keyboard navigation"
```

---

## Task 12: 配置Next.js图片域名

**Files:**
- Modify: `next.config.ts`

**Step 1: 配置图片优化**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
    unoptimized: true,
  },
};

export default nextConfig;
```

**Step 2: 提交配置**

```bash
git add next.config.ts
git commit -m "feat: configure Next.js image optimization"
```

---

## Task 13: 添加响应式优化

**Files:**
- Modify: `components/PhotoDisplay.tsx`

**Step 1: 优化移动端展示**

在 PhotoDisplay 组件的图片区域添加响应式样式：

```typescript
// 修改图片容器的高度部分
<div className={`film-frame ${rotation} transition-transform duration-500 hover:scale-105`}>
  <div className="relative w-full h-[50vh] min-h-[300px] max-h-[600px] md:h-[60vh] md:min-h-[400px]">
    <Image
      src={photo.image}
      alt={photo.title}
      fill
      className="object-cover"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
      priority={index < 3}
    />
  </div>
</div>
```

**Step 2: 提交优化**

```bash
git add components/PhotoDisplay.tsx
git commit -m "feat: optimize photo display for mobile devices"
```

---

## Task 14: 添加触摸滑动支持（移动端）

**Files:**
- Create: `hooks/useSwipe.ts`

**Step 1: 创建滑动手势hook**

```typescript
'use client';

import { useEffect, useRef } from 'react';

interface SwipeCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export function useSwipe({ onSwipeLeft, onSwipeRight }: SwipeCallbacks) {
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const minSwipeDistance = 50;

  useEffect(() => {
    function handleTouchStart(e: TouchEvent) {
      touchStartX.current = e.changedTouches[0].screenX;
    }

    function handleTouchEnd(e: TouchEvent) {
      touchEndX.current = e.changedTouches[0].screenX;
      handleSwipe();
    }

    function handleSwipe() {
      const distance = touchStartX.current - touchEndX.current;

      if (Math.abs(distance) < minSwipeDistance) return;

      if (distance > 0) {
        // 向左滑动 → 下一张
        onSwipeLeft?.();
      } else {
        // 向右滑动 ← 上一张
        onSwipeRight?.();
      }
    }

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight]);
}
```

**Step 2: 集成到主页面**

修改 `app/page.tsx`，添加滑动手势：

```typescript
import { useSwipe } from '@/hooks/useSwipe';

// 在 Home 组件内添加：
useSwipe({
  onSwipeLeft: () => {
    if (currentIndex < photos.length - 1) {
      handleNext();
    }
  },
  onSwipeRight: () => {
    if (currentIndex > 0) {
      handlePrevious();
    }
  },
});
```

**Step 3: 提交触摸支持**

```bash
git add hooks/useSwipe.ts app/page.tsx
git commit -m "feat: add touch swipe gestures for mobile navigation"
```

---

## Task 15: 创建部署配置文件

**Files:**
- Create: `vercel.json`

**Step 1: 配置Vercel项目**

```json
{
  "name": "valentine-memory-book",
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "regions": ["hkg1"]
}
```

**Step 2: 提交配置**

```bash
git add vercel.json
git commit -m "feat: add Vercel deployment configuration"
```

---

## Task 16: 创建README文档

**Files:**
- Create: `README.md`

**Step 1: 编写使用说明**

```markdown
# 💕 情人节时光回忆录

一个复古胶片风格的照片回忆录网站，专为情人节制作。

## 快速开始

### 1. 准备照片

将你的照片放到 `public/photos/` 文件夹：
- 命名为：photo-001.jpg, photo-002.jpg, ...
- 格式：JPG或PNG
- iPhone HEIC格式需先转换为JPG

### 2. 编辑内容

编辑 `public/photos.csv` 文件：

```csv
image,date,location,title,story
photo-001.jpg,2024.03.15,星巴克,那个下午你说,还记得我们在咖啡馆...
photo-002.jpg,2024.05.20,外滩,第一次看夜景,那天风很大...
```

### 3. 添加音乐

将背景音乐放到 `public/music/background-music.mp3`

推荐：River Flows In You - Yiruma

### 4. 本地开发

```bash
npm install
npm run dev
```

访问 http://localhost:3000

### 5. 部署到Vercel

```bash
npm install -g vercel
vercel login
vercel
```

## 功能特性

- ✅ 复古胶片视觉效果（噪点、暗角、胶卷边框）
- ✅ 自动播放背景音乐（淡入效果）
- ✅ 键盘导航（← → 方向键）
- ✅ 触摸滑动（移动端）
- ✅ CSV内容管理（用Excel编辑）
- ✅ 响应式设计（手机电脑完美展示）
- ✅ Vercel一键部署（HTTPS + 全球CDN）

## 技术栈

- Next.js 15
- Tailwind CSS
- Papa Parse (CSV解析)
- Lucide React (图标)
- Vercel (部署)

## 项目结构

\`\`\`
valentine-memory-book/
├── app/
│   ├── layout.tsx          # 全局布局和字体配置
│   ├── page.tsx            # 主页面组件
│   └── globals.css         # 全局样式（胶片效果）
├── components/
│   ├── MusicPlayer.tsx    # 音乐播放器
│   ├── PhotoDisplay.tsx   # 照片展示
│   └── Navigation.tsx     # 导航控制
├── lib/
│   └── parseCSV.ts        # CSV解析工具
├── hooks/
│   └── useSwipe.ts        # 滑动手势
├── types/
│   └── photo.ts           # TypeScript类型
├── public/
│   ├── photos/           # 照片文件夹
│   ├── music/            # 音乐文件夹
│   └── photos.csv        # 内容配置文件
└── README.md
\`\`\`

## 更新内容

1. 添加新照片到 `public/photos/`
2. 编辑 `public/photos.csv` 添加对应记录
3. 重新部署：`vercel --prod`

## 许可证

MIT License - 专为爱制作 ❤️
```

**Step 2: 提交文档**

```bash
git add README.md
git commit -m "docs: add comprehensive README with setup instructions"
```

---

## Task 17: 最终测试和验证

**Step 1: 运行开发服务器**

```bash
npm run dev
```

预期输出：
```
✓ Ready in 2.3s
◈ Local: http://localhost:3000
```

**Step 2: 手动测试清单**

访问 http://localhost:3000 并验证：

- [ ] 页面加载正常，显示第一张照片
- [ ] 音乐自动播放（淡入效果）
- [ ] 照片显示胶片效果（边框、旋转、噪点）
- [ ] 文字内容正确显示（日期、标题、故事）
- [ ] 点击"下一张"按钮可以翻页
- [ ] 键盘方向键可以翻页
- [ ] 移动端可以左右滑动翻页
- [ ] 页码显示正确（1/5, 2/5...）
- [ ] 音乐开关按钮工作正常
- [ ] 响应式布局（调整浏览器窗口大小）
- [ ] 最后一页"下一张"按钮禁用
- [ ] 第一页"上一张"按钮禁用

**Step 3: 检查浏览器控制台**

```bash
# 打开浏览器开发者工具，检查：
- 无JavaScript错误
- 无404资源加载错误
- CSV解析成功
```

**Step 4: 提交最终代码**

```bash
git add .
git commit -m "feat: complete Valentine memory book implementation"
```

---

## Task 18: 部署到Vercel

**Step 1: 安装Vercel CLI**

```bash
npm install -g vercel
```

**Step 2: 登录Vercel**

```bash
vercel login
```

按照提示打开浏览器完成认证。

**Step 3: 部署项目**

```bash
vercel
```

预期输出：
```
? Set up and deploy "~/valentine-memory-book"? [Y/n] Y
? Which scope do you want to deploy to? Your Name
? Link to existing project? [y/N] N
? What's your project's name? valentine-memory-book
? In which directory is your code located? ./

🔍  Inspect
📡  Preparing...
⚙️  Installing...
🔨  Building...
✓  Done!

📦  Production: https://valentine-memory-book-xxx.vercel.app
```

**Step 4: 验证部署**

访问Vercel生成的链接，确认：
- [ ] 页面正常加载
- [ ] 照片显示正确
- [ ] 音乐播放正常
- [ ] 移动端测试（用手机打开链接）

**Step 5: 生产部署（如果测试成功）**

```bash
vercel --prod
```

**Step 6: 记录部署信息**

将Vercel链接保存，例如：
```
部署链接：https://valentine-memory-book.vercel.app
部署时间：2025-02-14
```

---

## Task 19: 创建示例照片（可选，用于测试）

**Step 1: 下载示例照片**

如果没有真实照片，可以先用占位图片测试：

```bash
# 在 public/photos/ 文件夹中创建示例图片
# 可以使用在线工具生成占位图
# 或暂时复制同一张照片多次用于测试
```

**Step 2: 更新CSV**

```bash
# 编辑 photos.csv 确保记录与实际照片文件匹配
```

---

## Task 20: 清理和优化

**Step 1: 清理不必要的文件**

```bash
# 删除Vercel临时文件（如果有）
rm -rf .vercel

# 确保git仓库干净
git status
```

**Step 2: 最终提交**

```bash
git add .
git commit -m "chore: final cleanup before production"
```

**Step 3: 创建git标签**

```bash
git tag v1.0.0
git push --tags
```

---

## 验收标准

完成所有任务后，确认：

✅ **功能完整性**
- [ ] 照片可以正常浏览
- [ ] 音乐自动播放
- [ ] 支持键盘、点击、触摸三种导航方式
- [ ] CSV内容管理正常工作

✅ **视觉效果**
- [ ] 胶片噪点和暗角效果
- [ ] 照片边框和旋转
- [ ] 手写字体显示
- [ ] 响应式布局

✅ **性能**
- [ ] 首屏加载 < 3秒
- [ ] 照片懒加载
- [ ] 无明显卡顿

✅ **兼容性**
- [ ] Chrome/Safari正常
- [ ] iOS Safari正常
- [ ] 微信浏览器正常

✅ **部署**
- [ ] Vercel部署成功
- [ ] HTTPS证书正常
- [ ] 全球CDN加速

---

## 预计完成时间

| 阶段 | 任务 | 时间 |
|------|------|------|
| 1-7 | 项目搭建和配置 | 30分钟 |
| 8-14 | 核心功能开发 | 2小时 |
| 15-17 | 文档和优化 | 30分钟 |
| 18 | 部署上线 | 15分钟 |
| 19-20 | 测试和清理 | 15分钟 |
| **总计** | | **3-3.5小时** |

---

## 故障排查

### 音乐无法自动播放

**原因：** 浏览器自动播放策略阻止

**解决：**
1. 在音乐播放器中添加用户交互触发
2. 或显示"点击开始"按钮

### CSV解析失败

**原因：**
- 文件编码错误（需UTF-8）
- CSV格式不正确

**解决：**
1. 用Excel保存时选择"CSV UTF-8"
2. 检查CSV表头和字段分隔符

### 照片显示404

**原因：**
- 文件路径不匹配
- 文件名大小写错误

**解决：**
1. 确保 CSV 中的 image 字段与实际文件名一致
2. 检查文件扩展名（.jpg vs .JPG）

### Vercel部署失败

**原因：**
- 构建错误
- 依赖安装失败

**解决：**
1. 检查 `vercel.json` 配置
2. 本地 `npm run build` 测试
3. 查看Vercel部署日志

---

## 下一步（可选）

- [ ] 添加视频支持（Live Photos）
- [ ] 生成PDF版本用于打印
- [ ] 添加分享到社交媒体功能
- [ ] 创建自定义域名
- [ ] 添加更多照片过渡动画

---

**实施计划完成！准备好开始编码了 🚀**

记得：YAGNI、TDD、频繁提交、每步都测试。
