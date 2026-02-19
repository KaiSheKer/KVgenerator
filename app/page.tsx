'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/ImageUpload';
import { useAppContext } from '@/contexts/AppContext';

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
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">上传产品图片</h2>
        <p className="text-muted-foreground">
          AI 将自动分析产品信息并生成 10 张专业电商海报
        </p>
      </div>

      <ImageUpload onUpload={handleUpload} image={imagePreview} />

      {imagePreview && (
        <div className="flex justify-center">
          <Button size="lg" onClick={handleAnalyze}>
            开始分析 →
          </Button>
        </div>
      )}
    </div>
  );
}
