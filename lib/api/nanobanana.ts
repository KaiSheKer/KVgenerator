import { withRetry } from '@/lib/errors/errorHandler';

interface GenerationRequest {
  prompt: string;
  negative?: string;
  width?: number;
  height?: number;
  num?: number;
}

interface GenerationResponse {
  success: boolean;
  data?: {
    url: string;
  }[];
  error?: string;
}

export async function generatePoster(
  request: GenerationRequest
): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_NANO_BANANA_API_KEY;
  if (!apiKey) {
    throw new Error('NANO_BANANA_API_KEY not configured');
  }

  return withRetry(async () => {
    // 注意: 这里使用占位符 API,实际使用时需要替换为真实的 Nano Banana Pro API
    // 当前实现返回示例图片 URL
    const response = await fetch(
      'https://api.nanobanana.com/v1/generate', // 占位符 URL
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          prompt: request.prompt,
          negative_prompt: request.negative || '',
          width: request.width || 720,
          height: request.height || 1280,
          num_images: request.num || 1,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Nano Banana API error: ${JSON.stringify(error)}`);
    }

    const data: GenerationResponse = await response.json();

    if (!data.success || !data.data || data.data.length === 0) {
      throw new Error('No image generated');
    }

    return data.data[0].url;
  });
}

// 模拟生成函数,用于开发测试
export async function generatePosterMock(
  request: GenerationRequest
): Promise<string> {
  // 模拟 API 延迟
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 返回占位图片
  const width = request.width || 720;
  const height = request.height || 1280;
  return `https://via.placeholder.com/${width}x${height}/000000/FFFFFF?text=Poster+Generated`;
}
