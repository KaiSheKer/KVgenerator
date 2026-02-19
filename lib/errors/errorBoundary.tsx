'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 space-y-4 border rounded-lg shadow-lg">
            <h1 className="text-xl font-semibold text-red-600">出错了</h1>
            <p className="text-sm text-gray-600">
              抱歉,应用程序遇到了一个错误。您可以尝试刷新页面或重新开始。
            </p>
            {this.state.error && (
              <details className="text-sm bg-gray-100 p-3 rounded">
                <summary className="cursor-pointer font-medium mb-2">错误详情</summary>
                <pre className="text-xs overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-2">
              <Button onClick={() => window.location.reload()} className="flex-1">
                刷新页面
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="flex-1"
              >
                返回首页
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
