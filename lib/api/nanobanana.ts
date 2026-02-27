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
  enforceHardConstraints?: boolean;
}

interface ConstraintAuditResult {
  pass: boolean;
  reason: string;
  failedRules: string[];
}

interface ConstraintAuditJsonPayload {
  hasCtaText?: boolean;
  hasDecorativeFrame?: boolean;
  hasJunkCaption?: boolean;
  hasUnrelatedLogoOrWatermark?: boolean;
  hasUnreadableText?: boolean;
  confidence?: number;
  foundTexts?: string[];
  reason?: string;
}

interface GeminiApiErrorPayload {
  error?: {
    message?: string;
    details?: Array<{
      '@type'?: string;
      retryDelay?: string;
    }>;
  };
}

const DEFAULT_ANALYSIS_MODEL = 'gemini-3-flash-preview';
const DEFAULT_IMAGE_MODEL = 'gemini-3-pro-image-preview';
const DEFAULT_FLASH_FALLBACK_MODEL = 'gemini-2.5-flash-image';

const MAX_CONSTRAINT_RETRIES = 2;

export async function generatePoster(
  request: GenerationRequest
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const analysisModel = DEFAULT_ANALYSIS_MODEL;
  const imageModel = DEFAULT_IMAGE_MODEL;
  const allowFlashFallback =
    process.env.KV_IMAGE_FALLBACK_TO_FLASH === 'true' ||
    process.env.ALLOW_FLASH_FALLBACK === 'true';
  const fallbackImageModel = allowFlashFallback
    ? resolveImageModel(
        process.env.GEMINI_IMAGE_FALLBACK_MODEL,
        DEFAULT_FLASH_FALLBACK_MODEL
      )
    : '';

  return withRetry(async () => {
    const width = request.width || 720;
    const height = request.height || 1280;
    const aspectRatio = getAspectRatio(width, height);
    const enforceHardConstraints =
      request.enforceHardConstraints ?? request.enforceNoText ?? true;

    const basePrompt = request.negative
      ? `${request.prompt}\n\nAvoid: ${request.negative}`
      : request.prompt;

    let fallbackUsed = false;
    let retryCount = 0;
    const constraintFailReasons: string[] = [];

    for (let attempt = 0; attempt <= MAX_CONSTRAINT_RETRIES; attempt += 1) {
      const constrainedPrompt =
        attempt === 0
          ? basePrompt
          : strengthenPromptForHardConstraints(basePrompt, constraintFailReasons);

      const imageResult = await requestImageWithFallback({
        apiKey,
        primaryModel: imageModel,
        fallbackModel: fallbackImageModel,
        allowFlashFallback,
        prompt: constrainedPrompt,
        aspectRatio,
        referenceImage: request.referenceImage,
      });

      fallbackUsed = fallbackUsed || imageResult.fallbackUsed;

      if (!enforceHardConstraints) {
        logGenerationResult({
          analysisModel,
          imageModel: imageResult.usedModel,
          fallbackUsed,
          retryCount,
          constraintFailReasons,
        });
        return imageResult.dataUrl;
      }

      const audit = await verifyPosterHardConstraints({
        apiKey,
        model: analysisModel,
        imageDataUrl: imageResult.dataUrl,
      });

      if (audit.pass) {
        logGenerationResult({
          analysisModel,
          imageModel: imageResult.usedModel,
          fallbackUsed,
          retryCount,
          constraintFailReasons,
        });
        return imageResult.dataUrl;
      }

      const reason = audit.reason || 'unknown hard-constraint violation';
      constraintFailReasons.push(reason);
      retryCount += 1;

      if (attempt >= MAX_CONSTRAINT_RETRIES) {
        logGenerationResult({
          analysisModel,
          imageModel: imageResult.usedModel,
          fallbackUsed,
          retryCount,
          constraintFailReasons,
        });
        throw new Error(`Poster hard constraints failed: ${reason}`);
      }
    }

    throw new Error('Poster generation failed after constraint retries');
  }, 5, 2000);
}

