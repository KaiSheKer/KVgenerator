'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { useLoading } from '@/hooks/useLoading';
import { analyzeProduct } from '@/lib/api/client';
import { LoadingScreen } from '@/components/LoadingScreen';
import type { AnalysisResponse } from '@/contexts/AppContext';

const inFlightAnalyzeTasks = new Map<string, Promise<AnalysisResponse>>();

function getOrCreateAnalyzeTask(imageId: string, imagePreview: string) {
  const existingTask = inFlightAnalyzeTasks.get(imageId);
  if (existingTask) return existingTask;

  const task = analyzeProduct(imagePreview).finally(() => {
    inFlightAnalyzeTasks.delete(imageId);
  });
  inFlightAnalyzeTasks.set(imageId, task);
  return task;
}

export default function AnalyzePage() {
  const router = useRouter();
  const { uploadedImage, editedProductInfo, setProductInfo } = useAppContext();
  const { isLoading, progress, message, startLoading, updateProgress, stopLoading } = useLoading();
  const routerRef = useRef(router);
  const handlersRef = useRef({
    setProductInfo,
    startLoading,
    updateProgress,
    stopLoading,
  });

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    handlersRef.current = {
      setProductInfo,
      startLoading,
      updateProgress,
      stopLoading,
    };
  }, [setProductInfo, startLoading, stopLoading, updateProgress]);

  useEffect(() => {
    const imageId = uploadedImage?.id;
    const imagePreview = uploadedImage?.preview;
    if (!imageId || !imagePreview) {
      routerRef.current.push('/');
      return;
    }

    let cancelled = false;

    const analyze = async () => {
      handlersRef.current.startLoading('AI 正在分析产品图片...');
      if (cancelled) return;

      try {
        if (cancelled) return;
        handlersRef.current.updateProgress(20, '识别品牌名称...');
        await new Promise(resolve => setTimeout(resolve, 500));
        if (cancelled) return;

        handlersRef.current.updateProgress(40, '提取产品信息...');
        const result = await getOrCreateAnalyzeTask(imageId, imagePreview);
        if (cancelled) return;

        handlersRef.current.updateProgress(80, '分析配色方案...');
        await new Promise(resolve => setTimeout(resolve, 500));
        if (cancelled) return;

        handlersRef.current.updateProgress(100, '分析完成!');
        if (cancelled) return;
        console.info('[analyze-flow] analysis complete, preparing redirect', { imageId });
        handlersRef.current.setProductInfo(result);
        await new Promise((resolve) => setTimeout(resolve, 200));
        if (cancelled) return;
        handlersRef.current.stopLoading();
        console.info('[analyze-flow] redirect -> /edit (primary path)', { imageId });
        routerRef.current.replace('/edit');
      } catch (error) {
        if (cancelled) return;
        console.error('Analysis failed:', error);
        alert('分析失败: ' + (error instanceof Error ? error.message : '未知错误'));
        handlersRef.current.stopLoading();
        routerRef.current.push('/');
      }
    };

    analyze();

    return () => {
      cancelled = true;
    };
  }, [uploadedImage?.id, uploadedImage?.preview]);

  useEffect(() => {
    if (!editedProductInfo) return;
    const fallbackTimer = setTimeout(() => {
      console.info('[analyze-flow] redirect -> /edit (fallback path)');
      routerRef.current.replace('/edit');
    }, 250);
    const hardFallbackTimer = setTimeout(() => {
      if (window.location.pathname === '/analyze') {
        console.info('[analyze-flow] redirect retry -> /edit');
        routerRef.current.replace('/edit');
      }
    }, 1200);
    return () => {
      clearTimeout(fallbackTimer);
      clearTimeout(hardFallbackTimer);
    };
  }, [editedProductInfo]);

  if (isLoading) {
    return <LoadingScreen progress={progress} message={message} />;
  }

  return null;
}
