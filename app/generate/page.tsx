'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Download,
  Eye,
  Fingerprint,
  Palette,
  Play,
  RotateCcw,
  SendHorizontal,
  Sparkles,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { generatePoster, generatePosterMock } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type {
  GeneratedPoster,
  GeneratedPosterVersion,
  GenerationPipelineMode,
  GenerationQualityMode,
  PosterAspectRatio,
  PosterPrompt,
} from '@/contexts/AppContext';

interface PosterProgress {
  id: string;
  title: string;
  titleEn: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  url?: string;
  rawUrl?: string;
  error?: string;
  overlayApplied?: boolean;
  generationMode?: GenerationPipelineMode;
  promptSource?: string;
  negativeSource?: string;
  versions?: GeneratedPosterVersion[];
  activeVersionId?: string;
}

interface PromptExecutionPayload {
  prompt: string;
  negative?: string;
  promptSource: string;
  negativeSource: string;
}

const GENERATION_MODE_LABELS: Record<GenerationPipelineMode, string> = {
  one_pass_layout_anchor: '一步成图（短提示词+锚点版式）',
};

const VISUAL_STYLE_LABELS: Record<string, string> = {
  magazine: '杂志编辑',
  watercolor: '水彩艺术',
  tech: '科技未来',
  vintage: '复古胶片',
  minimal: '极简北欧',
  cyber: '霓虹赛博',
  organic: '自然有机',
};

const TYPOGRAPHY_STYLE_LABELS: Record<string, string> = {
  glassmorphism: '玻璃拟态',
  '3d': '3D浮雕',
  handwritten: '手写体',
  serif: '粗衬线',
  'sans-serif': '无衬线粗体',
  thin: '极细线条',
};

const TEXT_LAYOUT_LABELS: Record<string, string> = {
  stacked: '中英堆叠',
  parallel: '中英并列',
  separated: '中英分离',
};

function getPosterSize(aspectRatio?: PosterAspectRatio): { width: number; height: number } {
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
}

function resolveAspectRatioStyle(aspectRatio?: PosterAspectRatio): string {
  const [width, height] = (aspectRatio || '9:16').split(':').map((value) => Number(value));
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return '9 / 16';
  }
  return `${width} / ${height}`;
}

function getPosterVersions(poster: PosterProgress): GeneratedPosterVersion[] {
  if (poster.versions && poster.versions.length > 0) {
    return poster.versions;
  }
  if (poster.url) {
    return [
      {
        id: 'v1',
        url: poster.url,
        source: 'initial',
        createdAt: 0,
      },
    ];
  }
  return [];
}

function resolveActiveVersion(
  poster: PosterProgress,
  preferredVersionId?: string | null
): GeneratedPosterVersion | null {
  const versions = getPosterVersions(poster);
  if (versions.length === 0) return null;

  if (preferredVersionId) {
    const matched = versions.find((version) => version.id === preferredVersionId);
    if (matched) return matched;
  }

  if (poster.activeVersionId) {
    const matched = versions.find((version) => version.id === poster.activeVersionId);
    if (matched) return matched;
  }

  return versions[versions.length - 1];
}

function extractSwatchColor(value?: string): string | null {
  if (!value) return null;
  const hexMatch = value.match(/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/);
  if (hexMatch) return hexMatch[0];
  const trimmed = value.trim();
  if (/^[a-zA-Z]+$/.test(trimmed)) return trimmed;
  return null;
}

function compactPromptSnippet(prompt: string | undefined): string {
  if (!prompt) return '等待生成';
  const compact = prompt.replace(/\s+/g, ' ').trim();
  if (compact.length <= 88) return compact;
  return `${compact.slice(0, 88)}...`;
}

