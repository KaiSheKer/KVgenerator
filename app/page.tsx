'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ImageUpload } from '@/components/ImageUpload';
import { useAppContext } from '@/contexts/AppContext';
import { Sparkles, WandSparkles } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { setUploadedImage } = useAppContext();
  const [imagePreview, setImagePreview] = useState<string>('');

  const handleUpload = (file: File, preview: string) => {
    const uploadedImage = {
      id: Date.now().toString(),
      file,
      preview,
      url: preview,
    };
    setUploadedImage(uploadedImage);
    setImagePreview(preview);
  };

  const handleAnalyze = () => {
    if (imagePreview) {
      router.push('/analyze');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <ImageUpload onUpload={handleUpload} image={imagePreview} />

          <Card className="studio-panel p-5">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold tracking-wide">流程概览</h3>
            </div>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li>1. 上传产品图并分析包装信息</li>
              <li>2. 调整 AI 提取的产品卖点与风格</li>
              <li>3. 生成海报并下载素材</li>
            </ol>
            <div className="mt-5">
              <Button
                size="lg"
                onClick={handleAnalyze}
                disabled={!imagePreview}
                className="w-full"
              >
                开始分析
              </Button>
            </div>
          </Card>
        </aside>

        <section className="space-y-5">
          <Card className="studio-panel p-6 lg:p-8">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Live Preview</p>
                <h2 className="mt-1 text-xl font-semibold">生成画布</h2>
              </div>
              <span className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">
                9:16 Poster
              </span>
            </div>
            <div className="rounded-2xl border border-border/70 bg-secondary/40 p-6">
              <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-2xl border border-border/80 bg-background/80">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="当前上传的产品图"
                    width={560}
                    height={960}
                    unoptimized
                    className="h-[420px] w-full object-cover"
                  />
                ) : (
                  <div className="flex h-[420px] flex-col items-center justify-center gap-3 text-muted-foreground">
                    <WandSparkles className="h-8 w-8 text-primary" />
                    <p className="text-sm">上传后将在这里显示主视觉预览</p>
                  </div>
                )}
              </div>
              <div className="mx-auto mt-6 h-2 w-full max-w-[300px] overflow-hidden rounded-full border border-border/60 bg-secondary/60">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                  style={{ width: imagePreview ? '48%' : '12%' }}
                />
              </div>
            </div>
          </Card>

          <Card className="studio-panel p-5">
            <h3 className="mb-4 text-sm font-semibold tracking-wide">示例输出位</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-border/70 bg-secondary/40 p-3"
                >
                  <div className="aspect-[9/16] rounded-lg border border-dashed border-primary/35 bg-background/55" />
                  <div className="mt-3 h-8 rounded-lg bg-gradient-to-r from-primary to-accent opacity-80" />
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
