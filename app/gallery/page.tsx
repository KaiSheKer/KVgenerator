'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Eye, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generatePoster } from '@/lib/api/client';
import type {
  GeneratedPoster,
  GeneratedPosterVersion,
  PosterAspectRatio,
} from '@/contexts/AppContext';

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

export default function GalleryPage() {
  const router = useRouter();
  const {
    generatedPosters,
    generatedPrompts,
    selectedStyle,
    setGeneratedPosters,
  } = useAppContext();
  const [selectedPosterId, setSelectedPosterId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'final' | 'raw'>('final');
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [refineInput, setRefineInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);
  const [showPromptDetails, setShowPromptDetails] = useState(false);
  const previewViewportRef = useRef<HTMLDivElement | null>(null);
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
  const selectedVersions = selectedPoster ? getPosterVersions(selectedPoster) : [];
  const selectedVersion =
    selectedVersions.find((version) => version.id === selectedVersionId) ||
    selectedVersions.find((version) => version.id === selectedPoster?.activeVersionId) ||
    (selectedVersions.length > 0 ? selectedVersions[selectedVersions.length - 1] : null);
  const selectedFinalUrl = selectedVersion?.url || selectedPoster?.url;
  const selectedPreviewUrl =
    previewMode === 'raw' && selectedPoster?.rawUrl
      ? selectedPoster.rawUrl
      : selectedFinalUrl;

  useEffect(() => {
    if (!generatedPosters || generatedPosters.length === 0) {
      router.push('/');
    }
  }, [generatedPosters, router]);

  const clampZoom = (value: number) => Math.min(4, Math.max(1, Number(value.toFixed(2))));

  const centerPreviewScroll = () => {
    const viewport = previewViewportRef.current;
    if (!viewport) return;

    viewport.scrollLeft = Math.max(0, (viewport.scrollWidth - viewport.clientWidth) / 2);
    viewport.scrollTop = Math.max(0, (viewport.scrollHeight - viewport.clientHeight) / 2);
  };

  const openPreview = (posterId: string) => {
    const poster = generatedPosters?.find((item) => item.id === posterId);
    const versions = poster ? getPosterVersions(poster) : [];
    const initialVersion =
      versions.find((version) => version.id === poster?.activeVersionId) ||
      (versions.length > 0 ? versions[versions.length - 1] : null);

    setSelectedPosterId(posterId);
    setSelectedVersionId(initialVersion?.id || null);
    setPreviewMode('final');
    setPreviewZoom(1);
    setRefineInput('');
    setRefineError(null);
    setShowPromptDetails(false);
    stopPanning();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => centerPreviewScroll());
    });
  };

  const closePreview = () => {
    setSelectedPosterId(null);
    setSelectedVersionId(null);
    setRefineInput('');
    setRefineError(null);
    setShowPromptDetails(false);
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

  const handleSelectVersion = (versionId: string) => {
    if (!selectedPoster || !generatedPosters) return;
    const versions = getPosterVersions(selectedPoster);
    const targetVersion = versions.find((version) => version.id === versionId);
    if (!targetVersion) return;

    setSelectedVersionId(versionId);
    const nextPosters = generatedPosters.map((poster) =>
      poster.id === selectedPoster.id
        ? {
            ...poster,
            versions,
            activeVersionId: versionId,
            url: targetVersion.url,
          }
        : poster
    );
    setGeneratedPosters(nextPosters);
    setPreviewMode('final');
  };

  const handleRefine = async () => {
    if (!selectedPoster || !generatedPosters) return;
    const instruction = refineInput.trim();
    if (!instruction) {
      setRefineError('请输入修改意见');
      return;
    }
    if (!selectedFinalUrl) {
      setRefineError('当前海报图片不可用，暂时无法优化');
      return;
    }

    const prompt = promptById.get(selectedPoster.id);
    if (!prompt?.promptEn) {
      setRefineError('未找到该海报的英文提示词');
      return;
    }

    setIsRefining(true);
    setRefineError(null);
    try {
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
        referenceImage: selectedFinalUrl,
      });

      const baseVersions = getPosterVersions(selectedPoster);
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
        poster.id === selectedPoster.id
          ? {
              ...poster,
              url: refinedUrl,
              versions: nextVersions,
              activeVersionId: nextVersionId,
            }
          : poster
      );
      setGeneratedPosters(nextPosters);
      setSelectedVersionId(nextVersionId);
      setPreviewMode('final');
      setRefineInput('');
    } catch (error) {
      setRefineError(error instanceof Error ? error.message : '优化失败，请稍后重试');
    } finally {
      setIsRefining(false);
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
    <div className="mx-auto max-w-7xl space-y-6 animate-fade-in">
      {/* 成功提示 */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full">
          <span className="text-3xl text-white">✓</span>
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          海报生成完成!
        </h2>
        <p className="text-muted-foreground">
          成功生成 {generatedPosters.filter(p => p.status === 'completed').length} 张海报
        </p>
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-center gap-4">
        <Button size="lg" onClick={handleDownloadAll}>
          下载全部
        </Button>
        <Button size="lg" variant="outline" onClick={() => router.push('/')}>
          重新开始
        </Button>
      </div>

      {/* 海报网格 */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {generatedPosters.map((poster) => {
          if (poster.status !== 'completed') return null;

          const prompt = promptById.get(poster.id);
          const versions = getPosterVersions(poster);
          const activeVersion =
            versions.find((version) => version.id === poster.activeVersionId) ||
            versions[versions.length - 1];
          const cardImageUrl = activeVersion?.url || poster.url;

          return (
            <Card
              key={poster.id}
              className="relative group cursor-pointer overflow-hidden rounded-3xl shadow-md transition-all duration-300 hover:shadow-float hover:-translate-y-1"
              onClick={() => openPreview(poster.id)}
            >
              <div className="aspect-[9/16] relative bg-muted">
                {cardImageUrl ? (
                  <Image
                    src={cardImageUrl}
                    alt={prompt?.title || `Poster ${poster.id}`}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    暂无图片
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-lg">
                  {poster.id}
                </div>
                {versions.length > 1 && (
                  <div className="absolute top-2 left-12 bg-primary/80 text-white text-[10px] px-2 py-1 rounded-lg">
                    {activeVersion?.id || 'v1'}
                  </div>
                )}
                {poster.overlayApplied === false && (
                  <div className="absolute top-2 right-2 bg-amber-500/80 text-white text-[10px] px-2 py-1 rounded-lg">
                    原图
                  </div>
                )}

                {/* 悬浮下载按钮 */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={(e) => cardImageUrl && handleDownload(cardImageUrl, poster.id, e)}
                    className="bg-white/90 text-gray-900 px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-white transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    下载
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openPreview(poster.id);
                    }}
                    className="bg-white/90 text-gray-900 px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-white transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    查看详情
                  </button>
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm truncate">
                  {prompt?.title || `海报 ${poster.id}`}
                </h3>
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
                </div>
                <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                  {selectedVersions.length > 1 && (
                    <div className="mr-1 flex items-center gap-1 rounded-lg border border-border/70 bg-secondary/45 p-1">
                      {selectedVersions.map((version) => (
                        <button
                          key={version.id}
                          onClick={() => handleSelectVersion(version.id)}
                          className={cn(
                            'inline-flex h-7 items-center justify-center rounded px-2 text-[11px] transition-colors',
                            (selectedVersion?.id || selectedPoster?.activeVersionId || 'v1') === version.id
                              ? 'bg-primary/25 text-primary'
                              : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
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
                  {selectedPoster?.rawUrl && (
                    <>
                      <button
                        onClick={() => setPreviewMode('final')}
                        className={cn(
                          'inline-flex h-9 items-center justify-center rounded-lg border px-3 text-xs transition-colors',
                          previewMode === 'final'
                            ? 'border-primary/80 bg-primary/20 text-primary'
                            : 'border-border/70 bg-secondary/55 text-foreground hover:bg-secondary/70'
                        )}
                        title="查看成品图"
                      >
                        成品图
                      </button>
                      <button
                        onClick={() => setPreviewMode('raw')}
                        className={cn(
                          'inline-flex h-9 items-center justify-center rounded-lg border px-3 text-xs transition-colors',
                          previewMode === 'raw'
                            ? 'border-primary/80 bg-primary/20 text-primary'
                            : 'border-border/70 bg-secondary/55 text-foreground hover:bg-secondary/70'
                        )}
                        title="查看 AI 原图"
                      >
                        AI原图
                      </button>
                    </>
                  )}
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
                          `${selectedPoster.id}-${versionTag}-${previewMode === 'raw' ? 'raw' : 'final'}`
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
                  <div
                    className={cn(
                      'flex h-full min-w-full p-3 sm:p-6',
                      previewZoom > 1 ? 'items-start justify-start' : 'items-center justify-center'
                    )}
                  >
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

              <Card
                className="rounded-2xl border border-border/70 bg-surface/95 p-3 sm:p-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-muted-foreground">
                    #{selectedPrompt?.id}:{selectedPrompt?.title}
                  </p>
                  <button
                    onClick={() => setShowPromptDetails((prev) => !prev)}
                    className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    提示词详情 {showPromptDetails ? '▴' : '▾'}
                  </button>
                </div>

                {showPromptDetails && (
                  <div className="mb-3 max-h-40 overflow-y-auto rounded-xl border border-border/70 bg-secondary/45 p-3 text-xs leading-6 text-muted-foreground whitespace-pre-wrap">
                    {selectedPrompt?.promptEn || '暂无提示词'}
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <textarea
                    value={refineInput}
                    onChange={(event) => setRefineInput(event.target.value)}
                    placeholder="输入修改意见，例如：背景更干净，橙子高光更柔和，标题留白更大..."
                    rows={3}
                    className="glass-scrollbar min-h-[92px] flex-1 resize-y rounded-xl border border-border/70 bg-secondary/40 p-3 text-sm outline-none transition-colors focus:border-primary/60 focus:ring-1 focus:ring-primary/40"
                  />
                  <Button
                    onClick={handleRefine}
                    disabled={isRefining || refineInput.trim().length === 0}
                    className="h-auto min-h-[92px] min-w-[140px] rounded-xl"
                  >
                    {isRefining ? '优化中...' : '提交优化'}
                  </Button>
                </div>
                {refineError && (
                  <p className="mt-2 text-xs text-red-400">{refineError}</p>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
