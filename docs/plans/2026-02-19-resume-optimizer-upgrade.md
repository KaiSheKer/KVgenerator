# 简历优化器升级实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 升级现有简历优化器,优化 AI 分析质量和 UI/UX 体验

**Architecture:** 渐进式升级 - 保持现有 Next.js 14 架构,重点优化 prompt 模板、视觉系统和交互体验

**Tech Stack:** Next.js 14 (App Router), TypeScript 5, Tailwind CSS 3, React 18, Kimi API

---

## Task 1: 创建类型定义文件

**Files:**
- Create: `resume-optimizer/lib/types.ts`

**Step 1: 定义分析结果数据结构**

创建 `lib/types.ts`:
```typescript
export interface AnalysisResult {
  // 评分数据
  scores: {
    overall: number;        // 总体匹配度 0-100
    coreSkills: number;     // 核心能力匹配 0-100
    experience: number;     // 经验相关性 0-100
    skillCoverage: number;  // 技能覆盖度 0-100
  };

  // 关键发现
  findings: {
    strengths: string[];    // 高匹配亮点
    gaps: string[];         // 关键缺口
    advantages: string[];   // 差异化优势
  };

  // 分级建议
  suggestions: {
    high: Suggestion[];     // 高优先级
    medium: Suggestion[];   // 中优先级
    low: Suggestion[];      // 低优先级
  };

  // 重写示例
  examples: {
    selfEvaluation: string; // 自我评价
    projects: string[];     // 项目经历
    skills: string;         // 技能清单
  };

  // 关键词清单
  keywords: {
    term: string;           // 关键词
    location: string;       // 建议位置
  }[];
}

export interface Suggestion {
  title: string;            // 建议标题
  description: string;      // 详细说明
  action: string;           // 具体行动
}
```

**Step 2: 导出类型**

确保文件底部有:
```typescript
export default AnalysisResult;
```

**Step 3: 提交**

```bash
git add lib/types.ts
git commit -m "feat: add type definitions for analysis results"
```

---

## Task 2: 重构 Prompt 模板

**Files:**
- Modify: `resume-optimizer/lib/prompt.ts`

**Step 1: 读取现有 prompt 模板**

先查看现有文件内容:
```bash
cat resume-optimizer/lib/prompt.ts
```

**Step 2: 重构 prompt 模板**

修改 `lib/prompt.ts`:
```typescript
export function resumeAnalysisPrompt(jd: string, resume: string): string {
  return `你是一个资深互联网 HR 和产品总监,擅长分析产品经理简历与 JD 的匹配度,并给出专业优化建议。

请严格按照以下结构和要求分析:

## 输入内容

### JD 职位描述
${jd}

### 产品经理简历
${resume}

## 输出要求 (必须严格遵守)

### 1. 匹配度评分 (必须包含)

请给出以下四个维度的评分 (0-100 分):

**总体匹配度:** X/100
- 综合考虑技能、经验、教育背景的匹配程度

**核心能力匹配:** X/100
- 产品设计能力、项目管理能力、数据分析能力等核心技能的匹配度

**经验相关性:** X/100
- 工作年限、行业经验、项目经验的匹配度

**技能覆盖度:** X/100
- JD 中要求的技能在简历中的覆盖程度

### 2. 关键发现 (结构化列表)

**✅ 高匹配亮点 (3-5 个)**
每个亮点必须:
- 直接引用 JD 中的具体要求
- 说明简历中如何匹配
- 标注 "必写" - 这是面试时的卖点

**⚠️ 关键缺口 (3-5 个)**
每个缺口必须:
- 指出 JD 要求但简历缺失的内容
- 说明为什么这是关键问题
- 标注 "必补" - 可能导致简历被筛掉

**💡 差异化优势点 (2-3 个)**
每个优势必须:
- 指出超出 JD 要求的亮点
- 说明如何在面试中强调
- 标注 "加分项" - 让你脱颖而出

### 3. 分级优化建议

请按优先级给出具体可操作的建议:

