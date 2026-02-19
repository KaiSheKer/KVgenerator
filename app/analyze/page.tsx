'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { useLoading } from '@/hooks/useLoading';
import { analyzeProduct } from '@/lib/api/gemini';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function AnalyzePage() {
  const router = useRouter();
  const { uploadedImage, setProductInfo } = useAppContext();
  const { isLoading, progress, message, startLoading, updateProgress, stopLoading } = useLoading();

  useEffect(() => {
    if (!uploadedImage) {
      router.push('/');
      return;
    }

    const analyze = async () => {
      startLoading('AI 正在分析产品图片...');

      try {
        updateProgress(20, '识别品牌名称...');
        await new Promise(resolve => setTimeout(resolve, 500));

        updateProgress(40, '提取产品信息...');
        const result = await analyzeProduct(uploadedImage.preview);

        updateProgress(80, '分析配色方案...');
        await new Promise(resolve => setTimeout(resolve, 500));

        updateProgress(100, '分析完成!');
        setProductInfo(result);

        setTimeout(() => {
          stopLoading();
          router.push('/edit');
        }, 500);
      } catch (error) {
        console.error('Analysis failed:', error);
        alert('分析失败: ' + (error instanceof Error ? error.message : '未知错误'));
        stopLoading();
        router.push('/');
      }
    };

    analyze();
  }, [router, setProductInfo, startLoading, stopLoading, updateProgress, uploadedImage]);

  if (isLoading) {
    return <LoadingScreen progress={progress} message={message} />;
  }

  return null;
}
