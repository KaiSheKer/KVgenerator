import 'server-only';
import { withRetry } from '@/lib/errors/errorHandler';

interface GenerationRequest {
  prompt: string;
  negative?: string;
  width?: number;
  height?: number;
  num?: number;
  referenceImage?: string;
  enforceNoText?: boolean;
}

interface NoTextAuditResult {
  pass: boolean;
  reason: string;
}

export async function generatePoster(
  request: GenerationRequest
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const imageModel = process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image-preview';
  const auditModel = resolveAuditModel(
    process.env.GEMINI_ANALYSIS_MODEL || 'gemini-2.5-flash'
  );
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
    const enforceNoText = request.enforceNoText === true;
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
      if (enforceNoText) {
        const audit = await verifyNoTextPolicy({
          apiKey,
          model: auditModel,
          imageDataUrl: primaryAttempt.dataUrl,
        });
        if (!audit.pass) {
          throw buildNoTextViolationError(audit.reason);
        }
      }
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
        if (enforceNoText) {
          const audit = await verifyNoTextPolicy({
            apiKey,
            model: auditModel,
            imageDataUrl: fallbackAttempt.dataUrl,
          });
          if (!audit.pass) {
            throw buildNoTextViolationError(audit.reason);
          }
        }
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

function resolveAuditModel(model: string): string {
  const normalized = model.trim();
  if (!normalized) return 'gemini-2.5-flash';
  if (normalized === 'gemini-3-pro') return 'gemini-3-pro-preview';
  return normalized;
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

type AuditJsonPayload = {
  containsTextOverlay?: boolean;
  containsExtraLogoOrWatermark?: boolean;
  confidence?: number;
  foundTexts?: string[];
  reason?: string;
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

async function verifyNoTextPolicy(args: {
  apiKey: string;
  model: string;
  imageDataUrl: string;
}): Promise<NoTextAuditResult> {
  const parsedImage = parseDataUrl(args.imageDataUrl);
  if (!parsedImage) {
    return { pass: true, reason: 'skip audit: invalid image data' };
  }

  const auditPrompt = [
    'Check image for policy violations.',
    'Allow only text/logo already printed on product package.',
    'Violation = any extra standalone text, slogan, watermark, UI label, or logo outside package print.',
    'Return JSON only:',
    '{"containsTextOverlay":boolean,"containsExtraLogoOrWatermark":boolean,"confidence":number,"foundTexts":[string],"reason":string}',
    'Keep reason <= 18 words.',
  ].join('\n');

  const maxAuditAttempts = 3;
  let lastAuditError = 'audit unavailable';

  for (let attempt = 0; attempt < maxAuditAttempts; attempt += 1) {
    try {
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
                parts: [
                  { text: auditPrompt },
                  {
                    inline_data: {
                      mime_type: parsedImage.mimeType,
                      data: parsedImage.base64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0,
              maxOutputTokens: 1024,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (!response.ok) {
        const body = await response.text();
        lastAuditError = `status=${response.status} body=${body.slice(0, 120)}`;
        if (
          (response.status === 429 || response.status === 503) &&
          attempt < maxAuditAttempts - 1
        ) {
          const parsedError = tryParseJson(body);
          const retryAfterMs = extractRetryAfterMs(parsedError, body);
          const waitMs = Math.max(
            1500,
            Math.min(8000, retryAfterMs ?? 1200 * (attempt + 1))
          );
          await sleep(waitMs);
          continue;
        }
        return { pass: false, reason: `audit request failed: ${lastAuditError}` };
      }

      const data = await response.json();
      const textParts: string[] = Array.isArray(data?.candidates?.[0]?.content?.parts)
        ? data.candidates[0].content.parts
            .map((part: { text?: string }) => part?.text)
            .filter((value: unknown): value is string => typeof value === 'string')
        : [];
      const rawText = textParts.join('\n').trim();
      const audit = parseAuditJson(rawText);
      if (!audit) {
        lastAuditError = `audit parse failed: ${rawText.slice(0, 120) || 'empty response'}`;
        if (attempt < maxAuditAttempts - 1) {
          await sleep(400 * (attempt + 1));
          continue;
        }
        return { pass: false, reason: lastAuditError };
      }

      const confidence = clampConfidence(audit.confidence);
      const foundTexts = Array.isArray(audit.foundTexts)
        ? audit.foundTexts.filter(
            (item) => typeof item === 'string' && item.trim().length > 0
          )
        : [];
      const hasTextOverlay = audit.containsTextOverlay === true;
      const hasExtraLogo = audit.containsExtraLogoOrWatermark === true;
      const mustBlock =
        hasTextOverlay ||
        hasExtraLogo ||
        (foundTexts.length > 0 && confidence >= 0.3);

      if (!mustBlock) {
        return { pass: true, reason: 'clean' };
      }

      const reason = [
        hasTextOverlay ? 'extra text' : '',
        hasExtraLogo ? 'extra logo/watermark' : '',
        foundTexts.length > 0 ? `found: ${foundTexts.slice(0, 3).join(' | ')}` : '',
        audit.reason ? `detail: ${audit.reason}` : '',
        `confidence=${confidence.toFixed(2)}`,
      ]
        .filter(Boolean)
        .join('; ');

      return {
        pass: false,
        reason: reason || 'no-text policy violation',
      };
    } catch (error) {
      lastAuditError = error instanceof Error ? error.message : 'unknown runtime error';
      if (attempt < maxAuditAttempts - 1) {
        await sleep(1000 * (attempt + 1));
        continue;
      }
      return { pass: false, reason: `audit runtime error: ${lastAuditError}` };
    }
  }

  return { pass: false, reason: `audit retries exhausted: ${lastAuditError}` };
}

function parseAuditJson(text: string): AuditJsonPayload | null {
  if (!text) return null;
  const trimmed = stripCodeFences(text.trim());
  const direct = tryParseAuditJson(trimmed);
  if (direct) return direct;
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (match) {
    const parsed = tryParseAuditJson(match[0]);
    if (parsed) return parsed;
  }

  return parseAuditJsonByRegex(trimmed);
}

function tryParseAuditJson(text: string): AuditJsonPayload | null {
  try {
    return JSON.parse(text) as AuditJsonPayload;
  } catch {
    return null;
  }
}

function stripCodeFences(text: string): string {
  if (!text.startsWith('```')) return text;
  return text
    .replace(/^```[a-zA-Z]*\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

function parseAuditJsonByRegex(text: string): AuditJsonPayload | null {
  const textOverlayMatch = text.match(
    /["']?(containsTextOverlay|contains_text_overlay)["']?\s*:\s*(true|false)/i
  );
  const logoMatch = text.match(
    /["']?(containsExtraLogoOrWatermark|contains_extra_logo_or_watermark)["']?\s*:\s*(true|false)/i
  );
  const confidenceMatch = text.match(/["']?confidence["']?\s*:\s*([0-9.]+)/i);
  const foundTextsMatch = text.match(/["']?foundTexts["']?\s*:\s*\[([^\]]*)\]/i);
  const reasonMatch = text.match(/["']?reason["']?\s*:\s*["']([^"']*)["']/i);

  if (!textOverlayMatch && !logoMatch && !confidenceMatch && !foundTextsMatch && !reasonMatch) {
    return null;
  }

  const foundTexts = foundTextsMatch
    ? foundTextsMatch[1]
        .split(',')
        .map((item) => item.replace(/["']/g, '').trim())
        .filter(Boolean)
    : [];

  return {
    containsTextOverlay: textOverlayMatch
      ? textOverlayMatch[2].toLowerCase() === 'true'
      : undefined,
    containsExtraLogoOrWatermark: logoMatch
      ? logoMatch[2].toLowerCase() === 'true'
      : undefined,
    confidence: confidenceMatch ? Number(confidenceMatch[1]) : undefined,
    foundTexts,
    reason: reasonMatch?.[1],
  };
}

function clampConfidence(value: unknown): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0.5;
  return Math.max(0, Math.min(1, value));
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

  if (status === 429 || status === 503) {
    const retryAfterMs = extractRetryAfterMs(parsedError, message);
    if (retryAfterMs) {
      error.retryAfterMs = retryAfterMs;
    } else if (status === 503) {
      // Service overload often recovers quickly; avoid immediate tight retry.
      error.retryAfterMs = 8000;
    }
  }

  return error;
}

function buildNoTextViolationError(reason: string): Error {
  return new Error(`No-text policy violation: ${reason}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