export default function GeneratePage() {
  const router = useRouter();
  const {
    editedProductInfo,
    generatedPrompts,
    selectedStyle,
    selectedPosterIds,
    selectedQualityMode,
    selectedGenerationMode,
    uploadedImage,
    setGeneratedPosters,
  } = useAppContext();

  const useMock = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';
  const [postersProgress, setPostersProgress] = useState<PosterProgress[]>([]);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [globalMessage, setGlobalMessage] = useState('点击卡片内按钮或顶部一键按钮开始生成');
  const [cardPromptDetails, setCardPromptDetails] = useState<Record<string, boolean>>({});
  const [cardRefineInputs, setCardRefineInputs] = useState<Record<string, string>>({});
  const [cardRefining, setCardRefining] = useState<Record<string, boolean>>({});
  const [cardRefineErrors, setCardRefineErrors] = useState<Record<string, string | null>>({});
  const [cardPreviewModes, setCardPreviewModes] = useState<Record<string, 'final' | 'raw'>>({});

  const [selectedPosterId, setSelectedPosterId] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const previewViewportRef = useRef<HTMLDivElement | null>(null);
  const panStateRef = useRef<{
    startX: number;
    startY: number;
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);

  const generationLockRef = useRef(false);

  const queue = useMemo(() => {
    if (!generatedPrompts) return [];
    if (!selectedPosterIds || selectedPosterIds.length === 0) return generatedPrompts.posters;
    const selectedSet = new Set(selectedPosterIds);
    return generatedPrompts.posters.filter((poster) => selectedSet.has(poster.id));
  }, [generatedPrompts, selectedPosterIds]);

  const promptById = useMemo(
    () => new Map(queue.map((poster) => [poster.id, poster])),
    [queue]
  );

  const completedCount = useMemo(
    () => postersProgress.filter((poster) => poster.status === 'completed').length,
    [postersProgress]
  );
  const failedCount = useMemo(
    () => postersProgress.filter((poster) => poster.status === 'failed').length,
    [postersProgress]
  );
  const totalCount = postersProgress.length;
  const progressValue = totalCount === 0 ? 0 : Math.round(((completedCount + failedCount) / totalCount) * 100);
  const hasRunningSingleGeneration = useMemo(
    () => postersProgress.some((poster) => poster.status === 'generating'),
    [postersProgress]
  );

  const styleDirectionPrimary =
    editedProductInfo?.styleDirection?.primary ||
    VISUAL_STYLE_LABELS[selectedStyle?.visual || ''] ||
    selectedStyle?.visual ||
    '风格未设置';
  const styleDirectionSecondary =
    editedProductInfo?.styleDirection?.secondary ||
    TYPOGRAPHY_STYLE_LABELS[selectedStyle?.typography || ''] ||
    selectedStyle?.typography ||
    '风格未设置';
  const styleTags =
    editedProductInfo?.styleDirection?.tags && editedProductInfo.styleDirection.tags.length > 0
      ? editedProductInfo.styleDirection.tags
      : [editedProductInfo?.designStyle, selectedStyle?.textLayout ? TEXT_LAYOUT_LABELS[selectedStyle.textLayout] : undefined]
          .filter(Boolean)
          .map((value) => String(value));

  const colorCandidates = [
    ...(editedProductInfo?.colorScheme.primary || []),
    ...(editedProductInfo?.colorScheme.secondary || []),
    ...(editedProductInfo?.colorScheme.accent || []),
  ];
  const colorSwatches = colorCandidates
    .map((item) => ({
      raw: item,
      swatch: extractSwatchColor(item),
    }))
    .filter((item): item is { raw: string; swatch: string } => Boolean(item.raw && item.swatch))
    .slice(0, 3);

  useEffect(() => {
    if (!generatedPrompts || !selectedStyle || !editedProductInfo) {
      router.push('/prompts');
      return;
    }
    if (queue.length === 0) {
      router.push('/prompts');
      return;
    }

    const initial = queue.map((poster) => ({
      id: poster.id,
      title: poster.title,
      titleEn: poster.titleEn,
      status: 'pending' as const,
      generationMode: selectedGenerationMode,
    }));

    setPostersProgress(initial);
    setGeneratedPosters([]);
    setGlobalMessage('点击卡片内按钮或顶部一键按钮开始生成');
    setCardPromptDetails({});
    setCardRefineInputs({});
    setCardRefining({});
    setCardRefineErrors({});
    setCardPreviewModes({});
  }, [generatedPrompts, selectedStyle, editedProductInfo, queue, router, selectedGenerationMode, setGeneratedPosters]);

  useEffect(() => {
    const completed = postersProgress
      .filter((poster) => poster.status === 'completed' && poster.url)
      .map(
        (poster) =>
          ({
            id: poster.id,
            url: poster.url as string,
            status: 'completed',
            rawUrl: poster.rawUrl,
            overlayApplied: poster.overlayApplied,
            generationMode: poster.generationMode,
            promptSource: poster.promptSource,
            negativeSource: poster.negativeSource,
            versions: poster.versions,
            activeVersionId: poster.activeVersionId,
          }) satisfies GeneratedPoster
      );

    setGeneratedPosters(completed);
  }, [postersProgress, setGeneratedPosters]);

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
      const runtimePrompt =
        typeof poster.runtimePromptAnchorEn === 'string' &&
        poster.runtimePromptAnchorEn.trim().length > 0
          ? poster.runtimePromptAnchorEn
          : typeof poster.runtimePromptEn === 'string' && poster.runtimePromptEn.trim().length > 0
            ? poster.runtimePromptEn
          : poster.promptEn;
      const runtimeNegative =
        typeof poster.runtimeNegative === 'string' && poster.runtimeNegative.trim().length > 0
          ? poster.runtimeNegative
          : poster.negative;

      return {
        prompt: runtimePrompt,
        negative: runtimeNegative,
        promptSource:
          runtimePrompt === poster.runtimePromptAnchorEn
            ? 'runtimePromptAnchorEn'
            : runtimePrompt === poster.runtimePromptEn
              ? 'runtimePromptEn(fallback)'
              : 'promptEn(fallback)',
        negativeSource: runtimeNegative === poster.runtimeNegative ? 'runtimeNegative' : 'negative(fallback)',
      };
    },
    []
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

  const sleep = useCallback((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)), []);

  const updatePoster = useCallback(
    (posterId: string, updater: (current: PosterProgress) => PosterProgress) => {
      setPostersProgress((prev) => prev.map((poster) => (poster.id === posterId ? updater(poster) : poster)));
    },
    []
  );

  const executeSinglePoster = useCallback(
    async (poster: PosterPrompt): Promise<PromptExecutionPayload & { finalUrl: string; rawUrl?: string }> => {
      const { width, height } = getPosterSize(selectedStyle?.aspectRatio);
      const candidateCount = resolveCandidateCount(selectedQualityMode);
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
        const effectiveCandidateCount = capacityRetryAttempt > 0 ? 1 : candidateCount;
        const candidateErrors: string[] = [];

        for (let candidateIndex = 0; candidateIndex < effectiveCandidateCount; candidateIndex++) {
          try {
            const request = {
              prompt: promptExecution.prompt,
              negative: promptExecution.negative,
              width,
              height,
              referenceImage: uploadedImage?.preview,
              enforceHardConstraints: true,
            };
            const candidateUrl = useMock ? await generatePosterMock(request) : await generatePoster(request);
            const score = scoreCandidate(candidateUrl, poster.id, candidateIndex);
            if (!bestRawUrl || score > bestScore) {
              bestRawUrl = candidateUrl;
              bestScore = score;
            }
          } catch (candidateError) {
            const errorMessage = candidateError instanceof Error ? candidateError.message : '未知错误';
            candidateErrors.push(`候选 ${candidateIndex + 1}: ${errorMessage}`);
            console.warn(`海报 ${poster.id} 候选 ${candidateIndex + 1} 失败:`, candidateError);

            if (bestRawUrl && isCapacityPeakError(candidateError)) {
              break;
            }
          }
        }

        if (bestRawUrl) break;

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

        setGlobalMessage(
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

      return {
        ...promptExecution,
        finalUrl: bestRawUrl,
        rawUrl: bestRawUrl,
      };
    },
    [
      isCapacityPeakError,
      parseRetryDelayMs,
      resolveCandidateCount,
      resolvePromptExecution,
      scoreCandidate,
      selectedGenerationMode,
      selectedQualityMode,
      selectedStyle?.aspectRatio,
      sleep,
      uploadedImage?.preview,
      useMock,
    ]
  );

  const runPosterGeneration = useCallback(
    async (posterId: string, forceRegenerate: boolean) => {
      const poster = promptById.get(posterId);
      if (!poster) return false;

      const current = postersProgress.find((item) => item.id === posterId);
      if (current?.status === 'generating') {
        return false;
      }
      if (!forceRegenerate && current?.status === 'completed') {
        return true;
      }

      updatePoster(posterId, (item) => ({
        ...item,
        status: 'generating',
        error: undefined,
      }));
      setGlobalMessage(`正在生成海报 ${poster.id} - ${poster.title}...`);

      try {
        const generated = await executeSinglePoster(poster);
        updatePoster(posterId, (item) => {
          const existingVersions = getPosterVersions(item);
          const shouldAppend = forceRegenerate && existingVersions.length > 0;

          if (shouldAppend) {
            const nextVersionId = `v${existingVersions.length + 1}`;
            const nextVersion: GeneratedPosterVersion = {
              id: nextVersionId,
              url: generated.finalUrl,
              source: 'refine',
              note: '重新生成',
              createdAt: Date.now(),
            };
            return {
              ...item,
              status: 'completed',
              url: generated.finalUrl,
              rawUrl: generated.rawUrl,
              overlayApplied: false,
              generationMode: selectedGenerationMode,
              promptSource: generated.promptSource,
              negativeSource: generated.negativeSource,
              versions: [...existingVersions, nextVersion],
              activeVersionId: nextVersionId,
            };
          }

          return {
            ...item,
            status: 'completed',
            url: generated.finalUrl,
            rawUrl: generated.rawUrl,
            overlayApplied: false,
            generationMode: selectedGenerationMode,
            promptSource: generated.promptSource,
            negativeSource: generated.negativeSource,
            versions: [
              {
                id: 'v1',
                url: generated.finalUrl,
                source: 'initial',
                createdAt: Date.now(),
              },
            ],
            activeVersionId: 'v1',
          };
        });
        setCardPreviewModes((prev) => ({ ...prev, [posterId]: 'final' }));
        return true;
      } catch (error) {
        console.error(`生成海报 ${poster.id} 失败:`, error);
        updatePoster(posterId, (item) => ({
          ...item,
          status: 'failed',
          error: error instanceof Error ? error.message : '未知错误',
        }));
        return false;
      }
    },
    [executeSinglePoster, postersProgress, promptById, selectedGenerationMode, updatePoster]
  );

  const handleGenerateOne = useCallback(
    async (posterId: string, forceRegenerate = false) => {
      if (isBatchGenerating) return;
      await runPosterGeneration(posterId, forceRegenerate);
    },
    [isBatchGenerating, runPosterGeneration]
  );

  const handleGenerateAll = useCallback(async () => {
    if (generationLockRef.current || hasRunningSingleGeneration) return;

    const pendingOrFailed = postersProgress
      .filter((poster) => poster.status !== 'completed')
      .map((poster) => poster.id);

    if (pendingOrFailed.length === 0) {
      setGlobalMessage('所有海报已经生成完成，可单独点击“重新生成”继续优化');
      return;
    }

    generationLockRef.current = true;
    setIsBatchGenerating(true);

    try {
      let hadFailure = false;
      for (const posterId of pendingOrFailed) {
        const success = await runPosterGeneration(posterId, false);
        if (!success) {
          hadFailure = true;
        }
      }

      setGlobalMessage(hadFailure ? '全部任务完成（含失败项，可单独重试）' : '全部任务生成完成');
    } finally {
      setIsBatchGenerating(false);
      generationLockRef.current = false;
    }
  }, [hasRunningSingleGeneration, postersProgress, runPosterGeneration]);

  const handleDownload = useCallback((url: string, id: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    const link = document.createElement('a');
    link.href = url;
    link.download = `poster-${id}.jpg`;
    link.click();
  }, []);

  const handleSelectVersion = useCallback(
    (posterId: string, versionId: string) => {
      const targetPoster = postersProgress.find((poster) => poster.id === posterId);
      if (!targetPoster) return;

      const versions = getPosterVersions(targetPoster);
      const targetVersion = versions.find((version) => version.id === versionId);
      if (!targetVersion) return;

      setPostersProgress((prev) =>
        prev.map((poster) =>
          poster.id === posterId
            ? {
                ...poster,
                versions,
                activeVersionId: versionId,
                url: targetVersion.url,
              }
            : poster
        )
      );
      setCardPreviewModes((prev) => ({ ...prev, [posterId]: 'final' }));

      if (selectedPosterId === posterId) {
        setSelectedVersionId(versionId);
      }
    },
    [postersProgress, selectedPosterId]
  );

  const applyRefineToPoster = useCallback(
    async (posterId: string, instruction: string) => {
      const selected = postersProgress.find((poster) => poster.id === posterId);
      if (!selected || selected.status !== 'completed') {
        throw new Error('请先生成该海报后再优化');
      }

      const prompt = promptById.get(selected.id);
      if (!prompt) {
        throw new Error('未找到该海报提示词');
      }

      const promptExecution = resolvePromptExecution(prompt);
      const referenceImage = resolveActiveVersion(selected)?.url || selected.url;
      if (!referenceImage) {
        throw new Error('当前海报图片不可用，暂时无法优化');
      }

      const { width, height } = getPosterSize(selectedStyle?.aspectRatio);
      const refinedPrompt = [
        promptExecution.prompt,
        'Refinement instruction:',
        instruction,
        'Keep product identity and composition continuity with the reference image. Apply only the requested visual changes.',
      ].join('\n\n');

      const refinedUrl = useMock
        ? await generatePosterMock({
            prompt: refinedPrompt,
            negative: promptExecution.negative,
            width,
            height,
            referenceImage,
            enforceHardConstraints: true,
          })
        : await generatePoster({
            prompt: refinedPrompt,
            negative: promptExecution.negative,
            width,
            height,
            referenceImage,
            enforceHardConstraints: true,
          });

      setPostersProgress((prev) =>
        prev.map((poster) => {
          if (poster.id !== selected.id) return poster;
          const baseVersions = getPosterVersions(poster);
          const nextVersionId = `v${baseVersions.length + 1}`;
          const nextVersion: GeneratedPosterVersion = {
            id: nextVersionId,
            url: refinedUrl,
            source: 'refine',
            note: instruction,
            createdAt: Date.now(),
          };
          return {
            ...poster,
            status: 'completed',
            url: refinedUrl,
            versions: [...baseVersions, nextVersion],
            activeVersionId: nextVersionId,
          };
        })
      );
      setCardPreviewModes((prev) => ({ ...prev, [posterId]: 'final' }));

      if (selectedPosterId === posterId) {
        const updated = postersProgress.find((poster) => poster.id === posterId);
        const versionCount = updated ? getPosterVersions(updated).length + 1 : 1;
        setSelectedVersionId(`v${versionCount}`);
      }
    },
    [
      postersProgress,
      promptById,
      resolvePromptExecution,
      selectedPosterId,
      selectedStyle?.aspectRatio,
      useMock,
    ]
  );

  const handleCardRefine = useCallback(
    async (posterId: string) => {
      if (generationLockRef.current) return;
      const instruction = (cardRefineInputs[posterId] || '').trim();
      if (!instruction) {
        setCardRefineErrors((prev) => ({ ...prev, [posterId]: '请输入修改意见' }));
        return;
      }

      generationLockRef.current = true;
      setCardRefining((prev) => ({ ...prev, [posterId]: true }));
      setCardRefineErrors((prev) => ({ ...prev, [posterId]: null }));
      setGlobalMessage(`正在优化海报 ${posterId}...`);

      try {
        await applyRefineToPoster(posterId, instruction);
        setCardRefineInputs((prev) => ({ ...prev, [posterId]: '' }));
        setGlobalMessage(`海报 ${posterId} 优化完成`);
      } catch (error) {
        setCardRefineErrors((prev) => ({
          ...prev,
          [posterId]: error instanceof Error ? error.message : '优化失败，请稍后重试',
        }));
      } finally {
        setCardRefining((prev) => ({ ...prev, [posterId]: false }));
        generationLockRef.current = false;
      }
    },
    [applyRefineToPoster, cardRefineInputs]
  );

  const selectedPoster = selectedPosterId
    ? postersProgress.find((poster) => poster.id === selectedPosterId)
    : null;
  const selectedPrompt = selectedPosterId ? promptById.get(selectedPosterId) : undefined;
  const selectedVersion = selectedPoster
    ? resolveActiveVersion(selectedPoster, selectedVersionId)
    : null;
  const selectedPreviewUrl = selectedVersion?.url || selectedPoster?.url;

  const clampZoom = (value: number) => Math.min(4, Math.max(1, Number(value.toFixed(2))));

  const centerPreviewScroll = useCallback(() => {
    const viewport = previewViewportRef.current;
    if (!viewport) return;

    viewport.scrollLeft = Math.max(0, (viewport.scrollWidth - viewport.clientWidth) / 2);
    viewport.scrollTop = Math.max(0, (viewport.scrollHeight - viewport.clientHeight) / 2);
  }, []);

  const openPreview = useCallback(
    (posterId: string) => {
      const poster = postersProgress.find((item) => item.id === posterId);
      const initialVersion = poster ? resolveActiveVersion(poster) : null;

      setSelectedPosterId(posterId);
      setSelectedVersionId(initialVersion?.id || null);
      setPreviewZoom(1);
      setIsPanning(false);
      panStateRef.current = null;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => centerPreviewScroll());
      });
    },
    [centerPreviewScroll, postersProgress]
  );

  const closePreview = () => {
    setSelectedPosterId(null);
    setSelectedVersionId(null);
    setIsPanning(false);
    panStateRef.current = null;
  };

  const resetPreviewView = () => {
    setPreviewZoom(1);
    requestAnimationFrame(() => centerPreviewScroll());
  };

  const zoomTo = (targetZoom: number) => {
    const nextZoom = clampZoom(targetZoom);
    if (nextZoom === previewZoom) return;

    const viewport = previewViewportRef.current;
    if (!viewport) {
      setPreviewZoom(nextZoom);
      return;
    }

    const centerRatioX =
      (viewport.scrollLeft + viewport.clientWidth / 2) / Math.max(viewport.scrollWidth, 1);
    const centerRatioY =
      (viewport.scrollTop + viewport.clientHeight / 2) / Math.max(viewport.scrollHeight, 1);

    setPreviewZoom(nextZoom);
    requestAnimationFrame(() => {
      const nextViewport = previewViewportRef.current;
      if (!nextViewport) return;
      nextViewport.scrollLeft = Math.max(
        0,
        centerRatioX * nextViewport.scrollWidth - nextViewport.clientWidth / 2
      );
      nextViewport.scrollTop = Math.max(
        0,
        centerRatioY * nextViewport.scrollHeight - nextViewport.clientHeight / 2
      );
    });
  };

  const handlePreviewMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (previewZoom <= 1) return;
    const viewport = previewViewportRef.current;
    if (!viewport) return;

    setIsPanning(true);
    panStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
    };
  };

  const handlePreviewMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning || !panStateRef.current) return;
    const viewport = previewViewportRef.current;
    if (!viewport) return;

    const deltaX = event.clientX - panStateRef.current.startX;
    const deltaY = event.clientY - panStateRef.current.startY;
    viewport.scrollLeft = panStateRef.current.scrollLeft - deltaX;
    viewport.scrollTop = panStateRef.current.scrollTop - deltaY;
  };

  const stopPanning = () => {
    setIsPanning(false);
    panStateRef.current = null;
  };

  if (!generatedPrompts || !selectedStyle || !editedProductInfo) {
    return null;
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={() => router.push('/prompts')}>
          ← 返回提示词
        </Button>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Generation Workspace</p>
          <h2 className="text-xl font-semibold">海报生成工作台</h2>
        </div>
      </div>

      <Card className="studio-panel p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5 text-primary" />
            <h3 className="text-2xl font-semibold">产品 DNA 分析</h3>
          </div>
          <span className="text-xs text-muted-foreground">先确认调性，再逐张生成</span>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr_0.9fr]">
          <Card className="rounded-2xl border border-border/70 bg-secondary/35 p-4">
            <div className="mb-3 flex items-center gap-2 text-muted-foreground">
              <Fingerprint className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">品牌核心</span>
            </div>
            <p className="text-4xl font-semibold leading-tight">
              {editedProductInfo.brandName.zh || editedProductInfo.brandName.en || '未命名品牌'}
            </p>
            <p className="mt-2 text-2xl font-medium uppercase tracking-wide text-muted-foreground/90">
              {editedProductInfo.brandName.en || editedProductInfo.brandName.zh || 'Brand Core'}
            </p>
            <div className="mt-4 grid gap-3 border-t border-border/60 pt-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground">品类定位</p>
                  <p className="font-semibold">
                    {editedProductInfo.productType.category || '-'}
                    {editedProductInfo.productType.specific ? ` / ${editedProductInfo.productType.specific}` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">驱动人群</p>
                  <p className="font-semibold line-clamp-3">{editedProductInfo.targetAudience || '-'}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border border-border/70 bg-secondary/35 p-4">
            <div className="mb-3 flex items-center gap-2 text-muted-foreground">
              <Palette className="h-4 w-4 text-accent" />
              <span className="text-sm font-semibold">色彩基因</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {(colorSwatches.length > 0
                ? colorSwatches
                : [
                    { raw: '#5F77FF', swatch: '#5F77FF' },
                    { raw: '#8CA2FF', swatch: '#8CA2FF' },
                    { raw: '#C248FF', swatch: '#C248FF' },
                  ]
              ).map((item, index) => (
                <div key={`${item.raw}-${index}`} className="text-center">
                  <div
                    className="mx-auto h-14 w-14 rounded-full border border-white/20"
                    style={{ backgroundColor: item.swatch }}
                  />
                  <p className="mt-2 truncate text-xs font-semibold">{item.raw}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {index === 0 ? '主色' : index === 1 ? '辅助色' : '点缀色'}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground line-clamp-2">
              {editedProductInfo.brandTone || '用于统一全套海报的颜色与氛围表达'}
            </p>
          </Card>

          <Card className="rounded-2xl border border-border/70 bg-secondary/35 p-4">
            <div className="mb-3 flex items-center gap-2 text-muted-foreground">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span className="text-sm font-semibold">风格导向</span>
            </div>
            <p className="text-3xl font-semibold leading-tight">{styleDirectionPrimary}</p>
            <p className="mt-1 text-2xl font-semibold text-muted-foreground/90">{styleDirectionSecondary}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              排版: {TEXT_LAYOUT_LABELS[selectedStyle.textLayout] || selectedStyle.textLayout} · 比例:{' '}
              {selectedStyle.aspectRatio}
            </p>
            <div className="mt-4 rounded-full border border-border/70 bg-background/45 px-3 py-2 text-sm font-medium">
              {(styleTags.length > 0 ? styleTags : ['风格一致', '品牌稳定', '双语可读']).join(' · ')}
            </div>
          </Card>
        </div>
      </Card>

      <Card className="studio-panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-semibold">KV 视觉体系</h3>
              <span className="rounded-full border border-border/70 px-2 py-0.5 text-xs text-muted-foreground">
                {GENERATION_MODE_LABELS[selectedGenerationMode]}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              已完成 {completedCount}/{totalCount} · 失败 {failedCount} · 质量模式 {selectedQualityMode}
            </p>
          </div>
          <Button
            size="lg"
            onClick={handleGenerateAll}
            disabled={isBatchGenerating || hasRunningSingleGeneration || totalCount === 0}
            className="h-11 rounded-full px-6"
          >
            <Play className="mr-2 h-4 w-4" />
            一键生成所有海报
          </Button>
        </div>
        <div className="mt-3 space-y-2">
          <Progress value={progressValue} className="h-2" />
          <p className="text-xs text-muted-foreground">{globalMessage}</p>
        </div>
      </Card>

      <div className="grid justify-items-center gap-4 md:grid-cols-2 xl:grid-cols-3">
        {queue.map((posterPrompt) => {
          const poster = postersProgress.find((item) => item.id === posterPrompt.id);
          if (!poster) return null;

          const versions = getPosterVersions(poster);
          const activeVersion = resolveActiveVersion(poster);
          const cardPreviewMode = cardPreviewModes[poster.id] || 'final';
          const cardImageUrl =
            cardPreviewMode === 'raw' && poster.rawUrl ? poster.rawUrl : activeVersion?.url || poster.url;
          const isPromptOpen = cardPromptDetails[poster.id] === true;
          const cardPromptValue = cardRefineInputs[poster.id] || '';
          const isCardRefining = cardRefining[poster.id] === true;
          const cardRefineError = cardRefineErrors[poster.id];
          const canGenerate = !isBatchGenerating && poster.status !== 'generating';

          return (
            <Card
              key={poster.id}
              className="relative w-[300px] max-w-[92vw] overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-md"
            >
              <div
                className="group relative bg-muted"
                style={{ aspectRatio: resolveAspectRatioStyle(selectedStyle.aspectRatio) }}
              >
                {cardImageUrl ? (
                  <Image
                    src={cardImageUrl}
                    alt={poster.title}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 92vw, 320px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center px-5 text-center">
                    <div className="mb-5 rounded-3xl border border-border/70 bg-secondary/45 p-6">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-4xl font-semibold">{poster.title}</p>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                      {compactPromptSnippet(resolvePromptExecution(posterPrompt).prompt)}
                    </p>
                    <Button
                      className="mt-5 h-12 w-44 rounded-2xl"
                      disabled={!canGenerate}
                      onClick={() => handleGenerateOne(poster.id)}
                    >
                      {poster.status === 'generating' ? '生成中...' : '生成海报'}
                    </Button>
                  </div>
                )}

                {cardImageUrl ? (
                  <>
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/15" />
                    <div className="absolute left-2 top-2 z-10 flex items-center gap-1">
                      <span className="rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white">
                        {poster.id}
                      </span>
                      {versions.length > 1 && (
                        <div className="flex items-center gap-1 rounded-md bg-black/60 p-1">
                          {versions.map((version) => (
                            <button
                              key={version.id}
                              onClick={() => handleSelectVersion(poster.id, version.id)}
                              className={cn(
                                'rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors',
                                (activeVersion?.id || 'v1') === version.id
                                  ? 'bg-white text-black'
                                  : 'text-white/80 hover:bg-white/20 hover:text-white'
                              )}
                              title={
                                version.note
                                  ? `优化: ${version.note}`
                                  : version.source === 'initial'
                                    ? '初始版本'
                                    : '优化版本'
                              }
                            >
                              {version.id}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {poster.rawUrl && (
                      <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md bg-black/60 p-1">
                        <button
                          onClick={() =>
                            setCardPreviewModes((prev) => ({ ...prev, [poster.id]: 'final' }))
                          }
                          className={cn(
                            'rounded px-2 py-0.5 text-[10px] font-medium transition-colors',
                            cardPreviewMode === 'final'
                              ? 'bg-white text-black'
                              : 'text-white/80 hover:bg-white/20 hover:text-white'
                          )}
                        >
                          成品
                        </button>
                        <button
                          onClick={() =>
                            setCardPreviewModes((prev) => ({ ...prev, [poster.id]: 'raw' }))
                          }
                          className={cn(
                            'rounded px-2 py-0.5 text-[10px] font-medium transition-colors',
                            cardPreviewMode === 'raw'
                              ? 'bg-white text-black'
                              : 'text-white/80 hover:bg-white/20 hover:text-white'
                          )}
                        >
                          原图
                        </button>
                      </div>
                    )}

                    <div className="pointer-events-none invisible absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 opacity-0 transition-opacity duration-200 group-hover:visible group-hover:opacity-100">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          openPreview(poster.id);
                        }}
                        className="pointer-events-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-gray-900 shadow-lg transition-colors hover:bg-white"
                        title="查看"
                      >
                        <Eye className="h-6 w-6" />
                      </button>
                      <button
                        onClick={(event) => cardImageUrl && handleDownload(cardImageUrl, poster.id, event)}
                        className="pointer-events-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-gray-900 shadow-lg transition-colors hover:bg-white"
                        title="下载"
                      >
                        <Download className="h-6 w-6" />
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          handleGenerateOne(poster.id, true);
                        }}
                        className="pointer-events-auto inline-flex h-10 items-center justify-center rounded-full border border-white/35 bg-[#8A4F33]/85 px-5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-[#8A4F33]"
                        title="重新生成"
                        disabled={!canGenerate}
                      >
                        重新生成
                      </button>
                    </div>
                  </>
                ) : null}
              </div>

              <div className="space-y-2 border-t border-border/70 bg-card/95 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-[13px] font-semibold text-muted-foreground">
                    #{poster.id}:{poster.title}
                  </h3>
                  <button
                    onClick={() =>
                      setCardPromptDetails((prev) => ({ ...prev, [poster.id]: !prev[poster.id] }))
                    }
                    className="shrink-0 text-[13px] font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    提示词详情 {isPromptOpen ? '▴' : '▾'}
                  </button>
                </div>

                {isPromptOpen && (
                  <div className="glass-scrollbar max-h-24 overflow-y-auto rounded-xl border border-border/70 bg-secondary/40 p-2 text-[11px] leading-5 text-muted-foreground whitespace-pre-wrap">
                    {resolvePromptExecution(posterPrompt).prompt}
                  </div>
                )}

                <div className="rounded-2xl border border-border/70 bg-secondary/20 p-2">
                  <div className="flex items-center gap-2">
                    <input
                      value={cardPromptValue}
                      onChange={(event) =>
                        setCardRefineInputs((prev) => ({
                          ...prev,
                          [poster.id]: event.target.value,
                        }))
                      }
                      placeholder="输入修改意见..."
                      className="h-10 flex-1 rounded-xl border border-border/70 bg-white/65 px-3 text-sm text-black outline-none transition-colors focus:border-primary/60 focus:ring-1 focus:ring-primary/40"
                    />
                    <Button
                      onClick={() => handleCardRefine(poster.id)}
                      disabled={
                        isCardRefining ||
                        cardPromptValue.trim().length === 0 ||
                        poster.status !== 'completed' ||
                        isBatchGenerating
                      }
                      size="icon"
                      className="h-10 w-10 shrink-0 rounded-xl"
                      title="提交优化"
                    >
                      {isCardRefining ? <span className="text-[11px]">...</span> : <SendHorizontal className="h-4 w-4" />}
                    </Button>
                  </div>
                  {poster.status !== 'completed' && (
                    <p className="mt-2 text-[11px] text-muted-foreground">请先生成该卡片后再做二次优化</p>
                  )}
                </div>
                {poster.error && <p className="text-xs text-red-400">{poster.error}</p>}
                {cardRefineError && <p className="text-xs text-red-400">{cardRefineError}</p>}
              </div>
            </Card>
          );
        })}
      </div>

      {selectedPosterId !== null && selectedPoster && selectedPreviewUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 p-2 backdrop-blur-sm animate-fade-in sm:p-4" onClick={closePreview}>
          <div className="mx-auto h-full w-full max-w-[1440px]">
            <div className="flex h-full flex-col gap-3">
              <Card
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-surface/95 px-3 py-2 sm:px-4"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    海报 {selectedPrompt?.id} - {selectedPrompt?.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{selectedPrompt?.titleEn}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => zoomTo(previewZoom - 0.25)}
                    disabled={previewZoom <= 1}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-secondary/55 text-foreground transition-colors hover:bg-secondary/70 disabled:cursor-not-allowed disabled:opacity-50"
                    title="缩小"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <div className="w-14 text-center text-xs tabular-nums text-muted-foreground">
                    {Math.round(previewZoom * 100)}%
                  </div>
                  <button
                    onClick={() => zoomTo(previewZoom + 0.25)}
                    disabled={previewZoom >= 4}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-secondary/55 text-foreground transition-colors hover:bg-secondary/70 disabled:cursor-not-allowed disabled:opacity-50"
                    title="放大"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <button
                    onClick={resetPreviewView}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-secondary/55 text-foreground transition-colors hover:bg-secondary/70"
                    title="重置"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      const versionTag = selectedVersion?.id || selectedPoster.activeVersionId || 'v1';
                      handleDownload(selectedPreviewUrl, `${selectedPoster.id}-${versionTag}`);
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-secondary/55 text-foreground transition-colors hover:bg-secondary/70"
                    title="下载"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={closePreview}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-secondary/55 text-foreground transition-colors hover:bg-secondary/70"
                    title="关闭"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </Card>

              <Card
                className="flex-1 overflow-hidden rounded-2xl border border-border/70 bg-black/45"
                onClick={(event) => event.stopPropagation()}
              >
                <div
                  ref={previewViewportRef}
                  className={cn(
                    'glass-scrollbar h-full w-full overflow-auto',
                    previewZoom > 1 ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
                  )}
                  onMouseDown={handlePreviewMouseDown}
                  onMouseMove={handlePreviewMouseMove}
                  onMouseUp={stopPanning}
                  onMouseLeave={stopPanning}
                >
                  <div className="flex h-full min-w-full items-center justify-center p-3 sm:p-6">
                    <div
                      className="shrink-0"
                      style={{
                        height: `${previewZoom * 100}%`,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedPreviewUrl}
                        alt={selectedPrompt?.title || `Poster ${selectedPoster.id}`}
                        draggable={false}
                        className="block h-full w-auto max-w-none select-none shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
