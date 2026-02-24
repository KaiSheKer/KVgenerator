import type { AnalysisResponse } from '@/contexts/AppContext';

interface GenerationRequest {
  prompt: string;
  negative?: string;
  width?: number;
  height?: number;
  referenceImage?: string;
  enforceNoText?: boolean;
}

export async function analyzeProduct(imageBase64: string): Promise<AnalysisResponse> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageBase64 }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Analyze request failed: ${response.status}`);
  }

  return (await response.json()) as AnalysisResponse;
}

export async function generatePoster(request: GenerationRequest): Promise<string> {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Generate request failed: ${response.status}`);
  }

  const data = (await response.json()) as { dataUrl?: string };
  if (!data.dataUrl) {
    throw new Error('No image generated');
  }

  return data.dataUrl;
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
