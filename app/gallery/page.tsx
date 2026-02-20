'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Eye } from 'lucide-react';

export default function GalleryPage() {
  const router = useRouter();
  const { generatedPosters, generatedPrompts } = useAppContext();
  const [selectedPosterId, setSelectedPosterId] = useState<string | null>(null);
  const promptById = new Map(generatedPrompts?.posters.map((poster) => [poster.id, poster]));
  const selectedPoster = selectedPosterId
    ? generatedPosters?.find((poster) => poster.id === selectedPosterId)
    : null;

  useEffect(() => {
    if (!generatedPosters || generatedPosters.length === 0) {
      router.push('/');
    }
  }, [generatedPosters, router]);

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
    <div className="max-w-7xl mx-auto p-8 space-y-8 animate-fade-in">
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
        <Button size="lg" onClick={handleDownloadAll} className="bg-gradient-to-r from-primary to-accent">
          下载全部 ZIP
        </Button>
        <Button size="lg" variant="outline" onClick={() => router.push('/')}>
          重新开始
        </Button>
      </div>

      {/* 海报网格 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {generatedPosters.map((poster) => {
          if (poster.status !== 'completed') return null;

          const prompt = promptById.get(poster.id);

          return (
            <Card
              key={poster.id}
              className="relative group cursor-pointer overflow-hidden rounded-3xl shadow-md transition-all duration-300 hover:shadow-float hover:-translate-y-1"
              onClick={() => setSelectedPosterId(poster.id)}
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

                {/* 悬浮下载按钮 */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={(e) => handleDownload(poster.url!, poster.id, e)}
                    className="bg-white/90 text-gray-900 px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-white transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    下载
                  </button>
                  <button className="bg-white/90 text-gray-900 px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-white transition-colors">
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
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedPosterId(null)}
        >
          <div className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <Card className="overflow-hidden rounded-3xl">
              {selectedPoster?.url && (
                <Image
                  src={selectedPoster.url}
                  alt={promptById.get(selectedPoster.id)?.title || `Poster ${selectedPoster.id}`}
                  width={720}
                  height={1280}
                  unoptimized
                  className="w-full h-auto"
                />
              )}
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-bold">
                    海报 {promptById.get(selectedPosterId || '')?.id} - {promptById.get(selectedPosterId || '')?.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {promptById.get(selectedPosterId || '')?.titleEn}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (selectedPoster?.url) {
                        handleDownload(selectedPoster.url, selectedPoster.id);
                      }
                    }}
                    className="bg-gradient-to-r from-primary to-accent"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    下载
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedPosterId(null)}
                  >
                    关闭
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
