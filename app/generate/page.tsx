'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { useLoading } from '@/hooks/useLoading';
import { generatePoster, generatePosterMock } from '@/lib/api/nanobanana';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { GeneratedPoster } from '@/contexts/AppContext';

interface PosterProgress {
  id: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  url?: string;
  error?: string;
}

export default function GeneratePage() {
  const router = useRouter();
  const { generatedPrompts, setGeneratedPosters } = useAppContext();
  const { isLoading, progress, message, startLoading, updateProgress, stopLoading } = useLoading();
  const [postersProgress, setPostersProgress] = useState<PosterProgress[]>([]);
  const [completed, setCompleted] = useState(false);
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';
  const generationLimit = 1;

  const startGeneration = useCallback(async () => {
    if (!generatedPrompts) return;

    startLoading('正在生成海报...');

    const results: GeneratedPoster[] = [];
    const postersToGenerate = generatedPrompts.posters.slice(0, generationLimit);
    const total = postersToGenerate.length;

    for (let i = 0; i < total; i++) {
      const poster = postersToGenerate[i];
      const progressValue = Math.round(((i + 1) / total) * 100);

      setPostersProgress(prev =>
        prev.map(p =>
          p.id === poster.id ? { ...p, status: 'generating' } : p
        )
      );

      updateProgress(
        progressValue,
        `正在生成海报 ${poster.id} - ${poster.title}...`
      );

      try {
        const request = {
          prompt: poster.promptEn,
          negative: poster.negative,
          width: 720,
          height: 1280,
        };
        const url = useMock
          ? await generatePosterMock(request)
          : await generatePoster(request);

        setPostersProgress(prev =>
          prev.map(p =>
            p.id === poster.id
              ? { ...p, status: 'completed', url }
              : p
          )
        );

        results.push({
          id: poster.id,
          url,
          status: 'completed',
        });
      } catch (error) {
        console.error(`生成海报 ${poster.id} 失败:`, error);

        setPostersProgress(prev =>
          prev.map(p =>
            p.id === poster.id
              ? { ...p, status: 'failed', error: error instanceof Error ? error.message : '未知错误' }
              : p
          )
        );
      }
    }

    setGeneratedPosters(results);
    updateProgress(100, '海报生成完成!');
    stopLoading();
    setCompleted(true);
  }, [generatedPrompts, setGeneratedPosters, startLoading, stopLoading, updateProgress, useMock]);

  useEffect(() => {
    if (!generatedPrompts) {
      router.push('/');
      return;
    }

    // 初始化进度
    const initialProgress = generatedPrompts.posters.slice(0, generationLimit).map(poster => ({
      id: poster.id,
      status: 'pending' as const,
    }));
    setPostersProgress(initialProgress);

    // 开始生成
    startGeneration();
  }, [generatedPrompts, router, startGeneration]);

  if (!generatedPrompts) {
    return null;
  }

  if (isLoading) {
    const completedCount = postersProgress.filter(p => p.status === 'completed').length;
    const total = postersProgress.length;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
        <div className="max-w-4xl w-full p-8 space-y-8">
          {/* 标题和进度 */}
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold">正在生成海报...</h2>
            <Progress value={progress} className="h-2" />
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

  if (completed) {
    const successCount = postersProgress.filter(p => p.status === 'completed').length;
    const failedCount = postersProgress.filter(p => p.status === 'failed').length;

    return (
      <div className="max-w-4xl mx-auto p-8 space-y-8 animate-fade-in">
        <Card className="p-8 text-center space-y-4 rounded-3xl">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-primary to-accent rounded-full">
            <span className="text-4xl">🎉</span>
          </div>
          <h2 className="text-3xl font-bold">海报生成完成!</h2>
          <div className="flex justify-center gap-8 text-sm">
            <div>
              <span className="font-semibold text-green-600">{successCount}</span> 张成功
            </div>
            {failedCount > 0 && (
              <div>
                <span className="font-semibold text-red-600">{failedCount}</span> 张失败
              </div>
            )}
          </div>
          <div className="flex justify-center gap-4 pt-4">
            <Button variant="outline" onClick={() => router.push('/gallery')}>
              查看成果
            </Button>
            <Button onClick={() => router.push('/')} className="bg-gradient-to-r from-primary to-accent">
              重新开始
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}
