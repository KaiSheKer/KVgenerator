'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Eye } from 'lucide-react';

export default function GalleryPage() {
  const router = useRouter();
  const { generatedPosters, generatedPrompts } = useAppContext();
  const [selectedPoster, setSelectedPoster] = useState<number | null>(null);

  useEffect(() => {
    if (!generatedPosters || generatedPosters.length === 0) {
      router.push('/');
    }
  }, [generatedPosters, router]);

  if (!generatedPosters || generatedPosters.length === 0) {
    return null;
  }

  const handleDownload = (url: string, id: string) => {
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
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">海报生成成果</h2>
        <p className="text-muted-foreground">
          成功生成 {generatedPosters.filter(p => p.status === 'completed').length} 张海报
        </p>
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-center gap-4">
        <Button size="lg" onClick={handleDownloadAll}>
          <Download className="w-4 h-4 mr-2" />
          下载全部
        </Button>
        <Button size="lg" variant="outline" onClick={() => router.push('/')}>
          重新开始
        </Button>
      </div>

      {/* 海报画廊 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {generatedPosters.map((poster, index) => {
          if (poster.status !== 'completed') return null;

          const prompt = generatedPrompts?.posters[index];
          const posterNumber = parseInt(poster.id);

          return (
            <Card
              key={poster.id}
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedPoster(index)}
            >
              <div className="aspect-[9/16] relative bg-muted">
                {poster.url ? (
                  <img
                    src={poster.url}
                    alt={prompt?.title || `Poster ${poster.id}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    暂无图片
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  {poster.id}
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm truncate">
                  {prompt?.title || `海报 ${poster.id}`}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {prompt?.titleEn || `Poster ${poster.id}`}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 大图预览 */}
      {selectedPoster !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPoster(null)}
        >
          <div className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <Card className="overflow-hidden">
              {generatedPosters[selectedPoster]?.url && (
                <img
                  src={generatedPosters[selectedPoster].url}
                  alt={generatedPrompts?.posters[selectedPoster]?.title}
                  className="w-full"
                />
              )}
              <div className="p-4 space-y-4">
                <div>
                  <h3 className="text-lg font-bold">
                    海报 {generatedPrompts?.posters[selectedPoster]?.id} - {generatedPrompts?.posters[selectedPoster]?.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {generatedPrompts?.posters[selectedPoster]?.titleEn}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      const poster = generatedPosters[selectedPoster];
                      if (poster?.url) {
                        handleDownload(poster.url, poster.id);
                      }
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    下载
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedPoster(null)}
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
