import type { AnalysisResponse } from '@/contexts/AppContext';

interface GenerationRequest {
  prompt: string;
  negative?: string;
  width?: number;
  height?: number;
  referenceImage?: string;
  enforceNoText?: boolean;
  enforceHardConstraints?: boolean;
}

const GENERATE_TIMEOUT_MS = 150000;
const GENERATE_MAX_NETWORK_RETRIES = 2;
const ANALYZE_TIMEOUT_MS = 45000;
const ANALYZE_MAX_NETWORK_RETRIES = 1;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isNetworkLikeError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === 'AbortError') return true;
  return /failed to fetch|networkerror|load failed|network request failed/i.test(error.message);
}

function shouldRetryAnalyzeStatus(status: number, message: string): boolean {
  if (status >= 500) return true;
  return /fetch failed|network|timeout|temporarily unavailable|service unavailable/i.test(
    message
  );
}

export async function analyzeProduct(imageBase64: string): Promise<AnalysisResponse> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= ANALYZE_MAX_NETWORK_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ANALYZE_TIMEOUT_MS);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageBase64 }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          typeof errorData?.error === 'string'
            ? errorData.error
            : `Analyze request failed: ${response.status}`;

        if (
          attempt < ANALYZE_MAX_NETWORK_RETRIES &&
          shouldRetryAnalyzeStatus(response.status, errorMessage)
        ) {
          await sleep(1200 * (attempt + 1));
          continue;
        }

        throw new Error(errorMessage);
      }

      return (await response.json()) as AnalysisResponse;
    } catch (error) {
      clearTimeout(timer);
      lastError = error;
      if (isNetworkLikeError(error) && attempt < ANALYZE_MAX_NETWORK_RETRIES) {
        await sleep(1200 * (attempt + 1));
        continue;
      }
      break;
    }
  }

  if (isNetworkLikeError(lastError)) {
    const reason = lastError instanceof Error ? lastError.message : 'unknown';
    throw new Error(
      `无法连接 /api/analyze（网络或本地服务中断）。请确认本地服务在线后重试。原始错误: ${reason}`
    );
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error('Analyze request failed');
}

export async function generatePoster(request: GenerationRequest): Promise<string> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= GENERATE_MAX_NETWORK_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GENERATE_TIMEOUT_MS);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Generate request failed: ${response.status}`);
      }

      const data = (await response.json()) as { dataUrl?: string };
      if (!data.dataUrl) {
        throw new Error('No image generated');
      }

      return data.dataUrl;
    } catch (error) {
      clearTimeout(timer);
      lastError = error;
      if (isNetworkLikeError(error) && attempt < GENERATE_MAX_NETWORK_RETRIES) {
        await sleep(1200 * (attempt + 1));
        continue;
      }
      break;
    }
  }

  if (isNetworkLikeError(lastError)) {
    const reason = lastError instanceof Error ? lastError.message : 'unknown';
    throw new Error(
      `无法连接 /api/generate（网络或本地服务中断）。请确认本地服务在线后重试。原始错误: ${reason}`
    );
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error('Generate request failed');
}

// 模拟生成函数,用于开发测试
export async function generatePosterMock(
  request: GenerationRequest
): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 2000));
  const width = request.width || 720;
  const height = request.height || 1280;
  return `https://via.placeholder.com/${width}x${height}/000000/FFFFFF?text=Poster+Generated`;
}
