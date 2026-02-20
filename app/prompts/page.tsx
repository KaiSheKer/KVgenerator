'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { generatePrompts } from '@/lib/utils/promptGenerator';
import { cn } from '@/lib/utils';

export default function PromptsPage() {
  const router = useRouter();
  const { editedProductInfo, selectedStyle, setGeneratedPrompts } = useAppContext();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const prompts = useMemo(() => {
    if (!editedProductInfo || !selectedStyle) return null;
    return generatePrompts(editedProductInfo, selectedStyle);
  }, [editedProductInfo, selectedStyle]);

  useEffect(() => {
    if (!editedProductInfo || !selectedStyle) {
      router.push('/');
      return;
    }

    if (prompts) {
      setGeneratedPrompts(prompts);
    }
  }, [editedProductInfo, prompts, router, selectedStyle, setGeneratedPrompts]);

  if (!editedProductInfo || !selectedStyle || !prompts) {
    return null;
  }

  const currentPrompt = prompts.posters[selectedIndex];
  const handleCopy = () => {
    navigator.clipboard.writeText(currentPrompt.promptZh);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerate = () => {
    router.push('/generate');
  };

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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold mb-2">
              海报 {currentPrompt.id} - {currentPrompt.title}
            </h3>
            <p className="text-sm text-muted-foreground">{currentPrompt.titleEn}</p>
          </div>
          <Button variant="outline" onClick={handleCopy}>
            {copied ? '✓ 已复制' : '复制中文提示词'}
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">中文提示词</h4>
            <div className="bg-muted p-4 rounded-xl whitespace-pre-wrap text-sm max-h-64 overflow-y-auto">
              {currentPrompt.promptZh}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">英文 Prompt</h4>
            <div className="bg-muted p-4 rounded-xl whitespace-pre-wrap text-sm max-h-64 overflow-y-auto">
              {currentPrompt.promptEn}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">负面词</h4>
            <div className="bg-muted p-4 rounded-xl whitespace-pre-wrap text-sm max-h-32 overflow-y-auto">
              {currentPrompt.negative}
            </div>
          </div>
        </div>
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
