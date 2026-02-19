import { AppError, ErrorType } from './errorTypes';

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
      if (i === maxRetries - 1) throw error;
      console.log(`重试第 ${i + 1} 次...`);
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error('重试失败');
}