export async function generatePosterMock(
  request: GenerationRequest
): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const width = request.width || 720;
  const height = request.height || 1280;
  return `https://via.placeholder.com/${width}x${height}/000000/FFFFFF?text=Poster+Generated`;
}

async function requestImageWithFallback(args: {
  apiKey: string;
  primaryModel: string;
  fallbackModel: string;
  allowFlashFallback: boolean;
  prompt: string;
  aspectRatio: string;
  referenceImage?: string;
}): Promise<{ dataUrl: string; usedModel: string; fallbackUsed: boolean }> {
  const primaryAttempt = await requestImageFromModel({
    apiKey: args.apiKey,
    model: args.primaryModel,
    prompt: args.prompt,
    aspectRatio: args.aspectRatio,
    referenceImage: args.referenceImage,
  });

  if (primaryAttempt.dataUrl) {
    return {
      dataUrl: primaryAttempt.dataUrl,
      usedModel: args.primaryModel,
      fallbackUsed: false,
    };
  }

  if (
    shouldFallbackToSecondaryModel(
      primaryAttempt.status,
      primaryAttempt.message,
      args.primaryModel,
      args.fallbackModel,
      args.allowFlashFallback
    )
  ) {
    const fallbackAttempt = await requestImageFromModel({
      apiKey: args.apiKey,
      model: args.fallbackModel,
      prompt: args.prompt,
      aspectRatio: args.aspectRatio,
      referenceImage: args.referenceImage,
    });

    if (fallbackAttempt.dataUrl) {
      return {
        dataUrl: fallbackAttempt.dataUrl,
        usedModel: args.fallbackModel,
        fallbackUsed: true,
      };
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
}

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

  const executeRequest = async (
    withAspectRatio: boolean
  ): Promise<{
    status: number;
    message: string;
    parsedError: GeminiApiErrorPayload | null;
    dataUrl?: string;
  }> => {
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
          generationConfig: withAspectRatio
            ? {
                responseModalities: ['TEXT', 'IMAGE'],
                imageConfig: {
                  aspectRatio: args.aspectRatio,
                },
              }
            : {
                responseModalities: ['TEXT', 'IMAGE'],
              },
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      const parsed = tryParseJson(errorBody);
      const message = parsed?.error?.message || errorBody;

      if (
        withAspectRatio &&
        response.status === 400 &&
        /aspect ratio is not enabled for this model/i.test(message)
      ) {
        return executeRequest(false);
      }

      return {
        status: response.status,
        message,
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

    const imagePart =
      responseParts.find(
        (part) => part?.inlineData?.data || part?.inline_data?.data
      ) || null;
    const base64 = imagePart?.inlineData?.data || imagePart?.inline_data?.data;
    const mimeType =
      imagePart?.inlineData?.mimeType ||
      imagePart?.inline_data?.mime_type ||
      'image/png';

    if (!base64) {
      const modelText =
        responseParts.find((part) => typeof part.text === 'string')?.text || '';
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
  };

  return executeRequest(true);
}

async function verifyPosterHardConstraints(args: {
  apiKey: string;
  model: string;
  imageDataUrl: string;
}): Promise<ConstraintAuditResult> {
  const parsedImage = parseDataUrl(args.imageDataUrl);
  if (!parsedImage) {
    return {
      pass: false,
      reason: 'invalid generated image payload',
      failedRules: ['invalid_image_payload'],
    };
  }

  const auditPrompt = [
    'You are checking a generated advertisement poster for hard constraints.',
    'Return JSON only with booleans and short reason.',
    'Hard constraints:',
    '1) hasCtaText: true if image includes CTA button/text like SHOP NOW, Learn more, 立即选购, 了解更多, 扫码了解更多.',
    '2) hasDecorativeFrame: true if there is decorative border/frame around canvas.',
    '3) hasJunkCaption: true if there are filler captions such as 细节特写, 关键信息一目了然, 视觉化呈现新鲜度, 可视化呈现, details visible, lifestyle pick, tech insight.',
    '4) hasUnrelatedLogoOrWatermark: true if unrelated logos/watermarks exist outside product package print.',
    '5) hasUnreadableText: true only if text is obvious gibberish, broken, mirrored, or duplicated.',
    'Do NOT mark normal bilingual Chinese/English copy as unreadable.',
    'Ignore text naturally printed on product package and meaningful title/body copy.',
    'JSON schema:',
    '{"hasCtaText":boolean,"hasDecorativeFrame":boolean,"hasJunkCaption":boolean,"hasUnrelatedLogoOrWatermark":boolean,"hasUnreadableText":boolean,"confidence":number,"foundTexts":[string],"reason":string}',
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
        return {
          pass: false,
          reason: `audit request failed: ${lastAuditError}`,
          failedRules: ['audit_unavailable'],
        };
      }

      const data = await response.json();
      const textParts: string[] = Array.isArray(data?.candidates?.[0]?.content?.parts)
        ? data.candidates[0].content.parts
            .map((part: { text?: string }) => part?.text)
            .filter((value: unknown): value is string => typeof value === 'string')
        : [];
      const rawText = textParts.join('\n').trim();
      const audit = parseConstraintAuditJson(rawText);

      if (!audit) {
        lastAuditError =
          `audit parse failed: ${rawText.slice(0, 120) || 'empty response'}`;
        if (attempt < maxAuditAttempts - 1) {
          await sleep(400 * (attempt + 1));
          continue;
        }
        return {
          pass: false,
          reason: lastAuditError,
          failedRules: ['audit_parse_failed'],
        };
      }

      const confidence = clampConfidence(audit.confidence);
      const failedRules: string[] = [];
      if (audit.hasCtaText) failedRules.push('cta_text');
      if (audit.hasDecorativeFrame) failedRules.push('decorative_frame');
      if (audit.hasJunkCaption) failedRules.push('junk_caption');
      if (audit.hasUnrelatedLogoOrWatermark) failedRules.push('unrelated_logo_or_watermark');

      const foundTexts = Array.isArray(audit.foundTexts)
        ? audit.foundTexts
            .filter((item) => typeof item === 'string' && item.trim().length > 0)
            .slice(0, 4)
        : [];

      const unreadableViolation = shouldBlockForUnreadableText({
        hasUnreadableTextFlag: audit.hasUnreadableText === true,
        foundTexts,
        reason: audit.reason,
        confidence,
      });
      if (unreadableViolation) {
        failedRules.push('unreadable_text');
      }

      const blockedFoundText = foundTexts.some((item) =>
        isHardConstraintKeywordText(item)
      );
      if (blockedFoundText) {
        failedRules.push('blocked_found_text');
      }

      const shouldFail = failedRules.length > 0;
      if (!shouldFail) {
        return {
          pass: true,
          reason: 'constraints passed',
          failedRules: [],
        };
      }

      const reason = [
        failedRules.length > 0 ? `rules=${failedRules.join('|')}` : '',
        foundTexts.length > 0 ? `texts=${foundTexts.join('|')}` : '',
        audit.reason ? `detail=${audit.reason}` : '',
        `confidence=${confidence.toFixed(2)}`,
      ]
        .filter(Boolean)
        .join('; ');

      return {
        pass: false,
        reason: reason || 'hard-constraint violation',
        failedRules,
      };
    } catch (error) {
      lastAuditError = error instanceof Error ? error.message : 'unknown runtime error';
      if (attempt < maxAuditAttempts - 1) {
        await sleep(1000 * (attempt + 1));
        continue;
      }
      return {
        pass: false,
        reason: `audit runtime error: ${lastAuditError}`,
        failedRules: ['audit_runtime_error'],
      };
    }
  }

  return {
    pass: false,
    reason: `audit retries exhausted: ${lastAuditError}`,
    failedRules: ['audit_retries_exhausted'],
  };
}

function parseConstraintAuditJson(text: string): ConstraintAuditJsonPayload | null {
  if (!text) return null;
  const trimmed = stripCodeFences(text.trim());
  const direct = tryParseConstraintAuditJson(trimmed);
  if (direct) return direct;

  const match = trimmed.match(/\{[\s\S]*\}/);
  if (match) {
    const parsed = tryParseConstraintAuditJson(match[0]);
    if (parsed) return parsed;
  }

  return parseConstraintAuditJsonByRegex(trimmed);
}

function tryParseConstraintAuditJson(
  text: string
): ConstraintAuditJsonPayload | null {
  try {
    return JSON.parse(text) as ConstraintAuditJsonPayload;
  } catch {
    return null;
  }
}

function parseConstraintAuditJsonByRegex(
  text: string
): ConstraintAuditJsonPayload | null {
  const ctaMatch = matchBooleanField(text, 'hasCtaText');
  const frameMatch = matchBooleanField(text, 'hasDecorativeFrame');
  const junkMatch = matchBooleanField(text, 'hasJunkCaption');
  const logoMatch = matchBooleanField(text, 'hasUnrelatedLogoOrWatermark');
  const unreadableMatch = matchBooleanField(text, 'hasUnreadableText');
  const confidenceMatch = text.match(/["']?confidence["']?\s*:\s*([0-9.]+)/i);
  const foundTextsMatch = text.match(/["']?foundTexts["']?\s*:\s*\[([^\]]*)\]/i);
  const reasonMatch = text.match(/["']?reason["']?\s*:\s*["']([^"']*)["']/i);

  if (
    ctaMatch === undefined &&
    frameMatch === undefined &&
    junkMatch === undefined &&
    logoMatch === undefined &&
    unreadableMatch === undefined &&
    !confidenceMatch &&
    !foundTextsMatch &&
    !reasonMatch
  ) {
    return null;
  }

  const foundTexts = foundTextsMatch
    ? foundTextsMatch[1]
        .split(',')
        .map((item) => item.replace(/["']/g, '').trim())
        .filter(Boolean)
    : [];

  return {
    hasCtaText: ctaMatch,
    hasDecorativeFrame: frameMatch,
    hasJunkCaption: junkMatch,
    hasUnrelatedLogoOrWatermark: logoMatch,
    hasUnreadableText: unreadableMatch,
    confidence: confidenceMatch ? Number(confidenceMatch[1]) : undefined,
    foundTexts,
    reason: reasonMatch?.[1],
  };
}

function matchBooleanField(text: string, field: string): boolean | undefined {
  const match = text.match(
    new RegExp(`["']?${field}["']?\\s*:\\s*(true|false)`, 'i')
  );
  if (!match) return undefined;
  return match[1].toLowerCase() === 'true';
}

function strengthenPromptForHardConstraints(
  basePrompt: string,
  reasons: string[]
): string {
  const tail = reasons.length > 0 ? ' Recent failures detected; apply stricter cleanup.' : '';

  return [
    basePrompt,
    'HARD CONSTRAINT OVERRIDE:',
    '- Remove any CTA button/text (SHOP NOW, Learn more, 立即选购, 了解更多, 扫码了解更多).',
    '- Remove decorative border/frame lines around canvas.',
    '- Remove filler captions (细节特写, 关键信息一目了然, 视觉化呈现新鲜度, 可视化呈现, details visible, lifestyle pick, tech insight).',
    '- Remove unrelated logos/watermarks and unreadable gibberish text.',
    '- Keep only logo(optional) and main title defined by layout config; do not invent extra captions.',
    tail,
  ]
    .filter(Boolean)
    .join('\n');
}

function logGenerationResult(args: {
  analysisModel: string;
  imageModel: string;
  fallbackUsed: boolean;
  retryCount: number;
  constraintFailReasons: string[];
}) {
  console.info(
    '[kv-generation-result]',
    JSON.stringify({
      analysis_model: args.analysisModel,
      image_model: args.imageModel,
      fallback_used: args.fallbackUsed,
      retry_count: args.retryCount,
      constraint_fail_reasons: args.constraintFailReasons,
    })
  );
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

function shouldFallbackToSecondaryModel(
  status: number,
  message: string,
  primaryModel: string,
  fallbackModel: string,
  allowFlashFallback: boolean
): boolean {
  if (!allowFlashFallback) return false;
  if (!fallbackModel) return false;
  if (primaryModel === fallbackModel) return false;
  if (status !== 429 && status !== 503) return false;
  return /high demand|unavailable|try again later|quota|rate limit|resource_exhausted/i.test(
    message
  );
}

function shouldBlockForUnreadableText(args: {
  hasUnreadableTextFlag: boolean;
  foundTexts: string[];
  reason?: string;
  confidence: number;
}): boolean {
  if (!args.hasUnreadableTextFlag) return false;
  if (args.confidence < 0.9) return false;

  const suspiciousTextDetected = args.foundTexts.some((item) =>
    isLikelyGibberishText(item)
  );
  if (suspiciousTextDetected) return true;

  if (args.foundTexts.length > 0) {
    // Guard against false positives where OCR returns normal bilingual copy.
    return false;
  }

  const reason = (args.reason || '').toLowerCase();
  if (!reason) return false;
  return /gibberish|mirrored|broken|duplicated|garbled|乱码|镜像|破碎/.test(reason);
}

function isLikelyGibberishText(input: string): boolean {
  const text = input.trim();
  if (!text) return false;

  const hasCjk = /[\u4e00-\u9fff]/.test(text);
  if (hasCjk) {
    const weirdCjkRatio = ratioOfMatches(
      text,
      /[^A-Za-z0-9\u4e00-\u9fff\s.,:;!?'"/\-+&|()%]/g
    );
    return weirdCjkRatio > 0.25;
  }

  const asciiWords = text.match(/[A-Za-z]{2,}/g) || [];
  const hasCommonWord = asciiWords.some((word) =>
    /^(fresh|natural|orange|premium|vitamin|product|brand|specifications|guide|usage|details)$/i.test(
      word
    )
  );
  if (hasCommonWord) return false;

  const weirdRatio = ratioOfMatches(text, /[^A-Za-z0-9\s.,:;!?'"/\-+&|()%]/g);
  if (weirdRatio > 0.2) return true;

  const compact = text.replace(/\s+/g, '');
  if (/(.)\1{4,}/.test(compact)) return true;

  const vowelCount = (compact.match(/[aeiou]/gi) || []).length;
  if (compact.length >= 8 && vowelCount === 0) return true;

  return false;
}

function ratioOfMatches(input: string, pattern: RegExp): number {
  const total = Math.max(1, input.length);
  const matches = input.match(pattern);
  return (matches?.length || 0) / total;
}

function isHardConstraintKeywordText(input: string): boolean {
  const text = input.trim().toLowerCase();
  if (!text) return false;
  return (
    /shop now|learn more|scan for details|qr/.test(text) ||
    /立即选购|了解更多|扫码了解更多/.test(input) ||
    /细节特写|关键信息一目了然|视觉化呈现新鲜度|可视化呈现|details visible|lifestyle pick|tech insight|freshness visualization|visual(?:ized|izing)? freshness|visual representation/i.test(
      input
    )
  );
}

function resolveImageModel(
  model?: string,
  defaultModel = DEFAULT_IMAGE_MODEL
): string {
  const normalized = (model || '').trim();
  if (!normalized) return defaultModel;
  if (normalized === 'gemini-3-pro' || normalized === 'gemini-3-pro-preview') {
    return 'gemini-3-pro-image-preview';
  }
  if (normalized === 'gemini-2.5-flash' || normalized === 'gemini-2.5-flash-preview') {
    return 'gemini-2.5-flash-image';
  }
  return normalized;
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

  if (/^[A-Za-z0-9+/=]+$/.test(trimmed)) {
    return {
      mimeType: 'image/jpeg',
      base64: trimmed,
    };
  }

  return null;
}

function tryParseJson(input: string): GeminiApiErrorPayload | null {
  try {
    return JSON.parse(input) as GeminiApiErrorPayload;
  } catch {
    return null;
  }
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
      error.retryAfterMs = 8000;
    }
  }

  return error;
}

function stripCodeFences(text: string): string {
  if (!text.startsWith('```')) return text;
  return text
    .replace(/^```[a-zA-Z]*\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

function clampConfidence(value: unknown): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0.5;
  return Math.max(0, Math.min(1, value));
}

function extractRetryAfterMs(
  parsed: GeminiApiErrorPayload | null,
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
