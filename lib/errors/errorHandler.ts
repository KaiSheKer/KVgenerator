import { AppError, ErrorType } from './errorTypes';

type RetryableError = Error & {
  retryAfterMs?: number;
};

function shouldRetryError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if ('retryAfterMs' in error) return true;

  const message = error.message.toLowerCase();
  return (
    message.includes('429') ||
    message.includes('503') ||
    message.includes('resource_exhausted') ||
    message.includes('high demand') ||
    message.includes('quota') ||
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('timeout')
  );
}

export function handleError(error: unknown) {
  console.error('Error occurred:', error);

  if (error instanceof AppError) {
    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
        alert('网络连接失败,请检查您的网络连接后重试');
        break;
      case ErrorType.API_TIMEOUT:
        alert('请求超时,服务器响应时间过长,请稍后重试');
        break;
      case ErrorType.FILE_TOO_LARGE:
        alert(error.userMessage || '文件大小不能超过 10MB');
        break;
      case ErrorType.INVALID_FILE_TYPE:
        alert('请上传 JPG、PNG 或 WEBP 格式的图片');
        break;
      case ErrorType.API_KEY_INVALID:
        alert('API 密钥无效,请检查您的 API 密钥配置');
        break;
      case ErrorType.GENERATION_FAILED:
        alert(error.userMessage || '生成过程中出现错误,请重试');
        break;
      default:
        alert(error.userMessage || '发生未知错误,请重试');
    }
  } else if (error instanceof Error) {
    alert(error.message || '请稍后重试');
  } else {
    alert('发生未知错误,请刷新页面后重试');
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1 || !shouldRetryError(error)) throw error;
      const retryAfterMs =
        error instanceof Error && 'retryAfterMs' in error
          ? (error as RetryableError).retryAfterMs
          : undefined;
      const waitMs =
        typeof retryAfterMs === 'number' && Number.isFinite(retryAfterMs) && retryAfterMs > 0
          ? retryAfterMs
          : delay * (i + 1);
      console.log(`重试第 ${i + 1} 次,等待 ${Math.ceil(waitMs / 1000)} 秒...`);
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }
  }
  throw new Error('重试失败');
}
