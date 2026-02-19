'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { generatePrompts } from '@/lib/utils/promptGenerator';
import type { PromptsSystem } from '@/contexts/AppContext';

export default function PromptsPage() {
  const router = useRouter();
  const { editedProductInfo, selectedStyle, setGeneratedPrompts } = useAppContext();
  const [prompts, setPrompts] = useState<PromptsSystem | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!editedProductInfo || !selectedStyle) {
      router.push('/');
      return;
    }

    // 生成提示词
    const generatedPrompts = generatePrompts(editedProductInfo, selectedStyle);
    setPrompts(generatedPrompts);
    setGeneratedPrompts(generatedPrompts);
  }, [editedProductInfo, selectedStyle]);

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
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">生成的提示词</h2>
        <p className="text-muted-foreground">
          10 张海报的完整提示词已生成,查看并编辑后开始生成海报
        </p>
      </div>

      {/* 海报选择器 */}
      <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
        {prompts.posters.map((poster, index) => (
          <button
            key={poster.id}
            className={`p-3 rounded-lg border-2 transition-all ${
              selectedIndex === index
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => setSelectedIndex(index)}
          >
            <div className="text-xs text-center">
              <div className="font-semibold">{poster.id}</div>
              <div className="text-muted-foreground mt-1">{poster.title}</div>
            </div>
          </button>
        ))}
      </div>

      {/* 提示词详情 */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold">
              海报 {currentPrompt.id} - {currentPrompt.title}
            </h3>
            <p className="text-sm text-muted-foreground">{currentPrompt.titleEn}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCopy}>
              {copied ? '✓ 已复制' : '复制中文提示词'}
            </Button>
            <Button onClick={handleGenerate}>
              开始生成海报 →
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">中文提示词</h4>
            <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap text-sm max-h-96 overflow-y-auto">
              {currentPrompt.promptZh}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">英文 Prompt</h4>
            <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap text-sm max-h-96 overflow-y-auto">
              {currentPrompt.promptEn}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">负面词</h4>
            <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap text-sm max-h-32 overflow-y-auto">
              {currentPrompt.negative}
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          ← 上一步
        </Button>
        <Button size="lg" onClick={handleGenerate}>
          开始生成海报 →
        </Button>
      </div>
    </div>
  );
}