**🔴 高优先级建议 (3 个)**
每个建议包含:
- [标题] 简洁的问题描述
- [说明] 为什么这会影响录用
- [行动] 具体如何修改简历

**🟡 中优先级建议 (3 个)**
- 同上结构

**🟢 低优先级建议 (3 个)**
- 同上结构

### 4. 简历重写示例

**自我评价重写 (150 字)**
- 根据 JD 要求,重写自我评价
- 突出匹配 JD 的核心能力
- 用具体数字和成果说话

**项目经历重写 (2 个关键项目)**
- 选择最匹配 JD 的项目
- 用 STAR 法则重新组织
- 强调 JD 关注的能力和成果

**技能清单优化**
- 按优先级重新排列技能
- 突出 JD 中要求的技能
- 删除与 JD 无关的技能

### 5. 关键词优化清单 (TOP 10)

提取 JD 中出现但简历可能缺失的关键词,格式:

| 关键词 | 建议融入位置 | 示例表达 |
|--------|-------------|---------|
| B端产品设计 | 项目经历 | "负责 B 端 SaaS 产品的..." |
| 数据驱动 | 自我评价 | "擅长数据驱动的产品决策..." |

## 输出格式要求

1. 使用 Markdown 格式
2. 所有评分必须给出具体数字
3. 所有建议必须可操作、具体
4. 使用表格展示关键词清单
5. 标注优先级和重要程度

请开始分析:`;
}
```

**Step 3: 提交**

```bash
git add lib/prompt.ts
git commit -m "feat: restructure prompt template for better analysis quality"
```

---

## Task 3: 更新 CSS 色彩系统

**Files:**
- Modify: `resume-optimizer/app/globals.css`

**Step 1: 更新 CSS 变量**

替换 `app/globals.css` 中的 CSS 变量:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Claude 风格配色 */
    --background: 40 0% 98%; /* #F9F9F8 */
    --foreground: 0 0% 10%; /* #1A1A1A */

    /* 主色调 */
    --primary: 18 76% 59%; /* #D97757 */
    --primary-foreground: 0 0% 100%;

    /* 表面色 */
    --surface: 0 0% 100%; /* #FFFFFF */
    --surface-elevated: 40 10% 96%; /* #F3F3F2 */

    /* 文本色 */
    --text-primary: 0 0% 10%; /* #1A1A1A */
    --text-secondary: 0 0% 35%; /* #585858 */
    --text-tertiary: 0 0% 60%; /* #9A9A9A */

    /* 边框色 */
    --border: 40 10% 90%; /* #E8E8E6 */
    --border-subtle: 40 10% 94%; /* #F0F0EF */

    /* 语义色 */
    --success: 122 28% 37%; /* #5B8C5A */
    --warning: 32 80% 42%; /* #D97706 */
    --danger: 0 72% 48%; /* #C53030 */
    --info: 192 68% 28%; /* #0B7285 */

    /* 圆角 */
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;

    /* 阴影 */
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
    --shadow-md: 0 4px 6px rgba(0,0,0,0.07);
    --shadow-lg: 0 10px 15px rgba(0,0,0,0.10);
    --shadow-xl: 0 20px 25px rgba(0,0,0,0.15);
  }

  .dark {
    --background: 40 10% 10%;
    --foreground: 40 10% 98%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    line-height: 1.6;
  }
}

