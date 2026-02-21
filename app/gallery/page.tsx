'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Eye, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function GalleryPage() {
  const router = useRouter();
  const { generatedPosters, generatedPrompts } = useAppContext();
  const [selectedPosterId, setSelectedPosterId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'final' | 'raw'>('final');
  const [previewZoom, setPreviewZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
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
  const selectedPreviewUrl =
    previewMode === 'raw' && selectedPoster?.rawUrl
      ? selectedPoster.rawUrl
      : selectedPoster?.url;

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
    setSelectedPosterId(posterId);
    setPreviewMode('final');
    setPreviewZoom(1);
    stopPanning();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => centerPreviewScroll());
    });
  };

  const closePreview = () => {
    setSelectedPosterId(null);
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
        await new Promise(resolve => setTimeout(resolve, 500));
        handleDownload(poster.url, poster.id);
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

          return (
            <Card
              key={poster.id}
              className="relative group cursor-pointer overflow-hidden rounded-3xl shadow-md transition-all duration-300 hover:shadow-float hover:-translate-y-1"
              onClick={() => openPreview(poster.id)}
            >
              <div className="aspect-[9/16] relative bg-muted">
                {poster.url ? (
                  <Image
                    src={poster.url}
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
                {poster.overlayApplied === false && (
                  <div className="absolute top-2 right-2 bg-amber-500/80 text-white text-[10px] px-2 py-1 rounded-lg">
                    原图
                  </div>
                )}

                {/* 悬浮下载按钮 */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={(e) => handleDownload(poster.url!, poster.id, e)}
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
                    海报 {promptById.get(selectedPosterId || '')?.id} - {promptById.get(selectedPosterId || '')?.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {promptById.get(selectedPosterId || '')?.titleEn}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1 sm:gap-2">
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
                        handleDownload(
                          selectedPreviewUrl,
                          `${selectedPoster.id}-${previewMode === 'raw' ? 'raw' : 'final'}`
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
                          alt={promptById.get(selectedPoster.id)?.title || `Poster ${selectedPoster.id}`}
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
