import { withRetry } from '@/lib/errors/errorHandler';

interface GenerationRequest {
  prompt: string;
  negative?: string;
  width?: number;
  height?: number;
  num?: number;
}

export async function generatePoster(
  request: GenerationRequest
): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const imageModel = process.env.NEXT_PUBLIC_GEMINI_IMAGE_MODEL || 'gemini-3-pro-image-preview';
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  return withRetry(async () => {
    const width = request.width || 720;
    const height = request.height || 1280;
    const aspectRatio = getAspectRatio(width, height);
    const prompt = request.negative
      ? `${request.prompt}\n\nAvoid: ${request.negative}`
      : request.prompt;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${imageModel}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
            imageConfig: {
              aspectRatio,
            },
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini image API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts;
    const imagePart = Array.isArray(parts)
      ? parts.find(
          (part: { inlineData?: { data?: string; mimeType?: string }; inline_data?: { data?: string; mime_type?: string } }) =>
            part?.inlineData?.data || part?.inline_data?.data
        )
      : null;

    const inline = imagePart?.inlineData || imagePart?.inline_data;
    const base64 = inline?.data;
    const mimeType = inline?.mimeType || inline?.mime_type || 'image/png';

    if (!base64) {
      const modelText = Array.isArray(parts)
        ? parts.find((part: { text?: string }) => typeof part.text === 'string')?.text
        : '';
      throw new Error(`No image generated${modelText ? `: ${modelText}` : ''}`);
    }

    return `data:${mimeType};base64,${base64}`;
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

function getAspectRatio(width: number, height: number): string {
  const ratio = width / height;
  const options = [
    { value: '1:1', ratio: 1 },
    { value: '2:3', ratio: 2 / 3 },
    { value: '3:2', ratio: 3 / 2 },
    { value: '3:4', ratio: 3 / 4 },
    { value: '4:3', ratio: 4 / 3 },
    { value: '4:5', ratio: 4 / 5 },
    { value: '5:4', ratio: 5 / 4 },
    { value: '9:16', ratio: 9 / 16 },
    { value: '16:9', ratio: 16 / 9 },
    { value: '21:9', ratio: 21 / 9 },
  ];

  let best = options[0];
  let minDiff = Math.abs(ratio - best.ratio);
  for (const option of options.slice(1)) {
    const diff = Math.abs(ratio - option.ratio);
    if (diff < minDiff) {
      best = option;
      minDiff = diff;
    }
  }

  return best.value;
}
