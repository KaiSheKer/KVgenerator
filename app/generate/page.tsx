'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { useLoading } from '@/hooks/useLoading';
import { generatePoster, generatePosterMock } from '@/lib/api/nanobanana';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

  const startGeneration = useCallback(async () => {
    if (!generatedPrompts) return;

    startLoading('正在生成海报...');

    const results: GeneratedPoster[] = [];
    const total = generatedPrompts.posters.length;

    for (let i = 0; i < total; i++) {
      const poster = generatedPrompts.posters[i];
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
    const initialProgress = generatedPrompts.posters.map(poster => ({
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
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl w-full p-8 space-y-6">
          <div className="text-center space-y-2">
            <p className="text-lg font-medium">{message}</p>
            <p className="text-sm text-muted-foreground">
              预计剩余时间: {Math.ceil((100 - progress) / 10)} 秒
            </p>
          </div>

          <Progress value={progress} className="h-2" />

          <p className="text-center text-sm text-muted-foreground">
            {Math.round(progress)}%
          </p>

          {/* 海报生成进度 */}
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2 mt-8">
            {postersProgress.map((poster) => (
              <div
                key={poster.id}
                className={`p-3 rounded-lg border-2 text-center text-xs ${
                  poster.status === 'completed'
                    ? 'border-green-500 bg-green-500/10'
                    : poster.status === 'generating'
                    ? 'border-primary bg-primary/10'
                    : poster.status === 'failed'
                    ? 'border-red-500 bg-red-500/10'
                    : 'border-border'
                }`}
              >
                <div className="font-semibold">{poster.id}</div>
                <div className="mt-1">
                  {poster.status === 'completed' && '✓'}
                  {poster.status === 'generating' && '🔄'}
                  {poster.status === 'failed' && '✗'}
                  {poster.status === 'pending' && '⏳'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (completed) {
    const successCount = postersProgress.filter(p => p.status === 'completed').length;
    const failedCount = postersProgress.filter(p => p.status === 'failed').length;

    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <Card className="p-8 text-center space-y-4">
          <div className="text-6xl">🎉</div>
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
            <Button onClick={() => router.push('/')}>
              重新开始
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}
