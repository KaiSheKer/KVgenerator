'use client';

import { useState, useCallback } from 'react';

export function useLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');

  const startLoading = (initialMessage = '加载中...') => {
    setIsLoading(true);
    setProgress(0);
    setMessage(initialMessage);
  };

  const updateProgress = (newProgress: number, newMessage?: string) => {
    setProgress(Math.min(100, Math.max(0, newProgress)));
    if (newMessage) setMessage(newMessage);
  };

  const stopLoading = () => {
    setIsLoading(false);
    setProgress(100);
  };

  return {
    isLoading,
    progress,
    message,
    startLoading,
    updateProgress,
    stopLoading,
  };
}