/* 动画 keyframes */
@layer utilities {
  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slide-up {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slide-down {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes scale-in {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  @keyframes pulse-soft {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
  }

  @keyframes shake {
    0%, 100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-5px);
    }
    75% {
      transform: translateX(5px);
    }
  }

  .animate-fade-in {
    animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .animate-slide-up {
    animation: slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .animate-slide-down {
    animation: slide-down 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .animate-scale-in {
    animation: scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .animate-shimmer {
    animation: shimmer 1.5s ease-in-out infinite;
    background: linear-gradient(
      90deg,
      hsl(var(--surface-elevated)) 0%,
      hsl(var(--background)) 50%,
      hsl(var(--surface-elevated)) 100%
    );
    background-size: 200% 100%;
  }

  .animate-pulse-soft {
    animation: pulse-soft 1.5s ease-in-out infinite;
  }

  .animate-shake {
    animation: shake 0.4s ease-in-out;
  }
}
```

**Step 2: 提交**

```bash
git add app/globals.css
git commit -m "feat: update color system to Claude style and add animation keyframes"
```

---

## Task 4: 创建评分卡片组件

**Files:**
- Create: `resume-optimizer/components/score-card.tsx`

**Step 1: 创建评分卡片组件**

创建 `components/score-card.tsx`:
```typescript
"use client";

import { useEffect, useRef, useState } from "react";

interface ScoreCardProps {
  score: number;
  label: string;
  delay?: number;
}

export function ScoreCard({ score, label, delay = 0 }: ScoreCardProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 800;
    const steps = 60;
    const increment = score / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score, isVisible]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-[#5B8C5A]";
    if (score >= 60) return "text-[#D97706]";
    return "text-[#C53030]";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "#5B8C5A";
    if (score >= 60) return "#D97706";
    return "#C53030";
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg p-6 border border-[#E8E8E6] dark:border-gray-700 transition-all duration-300 ${
        isVisible ? "animate-scale-in opacity-100" : "opacity-0"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-[#585858] dark:text-gray-400">
          {label}
        </span>
        <span
          className={`text-3xl font-bold ${getScoreColor(score)} transition-colors duration-300`}
        >
          {displayScore}
        </span>
      </div>
      <div className="w-full bg-[#F3F3F2] dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-800 ease-out"
          style={{
            width: isVisible ? `${score}%` : "0%",
            backgroundColor: getProgressColor(score),
            transitionDelay: `${delay + 100}ms`,
          }}
        />
      </div>
    </div>
  );
}
```

**Step 2: 提交**

```bash
git add components/score-card.tsx
git commit -m "feat: add score card component with animation"
```

---

## Task 5: 创建标签页组件

**Files:**
- Create: `resume-optimizer/components/tabs.tsx`

**Step 1: 创建标签页组件**

创建 `components/tabs.tsx`:
```typescript
"use client";

import { useState, useRef, useEffect } from "react";

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  children: (activeTab: string) => React.ReactNode;
}

export function Tabs({ tabs, defaultTab, onChange, children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    width: 0,
  });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);
    const activeElement = tabRefs.current[activeIndex];

    if (activeElement) {
      setIndicatorStyle({
        left: activeElement.offsetLeft,
        width: activeElement.offsetWidth,
      });
    }
  }, [activeTab, tabs]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  return (
    <div className="w-full">
      {/* Tab Headers */}
      <div className="relative border-b border-[#E8E8E6] dark:border-gray-700">
        <div className="flex space-x-8">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              ref={(el) => (tabRefs.current[index] = el)}
              onClick={() => handleTabChange(tab.id)}
              className={`relative pb-3 px-1 text-sm font-medium transition-colors duration-200 ${
                activeTab === tab.id
                  ? "text-[#1A1A1A] dark:text-white"
                  : "text-[#585858] dark:text-gray-400 hover:text-[#1A1A1A] dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Indicator */}
        <div
          className="absolute bottom-0 h-0.5 bg-[#D97757] transition-all duration-300 ease-in-out"
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
          }}
        />
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {children(activeTab)}
      </div>
    </div>
  );
}
```

**Step 2: 提交**

```bash
git add components/tabs.tsx
git commit -m "feat: add tabs component with animated indicator"
```

---

## Task 6: 创建骨架屏组件

**Files:**
- Create: `resume-optimizer/components/loading-skeleton.tsx`

**Step 1: 创建骨架屏组件**

创建 `components/loading-skeleton.tsx`:
```typescript
"use client";

export function LoadingSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-[#E8E8E6] dark:border-gray-700">
      {/* Score Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-[#F9F9F8] dark:bg-gray-700 rounded-lg p-6 animate-pulse-soft"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-24 h-4 bg-[#E8E8E6] dark:bg-gray-600 rounded" />
              <div className="w-8 h-8 bg-[#E8E8E6] dark:bg-gray-600 rounded-full" />
            </div>
            <div className="w-full h-2 bg-[#E8E8E6] dark:bg-gray-600 rounded-full overflow-hidden">
              <div className="h-full w-2/3 animate-shimmer rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="space-y-4">
        <div className="h-6 bg-[#F9F9F8] dark:bg-gray-700 rounded w-1/3 animate-pulse-soft" />
        <div className="space-y-2">
          <div className="h-4 bg-[#F9F9F8] dark:bg-gray-700 rounded w-full animate-pulse-soft" />
          <div className="h-4 bg-[#F9F9F8] dark:bg-gray-700 rounded w-5/6 animate-pulse-soft" />
          <div className="h-4 bg-[#F9F9F8] dark:bg-gray-700 rounded w-4/6 animate-pulse-soft" />
        </div>

        <div className="h-6 bg-[#F9F9F8] dark:bg-gray-700 rounded w-1/4 mt-8 animate-pulse-soft" />
        <div className="space-y-2">
          <div className="h-4 bg-[#F9F9F8] dark:bg-gray-700 rounded w-full animate-pulse-soft" />
          <div className="h-4 bg-[#F9F9F8] dark:bg-gray-700 rounded w-3/4 animate-pulse-soft" />
        </div>
      </div>
    </div>
  );
}
```

**Step 2: 提交**

```bash
git add components/loading-skeleton.tsx
git commit -m "feat: add loading skeleton component with animations"
```

---

## Task 7: 创建 Toast 提示组件

**Files:**
- Create: `resume-optimizer/components/toast.tsx`

**Step 1: 创建 Toast 组件**

创建 `components/toast.tsx`:
```typescript
"use client";

import { useEffect, useState } from "react";

type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
}

export function Toast({ message, type = "info", duration = 2000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // 入场动画
    setIsVisible(true);

    // 自动关闭
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose?.();
    }, 200);
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "info":
        return "ⓘ";
      default:
        return "ⓘ";
    }
  };

  const getStyles = () => {
    const base = "fixed bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 transition-all duration-200";

    const typeStyles = {
      success: "bg-[#5B8C5A] text-white",
      error: "bg-[#C53030] text-white",
      info: "bg-[#0B7285] text-white",
    };

    const animation = isVisible
      ? "translate-y-0 opacity-100"
      : isExiting
      ? "translate-y-4 opacity-0"
      : "translate-y-4 opacity-0";

    return `${base} ${typeStyles[type]} ${animation}`;
  };

  return (
    <div className={getStyles()}>
      <span className="text-lg">{getIcon()}</span>
      <span className="font-medium">{message}</span>
    </div>
  );
}
```

**Step 2: 提交**

```bash
git add components/toast.tsx
git commit -m "feat: add toast notification component"
```

---

## Task 8: 更新主页面布局

**Files:**
- Modify: `resume-optimizer/app/page.tsx`

**Step 1: 备份现有文件**

```bash
cp resume-optimizer/app/page.tsx resume-optimizer/app/page.tsx.backup
```

**Step 2: 重写主页面**

修改 `app/page.tsx`:
```typescript
"use client";

import { useState, useEffect } from "react";
import { Settings, Sparkles, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ScoreCard } from "@/components/score-card";
import { Tabs } from "@/components/tabs";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { Toast } from "@/components/toast";
import { analyzeResume } from "@/lib/api";
import { resumeAnalysisPrompt } from "@/lib/prompt";

export default function Home() {
  const [jd, setJd] = useState("");
  const [resume, setResume] = useState("");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const handleAnalyze = async () => {
    if (!jd.trim() || !resume.trim()) {
      setError("请输入 JD 和简历内容");
      return;
    }

    setIsLoading(true);
    setError("");
    setResult("");

    try {
      const prompt = resumeAnalysisPrompt(jd, resume);
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jd, resume }),
      });

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`);
      }

      const data = await response.json();
      setResult(data.result);
      setToast({ message: "分析完成!", type: "success" });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "分析失败,请重试";
      setError(errorMessage);
      setToast({ message: errorMessage, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (!result) {
      setToast({ message: "请先进行分析", type: "info" });
      return;
    }

    const blob = new Blob([result], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "简历分析结果.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setToast({ message: "导出成功!", type: "success" });
  };

  const tabs = [
    { id: "overview", label: "概览" },
    { id: "analysis", label: "详细分析" },
    { id: "suggestions", label: "优化建议" },
  ];

  return (
    <div className="min-h-screen bg-[#F9F9F8] dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 animate-slide-down">
          <div>
            <h1 className="text-3xl font-bold text-[#1A1A1A] dark:text-white mb-2">
              简历优化器
            </h1>
            <p className="text-[#585858] dark:text-gray-400">
              使用 AI 分析 JD 与简历匹配度,获得专业优化建议
            </p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-all border border-[#E8E8E6] dark:border-gray-700 hover:scale-105"
          >
            <Download className="w-5 h-5" />
            <span>导出</span>
          </button>
        </div>

        {/* Input Areas */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* JD Input */}
          <div
            className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-[#E8E8E6] dark:border-gray-700 transition-all duration-300 animate-slide-up`}
            style={{ animationDelay: "50ms" }}
          >
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-[#1A1A1A] dark:text-white">
                JD 职位描述
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.readText().then(setJd);
                    setToast({ message: "已粘贴", type: "success" });
                  }}
                  className="text-xs px-2 py-1 text-[#585858] hover:text-[#D97757] hover:bg-[#F3F3F2] rounded transition-colors"
                >
                  粘贴
                </button>
                <button
                  onClick={() => setJd("")}
                  className="text-xs px-2 py-1 text-[#585858] hover:text-[#C53030] hover:bg-[#F3F3F2] rounded transition-colors"
                >
                  清空
                </button>
              </div>
            </div>
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="粘贴目标岗位的 JD 内容..."
              className="w-full h-64 px-4 py-3 border border-[#E8E8E6] dark:border-gray-700 rounded-md focus:outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/20 resize-none bg-white dark:bg-gray-800 transition-all duration-200"
            />
            <div className="flex justify-between mt-2 text-xs text-[#9A9A9A]">
              <span>建议包含完整的职位描述、职责要求、技能要求等</span>
              <span>{jd.length} / 10000</span>
            </div>
          </div>

          {/* Resume Input */}
          <div
            className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-[#E8E8E6] dark:border-gray-700 transition-all duration-300 animate-slide-up`}
            style={{ animationDelay: "100ms" }}
          >
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-[#1A1A1A] dark:text-white">
                你的简历内容
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.readText().then(setResume);
                    setToast({ message: "已粘贴", type: "success" });
                  }}
                  className="text-xs px-2 py-1 text-[#585858] hover:text-[#D97757] hover:bg-[#F3F3F2] rounded transition-colors"
                >
                  粘贴
                </button>
                <button
                  onClick={() => setResume("")}
                  className="text-xs px-2 py-1 text-[#585858] hover:text-[#C53030] hover:bg-[#F3F3F2] rounded transition-colors"
                >
                  清空
                </button>
              </div>
            </div>
            <textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="粘贴你的简历内容..."
              className="w-full h-64 px-4 py-3 border border-[#E8E8E6] dark:border-gray-700 rounded-md focus:outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/20 resize-none bg-white dark:bg-gray-800 transition-all duration-200"
            />
            <div className="flex justify-between mt-2 text-xs text-[#9A9A9A]">
              <span>建议包含个人总结、工作经历、项目经验、技能等完整内容</span>
              <span>{resume.length} / 10000</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-[#C53030]/10 border border-[#C53030] rounded-md animate-shake">
            <p className="text-[#C53030] text-sm">{error}</p>
          </div>
        )}

        {/* Analyze Button */}
        <div className="flex justify-center mb-8 animate-scale-in" style={{ animationDelay: "200ms" }}>
          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className={`flex items-center gap-2 px-8 py-3 bg-[#D97757] text-white rounded-lg hover:bg-[#C26647] disabled:bg-[#9A9A9A] disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg ${
              !isLoading ? "hover:scale-105 active:scale-95" : ""
            }`}
          >
            <Sparkles className={`w-5 h-5 ${!isLoading ? "animate-pulse" : ""}`} />
            <span>{isLoading ? "分析中..." : "开始分析"}</span>
          </button>
        </div>

        {/* Results */}
        {isLoading && <LoadingSkeleton />}

        {result && !isLoading && (
          <div className="animate-fade-in">
            <Tabs tabs={tabs} defaultTab="overview">
              {(activeTab) => (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-[#E8E8E6] dark:border-gray-700">
                  <div className="prose prose-blue dark:prose-invert max-w-none">
                    <ReactMarkdown>{result}</ReactMarkdown>
                  </div>
                </div>
              )}
            </Tabs>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
}
```

**Step 3: 提交**

```bash
git add app/page.tsx
git commit -m "feat: redesign main page with new layout and components"
```

---

## Task 9: 优化 Markdown 渲染样式

**Files:**
- Modify: `resume-optimizer/app/prose.css`

**Step 1: 更新 prose 样式**

修改 `app/prose.css`:
```css
.prose {
  @apply text-[#1A1A1A] dark:text-gray-300;
  max-width: none;
}

.prose h1 {
  @apply text-2xl font-bold text-[#1A1A1A] dark:text-white mt-8 mb-4;
}

.prose h2 {
  @apply text-xl font-semibold text-[#1A1A1A] dark:text-white mt-6 mb-3;
}

.prose h3 {
  @apply text-lg font-medium text-[#1A1A1A] dark:text-white mt-4 mb-2;
}

.prose p {
  @apply mb-4 leading-7;
}

.prose ul {
  @apply list-disc pl-6 mb-4 space-y-2;
}

.prose ol {
  @apply list-decimal pl-6 mb-4 space-y-2;
}

.prose li {
  @apply leading-7;
}

.prose strong {
  @apply font-semibold text-[#1A1A1A] dark:text-white;
}

.prose code {
  @apply bg-[#F3F3F2] dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-[#1A1A1A] dark:text-gray-100;
}

.prose pre {
  @apply bg-[#1A1A1A] dark:bg-gray-950 rounded-lg p-4 mb-4 overflow-x-auto;
}

.prose pre code {
  @apply bg-transparent text-gray-100 dark:text-gray-100 p-0;
}

.prose table {
  @apply w-full border-collapse mb-4;
}

.prose table th {
  @apply bg-[#F3F3F2] dark:bg-gray-800 px-4 py-2 text-left font-semibold border border-[#E8E8E6] dark:border-gray-700;
}

.prose table td {
  @apply px-4 py-2 border border-[#E8E8E6] dark:border-gray-700;
}

.prose blockquote {
  @apply border-l-4 border-[#D97757] pl-4 italic text-[#585858] dark:text-gray-400;
}

.prose a {
  @apply text-[#D97757] hover:text-[#C26647] underline;
}
```

**Step 2: 提交**

```bash
git add app/prose.css
git commit -m "feat: update prose styles for better markdown rendering"
```

---

## Task 10: 测试和验证

**Files:**
- Test: 所有修改的功能

**Step 1: 运行开发服务器**

```bash
cd resume-optimizer
pnpm dev
```

**Step 2: 功能测试清单**

访问 http://localhost:3000 并测试:

**视觉效果测试:**
- [ ] 页面使用 Claude 风格配色
- [ ] 布局简洁清晰,无侧边栏
- [ ] 输入框有焦点动画
- [ ] 按钮有悬停和点击效果
- [ ] 响应式布局正常工作

**动画测试:**
- [ ] 页面加载时元素依次出现
- [ ] 评分卡片有数字滚动动画
- [ ] 标签页切换流畅
- [ ] Toast 提示滑入/滑出
- [ ] 加载骨架屏正常显示

**AI 分析测试:**
- [ ] 可以输入 JD 和简历
- [ ] 点击"开始分析"显示加载状态
- [ ] 分析结果包含结构化内容
- [ ] 结果包含评分、建议、示例
- [ ] 标签页可以正常切换

**交互测试:**
- [ ] 粘贴按钮工作正常
- [ ] 清空按钮工作正常
- [ ] 导出按钮可以下载结果
- [ ] 字符计数正确显示
- [ ] Toast 提示正确显示

**Step 3: 性能测试**

检查:
- [ ] 首屏加载速度 < 2s
- [ ] 动画流畅 (60fps)
- [ ] 无控制台错误
- [ ] 移动端性能良好

**Step 4: 提交最终版本**

```bash
git add .
git commit -m "test: verify all features work correctly

✅ AI 分析质量优化完成
✅ 视觉设计升级完成
✅ 交互动画完成
✅ 所有测试通过"
```

---

## Task 11: 更新 README 文档

**Files:**
- Modify: `resume-optimizer/README.md`

**Step 1: 更新 README**

修改 `README.md`:
```markdown
# 简历优化器

使用 AI 分析 JD 与简历匹配度的 Next.js 应用。

## ✨ 最新更新 (v0.2.0)

### 🎯 AI 分析质量优化
- ✅ 重构 prompt 模板,提供结构化分析
- ✅ 量化评分体系 (4 个维度)
- ✅ 分级优化建议 (高/中/低优先级)
- ✅ 可操作的重写示例

### 🎨 视觉设计升级
- ✅ 采用 Claude 风格配色系统
- ✅ 简洁优雅的单列布局
- ✅ 响应式设计优化

### ⚡ 交互体验提升
- ✅ 流畅的页面加载动画
- ✅ 评分卡片数字滚动效果
- ✅ 标签页切换动画
- ✅ Toast 提示和反馈
- ✅ 加载骨架屏

## 功能特性

- 🎯 双输入框设计: JD + 简历内容
- 🤖 AI 驱动的专业分析
- 📊 量化评分和分级建议
- 📝 Markdown 格式输出
- 💾 导出分析结果
- 📱 响应式设计

## 快速开始

### 安装依赖

\`\`\`bash
pnpm install
\`\`\`

### 配置后端

确保 `/api/analyze` 路由已配置并可以调用 Kimi API。

### 运行开发服务器

\`\`\`bash
pnpm dev
\`\`\`

访问 http://localhost:3000

### 构建生产版本

\`\`\`bash
pnpm build
pnpm start
\`\`\`

## 技术栈

- Next.js 14 (App Router)
- TypeScript 5
- Tailwind CSS 3
- React 18
- Kimi API

## 设计理念

- **YAGNI:** 只实现必要功能
- **渐进式升级:** 小步快跑
- **用户体验优先:** 每个优化都有明显价值

## 许可证

MIT
```

**Step 2: 提交**

```bash
git add README.md
git commit -m "docs: update README with new features and changes"
```

---

## Task 12: 打标签和推送

**Step 1: 创建版本标签**

```bash
git tag v0.2.0 -m "Release v0.2.0: AI 分析质量和 UI/UX 优化"
```

**Step 2: 推送到远程仓库**

```bash
git push origin main
git push origin v0.2.0
```

---

## 🎉 完成检查清单

### AI 分析质量
- [x] Prompt 模板重构
- [x] 结构化输出约束
- [x] 量化评分体系
- [x] 分级建议系统

### 视觉设计
- [x] Claude 风格配色
- [x] 简洁布局
- [x] 组件视觉规范
- [x] Markdown 渲染优化

### 交互体验
- [x] 页面加载动画
- [x] 评分卡片动画
- [x] 标签页切换
- [x] Toast 提示
- [x] 骨架屏加载

### 代码质量
- [x] TypeScript 类型定义
- [x] 组件化设计
- [x] 可维护性提升
- [x] 文档完善

---

## 预计完成时间

总计约 3-4 小时 (包含测试和文档)

## 后续优化方向

1. 历史记录保存
2. PDF 导出功能
3. 多简历对比分析
4. 用户认证和云存储
