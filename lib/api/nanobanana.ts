import 'server-only';
import { withRetry } from '@/lib/errors/errorHandler';

interface GenerationRequest {
  prompt: string;
  negative?: string;
  width?: number;
  height?: number;
  num?: number;
  referenceImage?: string;
}

export async function generatePoster(
  request: GenerationRequest
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const imageModel = process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image-preview';
  const fallbackImageModel =
    process.env.GEMINI_IMAGE_FALLBACK_MODEL?.trim() || '';
  const allowFlashFallback = process.env.ALLOW_FLASH_FALLBACK === 'true';
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

    const primaryAttempt = await requestImageFromModel({
      apiKey,
      model: imageModel,
      prompt,
      aspectRatio,
      referenceImage: request.referenceImage,
    });

    if (primaryAttempt.dataUrl) {
      return primaryAttempt.dataUrl;
    }

    if (
      shouldFallbackToSecondaryModel(
        primaryAttempt.status,
        primaryAttempt.message,
        imageModel,
        fallbackImageModel,
        allowFlashFallback
      )
    ) {
      console.warn(
        `Model ${imageModel} unavailable, fallback to ${fallbackImageModel}`
      );
      const fallbackAttempt = await requestImageFromModel({
        apiKey,
        model: fallbackImageModel,
        prompt,
        aspectRatio,
        referenceImage: request.referenceImage,
      });
      if (fallbackAttempt.dataUrl) {
        return fallbackAttempt.dataUrl;
      }

      throw buildGeminiImageError(
        fallbackAttempt.status,
        fallbackAttempt.message,
        fallbackAttempt.parsedError
      );
    }

    throw buildGeminiImageError(
      primaryAttempt.status,
      primaryAttempt.message,
      primaryAttempt.parsedError
    );
  }, 5, 2000);
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

function tryParseJson(input: string): {
  error?: {
    message?: string;
    details?: Array<{
      '@type'?: string;
      retryDelay?: string;
    }>;
  };
} | null {
  try {
    return JSON.parse(input) as {
      error?: {
        message?: string;
        details?: Array<{
          '@type'?: string;
          retryDelay?: string;
        }>;
      };
    };
  } catch {
    return null;
  }
}

function extractRetryAfterMs(
  parsed: {
    error?: {
      message?: string;
      details?: Array<{
        '@type'?: string;
        retryDelay?: string;
      }>;
    };
  } | null,
  fallbackMessage: string
): number | undefined {
  const retryInfo = parsed?.error?.details?.find(
    (detail) => detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
  );
  const fromDetails = parseSecondsToMs(retryInfo?.retryDelay);
  if (fromDetails) return fromDetails;

  const match = fallbackMessage.match(/retry in\s+([0-9.]+)s/i);
  if (!match) return undefined;
  const seconds = Number(match[1]);
  if (!Number.isFinite(seconds) || seconds <= 0) return undefined;
  return Math.ceil(seconds * 1000);
}

function parseSecondsToMs(input?: string): number | undefined {
  if (!input) return undefined;
  const match = input.match(/([0-9.]+)s$/i);
  if (!match) return undefined;
  const seconds = Number(match[1]);
  if (!Number.isFinite(seconds) || seconds <= 0) return undefined;
  return Math.ceil(seconds * 1000);
}

type GeminiApiErrorPayload = {
  error?: {
    message?: string;
    details?: Array<{
      '@type'?: string;
      retryDelay?: string;
    }>;
  };
};

async function requestImageFromModel(args: {
  apiKey: string;
  model: string;
  prompt: string;
  aspectRatio: string;
  referenceImage?: string;
}): Promise<{
  status: number;
  message: string;
  parsedError: GeminiApiErrorPayload | null;
  dataUrl?: string;
}> {
  const requestParts: Array<
    | { text: string }
    | { inline_data: { mime_type: string; data: string } }
  > = [{ text: args.prompt }];
  const parsedReference = parseDataUrl(args.referenceImage);
  if (parsedReference) {
    requestParts.push({
      inline_data: {
        mime_type: parsedReference.mimeType,
        data: parsedReference.base64,
      },
    });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${args.model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': args.apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: requestParts,
          },
        ],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: {
            aspectRatio: args.aspectRatio,
          },
        },
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    const parsed = tryParseJson(errorBody);
    return {
      status: response.status,
      message: parsed?.error?.message || errorBody,
      parsedError: parsed,
    };
  }

  const data = await response.json();
  const responseParts: Array<{
    text?: string;
    inlineData?: { data?: string; mimeType?: string };
    inline_data?: { data?: string; mime_type?: string };
  }> = Array.isArray(data?.candidates?.[0]?.content?.parts)
    ? data.candidates[0].content.parts
    : [];
  const imagePart = responseParts.find(
        (part: { inlineData?: { data?: string; mimeType?: string }; inline_data?: { data?: string; mime_type?: string } }) =>
          part?.inlineData?.data || part?.inline_data?.data
      ) || null;
  const base64 = imagePart?.inlineData?.data || imagePart?.inline_data?.data;
  const mimeType =
    imagePart?.inlineData?.mimeType ||
    imagePart?.inline_data?.mime_type ||
    'image/png';

  if (!base64) {
    const modelText = responseParts.find((part: { text?: string }) => typeof part.text === 'string')?.text || '';
    return {
      status: 502,
      message: `No image generated${modelText ? `: ${modelText}` : ''}`,
      parsedError: null,
    };
  }

  return {
    status: 200,
    message: 'OK',
    parsedError: null,
    dataUrl: `data:${mimeType};base64,${base64}`,
  };
}

function parseDataUrl(
  value?: string
): { mimeType: string; base64: string } | null {
  if (!value) return null;
  const trimmed = value.trim();
  const dataUrlMatch = trimmed.match(/^data:([^;]+);base64,(.+)$/);
  if (dataUrlMatch) {
    return {
      mimeType: dataUrlMatch[1],
      base64: dataUrlMatch[2],
    };
  }

  // Allow raw base64 fallback; assume jpeg for uploaded product photos.
  if (/^[A-Za-z0-9+/=]+$/.test(trimmed)) {
    return {
      mimeType: 'image/jpeg',
      base64: trimmed,
    };
  }
  return null;
}

function shouldFallbackToSecondaryModel(
  status: number,
  message: string,
  primaryModel: string,
  fallbackModel: string,
  allowFlashFallback: boolean
): boolean {
  if (!fallbackModel) return false;
  if (primaryModel === fallbackModel) return false;
  if (!allowFlashFallback && /flash-image/i.test(fallbackModel)) return false;
  if (status !== 429 && status !== 503) return false;
  return /high demand|unavailable|try again later|quota|rate limit|resource_exhausted/i.test(
    message
  );
}

function buildGeminiImageError(
  status: number,
  message: string,
  parsedError: GeminiApiErrorPayload | null
): Error & { retryAfterMs?: number } {
  const error = new Error(
    `Gemini image API error (${status}): ${message}`
  ) as Error & { retryAfterMs?: number };

  if (status === 429) {
    const retryAfterMs = extractRetryAfterMs(parsedError, message);
    if (retryAfterMs) {
      error.retryAfterMs = retryAfterMs;
    }
  } else if (status === 503) {
    // Service overload often recovers quickly; avoid immediate tight retry.
    error.retryAfterMs = 8000;
  }

  return error;
}
