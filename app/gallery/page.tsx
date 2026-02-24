'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Eye, RotateCcw, SendHorizontal, X, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generatePoster } from '@/lib/api/client';
import type {
  GeneratedPoster,
  GeneratedPosterVersion,
  PosterAspectRatio,
} from '@/contexts/AppContext';

const GENERATION_MODE_LABELS: Record<string, string> = {
  legacy_ai_text: 'AI原生出字',
  one_pass_layout: '一步成图（文案+布局）',
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

function getPosterVersions(poster: GeneratedPoster): GeneratedPosterVersion[] {
  if (poster.versions && poster.versions.length > 0) {
    return poster.versions;
  }
  return [
    {
      id: 'v1',
      url: poster.url,
      source: 'initial',
      createdAt: 0,
    },
  ];
}

type PreviewMode = 'final' | 'raw';

function resolveActiveVersion(
  poster: GeneratedPoster,
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

function getPosterPreviewUrl(
  poster: GeneratedPoster,
  previewMode: PreviewMode,
  preferredVersionId?: string | null
): string | undefined {
  const activeVersion = resolveActiveVersion(poster, preferredVersionId);
  const finalUrl = activeVersion?.url || poster.url;
  if (previewMode === 'raw' && poster.rawUrl) return poster.rawUrl;
  return finalUrl;
}

export default function GalleryPage() {
  const router = useRouter();
  const {
    generatedPosters,
    generatedPrompts,
    selectedStyle,
    setGeneratedPosters,
  } = useAppContext();
  const [selectedPosterId, setSelectedPosterId] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [cardPreviewModes, setCardPreviewModes] = useState<Record<string, PreviewMode>>({});
  const [cardRefineInputs, setCardRefineInputs] = useState<Record<string, string>>({});
  const [cardRefining, setCardRefining] = useState<Record<string, boolean>>({});
  const [cardRefineErrors, setCardRefineErrors] = useState<Record<string, string | null>>({});
  const [cardPromptDetails, setCardPromptDetails] = useState<Record<string, boolean>>({});
  const previewViewportRef = useRef<HTMLDivElement | null>(null);
  const cardInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const panStateRef = useRef<{
    startX: number;
    startY: number;
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);
  const promptById = new Map(generatedPrompts?.posters.map((poster) => [poster.id, poster]));
  const selectedPoster = selectedPosterId
    ? generatedPosters?.find((poster) => poster.id === selectedPosterId)
    : null;
  const selectedPrompt = selectedPosterId ? promptById.get(selectedPosterId) : undefined;
  const selectedVersion = selectedPoster
    ? resolveActiveVersion(selectedPoster, selectedVersionId)
    : null;
  const selectedPreviewUrl = selectedVersion?.url || selectedPoster?.url;

  useEffect(() => {
    if (!generatedPosters || generatedPosters.length === 0) {
      router.push('/');
    }
  }, [generatedPosters, router]);

  useEffect(() => {
    if (!generatedPosters || generatedPosters.length === 0) return;

    let hasChange = false;
    const normalized = generatedPosters.map((poster) => {
      const activeVersion = resolveActiveVersion(poster);
      if (!activeVersion) return poster;
      if (poster.activeVersionId === activeVersion.id && poster.url === activeVersion.url) {
        return poster;
      }
      hasChange = true;
      return {
        ...poster,
        activeVersionId: activeVersion.id,
        url: activeVersion.url,
      };
    });

    if (hasChange) {
      setGeneratedPosters(normalized);
    }
  }, [generatedPosters, setGeneratedPosters]);

  const clampZoom = (value: number) => Math.min(4, Math.max(1, Number(value.toFixed(2))));

  const centerPreviewScroll = () => {
    const viewport = previewViewportRef.current;
    if (!viewport) return;

    viewport.scrollLeft = Math.max(0, (viewport.scrollWidth - viewport.clientWidth) / 2);
    viewport.scrollTop = Math.max(0, (viewport.scrollHeight - viewport.clientHeight) / 2);
  };

  const openPreview = (posterId: string) => {
    const poster = generatedPosters?.find((item) => item.id === posterId);
    const initialVersion = poster ? resolveActiveVersion(poster) : null;

    setSelectedPosterId(posterId);
    setSelectedVersionId(initialVersion?.id || null);
    setPreviewZoom(1);
    stopPanning();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => centerPreviewScroll());
    });
  };

  const closePreview = () => {
    setSelectedPosterId(null);
    setSelectedVersionId(null);
    stopPanning();
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

  const handleZoomIn = () => {
    zoomTo(previewZoom + 0.25);
  };

  const handleZoomOut = () => {
    zoomTo(previewZoom - 0.25);
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

  const handleSelectVersion = (posterId: string, versionId: string) => {
    if (!generatedPosters) return;
    const targetPoster = generatedPosters.find((poster) => poster.id === posterId);
    if (!targetPoster) return;

    const versions = getPosterVersions(targetPoster);
    const targetVersion = versions.find((version) => version.id === versionId);
    if (!targetVersion) return;

    const nextPosters = generatedPosters.map((poster) =>
      poster.id === posterId
        ? {
            ...poster,
            versions,
            activeVersionId: versionId,
            url: targetVersion.url,
          }
        : poster
    );
    setGeneratedPosters(nextPosters);
    setCardPreviewModes((prev) => ({ ...prev, [posterId]: 'final' }));

    if (selectedPosterId === posterId) {
      setSelectedVersionId(versionId);
    }
  };

  const applyRefineToPoster = async (posterId: string, instruction: string) => {
    if (!generatedPosters) {
      throw new Error('当前没有可优化的海报');
    }
    const selected = generatedPosters.find((poster) => poster.id === posterId);
    if (!selected) {
      throw new Error('未找到目标海报');
    }

    const prompt = promptById.get(selected.id);
    if (!prompt?.promptEn) {
      throw new Error('未找到该海报的英文提示词');
    }

    const referenceImage = getPosterPreviewUrl(selected, 'final');
    if (!referenceImage) {
      throw new Error('当前海报图片不可用，暂时无法优化');
    }

    const { width, height } = getPosterSize(selectedStyle?.aspectRatio);
    const refinedPrompt = [
      prompt.promptEn,
      'Refinement instruction:',
      instruction,
      'Keep product identity and composition continuity with the reference image. Apply only the requested visual changes.',
    ].join('\n\n');

    const refinedUrl = await generatePoster({
      prompt: refinedPrompt,
      negative: prompt.negative,
      width,
      height,
      referenceImage,
    });

    const baseVersions = getPosterVersions(selected);
    const nextVersionId = `v${baseVersions.length + 1}`;
    const nextVersion: GeneratedPosterVersion = {
      id: nextVersionId,
      url: refinedUrl,
      source: 'refine',
      note: instruction,
      createdAt: Date.now(),
    };
    const nextVersions = [...baseVersions, nextVersion];

    const nextPosters = generatedPosters.map((poster) =>
      poster.id === selected.id
        ? {
            ...poster,
            url: refinedUrl,
            versions: nextVersions,
            activeVersionId: nextVersionId,
          }
        : poster
    );
    setGeneratedPosters(nextPosters);
    setCardPreviewModes((prev) => ({ ...prev, [posterId]: 'final' }));

    if (selectedPosterId === posterId) {
      setSelectedVersionId(nextVersionId);
    }

    return nextVersionId;
  };

  const handleCardRefine = async (posterId: string) => {
    const instruction = (cardRefineInputs[posterId] || '').trim();
    if (!instruction) {
      setCardRefineErrors((prev) => ({ ...prev, [posterId]: '请输入修改意见' }));
      return;
    }

    setCardRefining((prev) => ({ ...prev, [posterId]: true }));
    setCardRefineErrors((prev) => ({ ...prev, [posterId]: null }));
    try {
      await applyRefineToPoster(posterId, instruction);
      setCardRefineInputs((prev) => ({ ...prev, [posterId]: '' }));
    } catch (error) {
      setCardRefineErrors((prev) => ({
        ...prev,
        [posterId]: error instanceof Error ? error.message : '优化失败，请稍后重试',
      }));
    } finally {
      setCardRefining((prev) => ({ ...prev, [posterId]: false }));
    }
  };

  if (!generatedPosters || generatedPosters.length === 0) {
    return null;
  }

  const handleDownload = (url: string, id: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    const link = document.createElement('a');
    link.href = url;
    link.download = `poster-${id}.jpg`;
    link.click();
  };

  const handleDownloadAll = async () => {
    // 简单实现: 逐个下载
    // 实际项目中应该使用 JSZip 打包下载
    for (const poster of generatedPosters) {
      if (poster.status === 'completed' && poster.url) {
        const versions = getPosterVersions(poster);
        const activeVersion =
          versions.find((version) => version.id === poster.activeVersionId) ||
          versions[versions.length - 1];
        const targetUrl = activeVersion?.url || poster.url;
        if (!targetUrl) continue;
        await new Promise(resolve => setTimeout(resolve, 500));
        handleDownload(targetUrl, poster.id);
      }
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 animate-fade-in">
      {/* 操作按钮 */}
      <div className="flex justify-end gap-3">
        <Button size="lg" onClick={handleDownloadAll}>
          下载全部
        </Button>
        <Button size="lg" variant="outline" onClick={() => router.push('/')}>
          重新开始
        </Button>
      </div>

      {/* 海报网格 */}
      <div className="grid justify-items-center gap-4 md:grid-cols-2 xl:grid-cols-3">
        {generatedPosters.map((poster) => {
          if (poster.status !== 'completed') return null;

          const prompt = promptById.get(poster.id);
          const versions = getPosterVersions(poster);
          const activeVersion = resolveActiveVersion(poster);
          const cardPreviewMode = cardPreviewModes[poster.id] || 'final';
          const cardImageUrl = getPosterPreviewUrl(poster, cardPreviewMode, activeVersion?.id);
          const isCardRefining = cardRefining[poster.id] === true;
          const cardPromptValue = cardRefineInputs[poster.id] || '';
          const cardRefineError = cardRefineErrors[poster.id];
          const isCardPromptOpen = cardPromptDetails[poster.id] === true;

          return (
            <Card
              key={poster.id}
              className="relative w-[300px] max-w-[92vw] overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-md transition-all duration-300 hover:shadow-float hover:-translate-y-1"
            >
              <div className="group aspect-[9/16] relative bg-muted">
                {cardImageUrl ? (
                  <Image
                    src={cardImageUrl}
                    alt={prompt?.title || `Poster ${poster.id}`}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 92vw, 320px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    暂无图片
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20" />

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

                {poster.generationMode && (
                  <div className="absolute bottom-2 right-2 z-10 bg-black/65 text-white text-[10px] px-2 py-1 rounded-lg">
                    {GENERATION_MODE_LABELS[poster.generationMode] || poster.generationMode}
                  </div>
                )}

                <div className="pointer-events-none invisible absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 opacity-0 transition-opacity duration-200 group-hover:visible group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openPreview(poster.id);
                    }}
                    className="pointer-events-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-gray-900 shadow-lg transition-colors hover:bg-white"
                    title="查看详情"
                  >
                    <Eye className="w-6 h-6" />
                  </button>
                  <button
                    onClick={(e) => cardImageUrl && handleDownload(cardImageUrl, poster.id, e)}
                    className="pointer-events-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-gray-900 shadow-lg transition-colors hover:bg-white"
                    title="下载当前图"
                  >
                    <Download className="w-6 h-6" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const input = cardInputRefs.current[poster.id];
                      if (!input) return;
                      input.focus();
                      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="pointer-events-auto inline-flex h-10 items-center justify-center rounded-full border border-white/35 bg-[#8A4F33]/85 px-5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-[#8A4F33]"
                  >
                    重新生成
                  </button>
                </div>
              </div>

              <div className="space-y-2 border-t border-border/70 bg-card/95 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-[13px] font-semibold text-muted-foreground">
                    #{poster.id}:{prompt?.title || `海报 ${poster.id}`}
                  </h3>
                  <button
                    onClick={() =>
                      setCardPromptDetails((prev) => ({ ...prev, [poster.id]: !prev[poster.id] }))
                    }
                    className="shrink-0 text-[13px] font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    提示词详情 {isCardPromptOpen ? '▴' : '▾'}
                  </button>
                </div>

                {isCardPromptOpen && (
                  <div className="glass-scrollbar max-h-24 overflow-y-auto rounded-xl border border-border/70 bg-secondary/40 p-2 text-[11px] leading-5 text-muted-foreground whitespace-pre-wrap">
                    {prompt?.promptEn || '暂无提示词'}
                  </div>
                )}

                <div className="rounded-2xl border border-border/70 bg-secondary/20 p-2">
                  <div className="flex items-center gap-2">
                    <input
                      ref={(element) => {
                        cardInputRefs.current[poster.id] = element;
                      }}
                      value={cardPromptValue}
                      onChange={(event) =>
                        setCardRefineInputs((prev) => ({
                          ...prev,
                          [poster.id]: event.target.value,
                        }))
                      }
                      placeholder="输入修改意见..."
                      className="h-10 flex-1 rounded-xl border border-border/70 bg-white/65 px-3 text-sm outline-none transition-colors focus:border-primary/60 focus:ring-1 focus:ring-primary/40"
                    />
                    <Button
                      onClick={() => handleCardRefine(poster.id)}
                      disabled={isCardRefining || cardPromptValue.trim().length === 0}
                      size="icon"
                      className="h-10 w-10 shrink-0 rounded-xl"
                      title="提交优化"
                    >
                      {isCardRefining ? (
                        <span className="text-[11px]">...</span>
                      ) : (
                        <SendHorizontal className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                {cardRefineError && <p className="text-xs text-red-400">{cardRefineError}</p>}
              </div>
            </Card>
          );
        })}
      </div>

      {/* 大图预览 */}
      {selectedPosterId !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 p-2 backdrop-blur-sm animate-fade-in sm:p-4"
          onClick={closePreview}
        >
          <div className="mx-auto h-full w-full max-w-[1440px]">
            <div className="flex h-full flex-col gap-3">
              <Card
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-surface/95 px-3 py-2 sm:px-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    海报 {selectedPrompt?.id} - {selectedPrompt?.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {selectedPrompt?.titleEn}
                  </p>
                  {selectedPoster?.generationMode && (
                    <p className="truncate text-[11px] text-muted-foreground/90">
                      链路: {GENERATION_MODE_LABELS[selectedPoster.generationMode] || selectedPoster.generationMode}
                      {selectedPoster.promptSource ? ` · prompt: ${selectedPoster.promptSource}` : ''}
                      {selectedPoster.negativeSource ? ` · negative: ${selectedPoster.negativeSource}` : ''}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                  <button
                    onClick={handleZoomOut}
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
                    onClick={handleZoomIn}
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
                      if (selectedPreviewUrl && selectedPoster?.id) {
                        const versionTag = selectedVersion?.id || selectedPoster.activeVersionId || 'v1';
                        handleDownload(
                          selectedPreviewUrl,
                          `${selectedPoster.id}-${versionTag}`
                        );
                      }
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
                onClick={(e) => e.stopPropagation()}
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
                    {selectedPreviewUrl && selectedPoster && (
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
                    )}
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
