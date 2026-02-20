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
    <div className="min-h-screen flex items-center justify-center p-8 animate-fade-in">
      <div className="w-full max-w-3xl space-y-6">
        {/* 上传卡片 */}
        <ImageUpload onUpload={handleUpload} image={imagePreview} />

        {/* 开始分析按钮 */}
        {imagePreview && (
          <div className="flex justify-center animate-slide-up">
            <Button
              size="lg"
              onClick={handleAnalyze}
              className="px-12 py-6 text-lg rounded-2xl bg-gradient-to-r from-primary to-accent hover:shadow-float transition-all duration-300 hover:-translate-y-1"
            >
              开始分析 →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
