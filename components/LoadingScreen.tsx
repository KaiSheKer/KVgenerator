'use client';

import { Progress } from '@/components/ui/progress';

interface LoadingScreenProps {
  progress: number;
  message: string;
}

export function LoadingScreen({ progress, message }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="max-w-md w-full p-8 space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-lg font-medium">{message}</p>
          <p className="text-sm text-muted-foreground">
            预计剩余时间: {Math.ceil((100 - progress) / 20)} 分钟
          </p>
        </div>

        <Progress value={progress} className="h-2" />

        <p className="text-center text-sm text-muted-foreground">
          {Math.round(progress)}%
        </p>
      </div>
    </div>
  );
}
