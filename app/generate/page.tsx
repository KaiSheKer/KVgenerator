'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { useLoading } from '@/hooks/useLoading';
import { generatePoster, generatePosterMock } from '@/lib/api/client';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type {
  GeneratedPoster,
  GenerationQualityMode,
  PosterAspectRatio,
} from '@/contexts/AppContext';

interface PosterProgress {
  id: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  url?: string;
  error?: string;
}

export default function GeneratePage() {
  const router = useRouter();
  const {
    generatedPrompts,
    selectedStyle,
    selectedPosterIds,
    selectedQualityMode,
    uploadedImage,
    setGeneratedPosters,
  } = useAppContext();
  const { isLoading, progress, message, startLoading, updateProgress, stopLoading } = useLoading();
  const [postersProgress, setPostersProgress] = useState<PosterProgress[]>([]);
  const [completed, setCompleted] = useState(false);
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';

  const getPosterSize = useCallback((aspectRatio?: PosterAspectRatio) => {
    const ratio = aspectRatio || '9:16';
    const ratioMap: Record<PosterAspectRatio, { width: number; height: number }> = {
      '9:16': { width: 900, height: 1600 },
      '3:4': { width: 900, height: 1200 },
      '2:3': { width: 900, height: 1350 },
      '1:1': { width: 1200, height: 1200 },
      '4:3': { width: 1200, height: 900 },
      '3:2': { width: 1200, height: 800 },
      '16:9': { width: 1600, height: 900 },
      '21:9': { width: 2100, height: 900 },
    };
    return ratioMap[ratio];
  }, []);

  const postersToGenerate = useCallback(() => {
    if (!generatedPrompts) return [];
    if (!selectedPosterIds || selectedPosterIds.length === 0) {
      return generatedPrompts.posters;
    }
    const selectedSet = new Set(selectedPosterIds);
    return generatedPrompts.posters.filter((poster) => selectedSet.has(poster.id));
  }, [generatedPrompts, selectedPosterIds]);

  const resolveCandidateCount = useCallback((mode: GenerationQualityMode) => {
    switch (mode) {
      case 'fast':
        return 1;
      case 'balanced':
        return 2;
      case 'quality':
      default:
        return 3;
    }
  }, []);

  const scoreCandidate = useCallback((url: string, posterId: string, attempt: number) => {
    let score = 0;
    if (url.startsWith('data:image/')) score += 55;
    if (url.includes('placeholder')) score -= 80;
    if (url.length > 8000) score += 20;
    if (url.length > 30000) score += 10;
    if (posterId === '01' && url.length > 50000) score += 10;
    score += Math.max(0, 5 - attempt);
    return score;
  }, []);

  const isCapacityPeakError = useCallback((error: unknown) => {
    if (!(error instanceof Error)) return false;
    const message = error.message.toLowerCase();
    return (
      message.includes('gemini image api error (429)') ||
      message.includes('gemini image api error (503)') ||
      message.includes('resource_exhausted') ||
      message.includes('quota') ||
      message.includes('high demand')
    );
  }, []);

  const startGeneration = useCallback(async () => {
    if (!generatedPrompts) return;
    const queue = postersToGenerate();
    if (queue.length === 0) {
      router.push('/prompts');
      return;
    }
    const { width, height } = getPosterSize(selectedStyle?.aspectRatio);
    const candidateCount = resolveCandidateCount(selectedQualityMode);

    startLoading(`正在生成海报（${selectedQualityMode} 模式）...`);

    const results: GeneratedPoster[] = [];
    const total = queue.length;

    for (let i = 0; i < total; i++) {
      const poster = queue[i];
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
        let bestRawUrl = '';
        let bestScore = Number.NEGATIVE_INFINITY;
        const candidateErrors: string[] = [];

        for (let candidateIndex = 0; candidateIndex < candidateCount; candidateIndex++) {
          updateProgress(
            progressValue,
            `海报 ${poster.id} 候选 ${candidateIndex + 1}/${candidateCount} 生成中...`
          );
          try {
            const request = {
              // Keep AI-native text rendering; disable frontend post-overlay path.
              prompt: poster.promptEn,
              negative: poster.negative,
              width,
              height,
              referenceImage: uploadedImage?.preview,
            };
            const candidateUrl = useMock
              ? await generatePosterMock(request)
              : await generatePoster(request);
            const score = scoreCandidate(candidateUrl, poster.id, candidateIndex);
            if (!bestRawUrl || score > bestScore) {
              bestRawUrl = candidateUrl;
              bestScore = score;
            }
          } catch (candidateError) {
            const errorMessage =
              candidateError instanceof Error ? candidateError.message : '未知错误';
            candidateErrors.push(`候选 ${candidateIndex + 1}: ${errorMessage}`);
            console.warn(`海报 ${poster.id} 候选 ${candidateIndex + 1} 失败:`, candidateError);

            // 高峰期限流时，如果已有可用候选，直接降级采用当前最佳图，避免整张失败
            if (bestRawUrl && isCapacityPeakError(candidateError)) {
              updateProgress(
                progressValue,
                `海报 ${poster.id} 遇到限流，已采用当前最佳候选继续`
              );
              break;
            }
          }
        }
        if (!bestRawUrl) {
          const firstError = candidateErrors[0] || '未获取到可用候选图';
          throw new Error(firstError);
        }
        const finalUrl = bestRawUrl;

        setPostersProgress(prev =>
          prev.map(p =>
            p.id === poster.id
              ? { ...p, status: 'completed', url: finalUrl }
              : p
          )
        );

        results.push({
          id: poster.id,
          url: finalUrl,
          status: 'completed',
          activeVersionId: 'v1',
          versions: [
            {
              id: 'v1',
              url: finalUrl,
              source: 'initial',
              createdAt: Date.now(),
            },
          ],
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
  }, [
    generatedPrompts,
    getPosterSize,
    postersToGenerate,
    resolveCandidateCount,
    router,
    selectedStyle?.aspectRatio,
    setGeneratedPosters,
    scoreCandidate,
    selectedQualityMode,
    startLoading,
    stopLoading,
    updateProgress,
    uploadedImage?.preview,
    useMock,
    isCapacityPeakError,
  ]);

  useEffect(() => {
    if (!generatedPrompts) {
      router.push('/');
      return;
    }

    const queue = postersToGenerate();
    if (queue.length === 0) {
      router.push('/prompts');
      return;
    }

    const initialProgress = queue.map(poster => ({
      id: poster.id,
      status: 'pending' as const,
    }));
    setPostersProgress(initialProgress);

    startGeneration();
  }, [generatedPrompts, postersToGenerate, router, startGeneration]);

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
            <p className="text-sm text-muted-foreground">{message}</p>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {Math.round(progress)}% ({completedCount}/{total})
            </p>
          </div>

          {/* 海报进度网格 */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
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
            {(() => {
              const active = postersProgress.find((p) => p.status === 'generating');
              return active ? `当前: 海报 ${active.id}` : '当前: 汇总结果中';
            })()}
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
