'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { useLoading } from '@/hooks/useLoading';
import { generatePoster, generatePosterMock } from '@/lib/api/client';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type {
  GeneratedPoster,
  GenerationPipelineMode,
  GenerationQualityMode,
  PosterPrompt,
  PosterAspectRatio,
} from '@/contexts/AppContext';

interface PosterProgress {
  id: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  url?: string;
  error?: string;
}

interface PromptExecutionPayload {
  prompt: string;
  negative?: string;
  promptSource: string;
  negativeSource: string;
}

const GENERATION_MODE_LABELS: Record<GenerationPipelineMode, string> = {
  legacy_ai_text: 'AI原生出字',
  one_pass_layout: '一步成图（文案+布局）',
};

let generationSessionLock = false;

export default function GeneratePage() {
  const router = useRouter();
  const {
    generatedPrompts,
    selectedStyle,
    selectedPosterIds,
    selectedQualityMode,
    selectedGenerationMode,
    uploadedImage,
    setGeneratedPosters,
  } = useAppContext();
  const { isLoading, progress, message, startLoading, updateProgress, stopLoading } = useLoading();
  const [postersProgress, setPostersProgress] = useState<PosterProgress[]>([]);
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

  const resolvePromptExecution = useCallback(
    (poster: PosterPrompt): PromptExecutionPayload => {
      if (selectedGenerationMode === 'legacy_ai_text') {
        return {
          prompt: poster.promptEn,
          negative: poster.negative,
          promptSource: 'promptEn',
          negativeSource: 'negative',
        };
      }

      const runtimePrompt =
        typeof poster.runtimePromptEn === 'string' && poster.runtimePromptEn.trim().length > 0
          ? poster.runtimePromptEn
          : poster.promptEn;
      const runtimeNegative =
        typeof poster.runtimeNegative === 'string' && poster.runtimeNegative.trim().length > 0
          ? poster.runtimeNegative
          : poster.negative;

      return {
        prompt: runtimePrompt,
        negative: runtimeNegative,
        promptSource: runtimePrompt === poster.runtimePromptEn ? 'runtimePromptEn' : 'promptEn(fallback)',
        negativeSource: runtimeNegative === poster.runtimeNegative ? 'runtimeNegative' : 'negative(fallback)',
      };
    },
    [selectedGenerationMode]
  );

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

  const parseRetryDelayMs = useCallback((message: string): number | undefined => {
    const messageMatch = message.match(/retry(?:\s+again)?\s+in\s+([0-9.]+)\s*s?/i);
    if (messageMatch) {
      const seconds = Number(messageMatch[1]);
      if (Number.isFinite(seconds) && seconds > 0) {
        return Math.ceil(seconds * 1000);
      }
    }

    const retryInfoMatch = message.match(/"retryDelay"\s*:\s*"([0-9.]+)s"/i);
    if (retryInfoMatch) {
      const seconds = Number(retryInfoMatch[1]);
      if (Number.isFinite(seconds) && seconds > 0) {
        return Math.ceil(seconds * 1000);
      }
    }

    return undefined;
  }, []);

  const sleep = useCallback((ms: number) => {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }, []);

  const startGeneration = useCallback(async () => {
    if (!generatedPrompts) return;
    const queue = postersToGenerate();
    if (queue.length === 0) {
      router.push('/prompts');
      return;
    }
    if (generationSessionLock) {
      console.info('[kv-generation] skip duplicate start while previous run is in-flight');
      return;
    }
    generationSessionLock = true;

    const { width, height } = getPosterSize(selectedStyle?.aspectRatio);
    const candidateCount = resolveCandidateCount(selectedQualityMode);
    try {
      startLoading(
        `正在生成海报（${selectedQualityMode} · ${GENERATION_MODE_LABELS[selectedGenerationMode]}）...`
      );

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
          const promptExecution = resolvePromptExecution(poster);
          console.info(
            `[kv-generation] poster=${poster.id} mode=${selectedGenerationMode} prompt=${promptExecution.promptSource} negative=${promptExecution.negativeSource}`
          );

          let bestRawUrl = '';
          let bestScore = Number.NEGATIVE_INFINITY;
          let lastCandidateErrors: string[] = [];
          let capacityRetryAttempt = 0;
          const maxCapacityRetries = 2;

          while (!bestRawUrl && capacityRetryAttempt <= maxCapacityRetries) {
            const effectiveCandidateCount =
              capacityRetryAttempt > 0 ? 1 : candidateCount;
            const candidateErrors: string[] = [];

            for (let candidateIndex = 0; candidateIndex < effectiveCandidateCount; candidateIndex++) {
              updateProgress(
                progressValue,
                `海报 ${poster.id} 候选 ${candidateIndex + 1}/${effectiveCandidateCount} 生成中...`
              );
              try {
                const request = {
                  prompt: promptExecution.prompt,
                  negative: promptExecution.negative,
                  width,
                  height,
                  referenceImage: uploadedImage?.preview,
                  enforceNoText: false,
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

            if (bestRawUrl) {
              break;
            }

            lastCandidateErrors = candidateErrors;
            const allCapacityErrors =
              candidateErrors.length > 0 &&
              candidateErrors.every((message) => isCapacityPeakError(new Error(message)));

            if (!allCapacityErrors || capacityRetryAttempt >= maxCapacityRetries) {
              break;
            }

            const retryDelayFromApi = candidateErrors
              .map((message) => parseRetryDelayMs(message))
              .find((delay): delay is number => typeof delay === 'number');
            const fallbackDelayMs = 12000 + capacityRetryAttempt * 8000;
            const waitMs = Math.max(5000, Math.min(60000, retryDelayFromApi ?? fallbackDelayMs));

            updateProgress(
              progressValue,
              `海报 ${poster.id} 服务高峰，等待 ${Math.ceil(waitMs / 1000)} 秒后重试...`
            );
            await sleep(waitMs);
            capacityRetryAttempt += 1;
          }

          if (!bestRawUrl) {
            const allCapacityErrors =
              lastCandidateErrors.length > 0 &&
              lastCandidateErrors.every((message) => isCapacityPeakError(new Error(message)));
            if (allCapacityErrors) {
              throw new Error('模型高峰拥塞，当前海报暂时生成失败。请 30-60 秒后重试。');
            }
            const firstError = lastCandidateErrors[0] || '未获取到可用候选图';
            throw new Error(firstError);
          }
          const finalUrl = bestRawUrl;
          const overlayApplied = false;

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
            rawUrl:
              selectedGenerationMode === 'legacy_ai_text' ? undefined : bestRawUrl,
            overlayApplied,
            generationMode: selectedGenerationMode,
            promptSource: promptExecution.promptSource,
            negativeSource: promptExecution.negativeSource,
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
      router.replace('/gallery');
    } finally {
      stopLoading();
      generationSessionLock = false;
    }
  }, [
    generatedPrompts,
    getPosterSize,
    postersToGenerate,
    resolveCandidateCount,
    router,
    selectedStyle?.aspectRatio,
    setGeneratedPosters,
    scoreCandidate,
    selectedGenerationMode,
    selectedQualityMode,
    startLoading,
    stopLoading,
    updateProgress,
    uploadedImage?.preview,
    useMock,
    isCapacityPeakError,
    parseRetryDelayMs,
    resolvePromptExecution,
    sleep,
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

  return null;
}
